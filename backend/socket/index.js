import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Student } from '../models/student.model.js';
import { Recruiter } from '../models/recruiter.model.js';
import { createNotification } from '../controllers/notificationController.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import dotenv from 'dotenv';

dotenv.config();

let io;

const initializeSocket = (server) => {
      console.log('Initializing Socket.IO server...');

      io = new Server(server, {
            cors: {
                  origin: process.env.FRONTEND_URL || "http://localhost:5173",
                  methods: ["GET", "POST"],
                  credentials: true
            },
            transports: ['websocket', 'polling']
      });

      // Authentication middleware
      io.use(async (socket, next) => {
            try {
                  console.log('Socket authentication attempt...');
                  const token = socket.handshake.auth.token;
                  if (!token) {
                        console.log('No token provided in socket handshake');
                        return next(new Error('Authentication error'));
                  }

                  const decoded = jwt.verify(token, process.env.SECRET_KEY);
                  console.log('Token decoded for user:', decoded.userId);

                  // Try to find user in both Student and Recruiter models
                  let user = await Student.findById(decoded.userId);
                  if (!user) {
                        user = await Recruiter.findById(decoded.userId);
                  }

                  if (!user) {
                        console.log('User not found for socket authentication');
                        return next(new Error('User not found'));
                  }

                  socket.user = user;
                  console.log('Socket authenticated for user:', user._id);
                  next();
            } catch (error) {
                  console.error('Socket authentication error:', error);
                  next(new Error('Authentication error'));
            }
      });

      io.on('connection', (socket) => {
            console.log('User connected:', socket.user._id);
            console.log('Socket ID:', socket.id);

            // Join user's personal room for notifications
            const userRoom = socket.user._id.toString();
            socket.join(userRoom);
            console.log('User joined their notification room:', userRoom);

            // Handle follow event
            socket.on('follow', async (data) => {
                  try {
                        console.log('Follow event received:', data);
                        const { followedUserId, followerId, followerName } = data;

                        if (!followedUserId || !followerId || !followerName) {
                              console.error('Missing required data for follow notification');
                              socket.emit('followError', { message: 'Missing required data' });
                              return;
                        }

                        // Create notification for the followed user
                        const notification = await createNotification(
                              followedUserId,
                              followerId,
                              'follow',
                              'New Follower',
                              `${followerName} started following you`
                        );
                        console.log('Created notification:', notification);

                        // Emit notification to the followed user's room only
                        console.log('Emitting notification to user:', followedUserId);
                        io.to(followedUserId.toString()).emit('newNotification', notification);

                        // Acknowledge the follow event to the sender
                        socket.emit('followAcknowledged', {
                              success: true,
                              notification
                        });

                        console.log('Notification emitted successfully');
                  } catch (error) {
                        console.error('Error handling follow notification:', error);
                        socket.emit('followError', {
                              message: 'Failed to create notification',
                              error: error.message
                        });
                  }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                  console.log('User disconnected:', socket.user._id);
                  console.log('Socket ID:', socket.id);
            });

            // Handle errors
            socket.on('error', (error) => {
                  console.error('Socket error:', error);
            });
      });

      return io;
};

const getIO = () => {
      if (!io) {
            console.error('Socket.io not initialized');
            throw new Error('Socket.io not initialized');
      }
      return io;
};

export {
      initializeSocket,
      getIO
}; 