import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
      cors: {
            origin: ["http://localhost:5173"],
            methods: ["GET", "POST"],
            credentials: true
      }
});

// Make socket maps globally available
global.userSocketMap = {}; // { userId: socketId }
global.onlineUsers = new Set(); // Track online users
global.io = io; // Make io instance globally available

// Get receiver's socketId for private messaging
export const getReceiverSocketId = (receiverId) => {
      return userSocketMap[receiverId];
};

// Socket connection logic
io.on("connection", (socket) => {
      const userId = socket.handshake.query.userId;

      if (userId) {
            userSocketMap[userId] = socket.id;
            onlineUsers.add(userId);
            console.log(`User connected: ${userId} => ${socket.id}`);

            // Notify all clients of user coming online
            io.emit("user:status", { userId, isOnline: true });
      }

      // Handle user online status
      socket.on("user:online", (userId) => {
            onlineUsers.add(userId);
            io.emit("user:status", { userId, isOnline: true });
      });

      // Handle user offline status
      socket.on("user:offline", (userId) => {
            onlineUsers.delete(userId);
            io.emit("user:status", { userId, isOnline: false });
      });

      // Handle get online status request
      socket.on("get:onlineStatus", (userIds) => {
            userIds.forEach(userId => {
                  socket.emit("user:status", {
                        userId,
                        isOnline: onlineUsers.has(userId)
                  });
            });
      });

      // Handle new messages
      socket.on("message:new", (message) => {
            const receiverId = message.receiverId;
            const receiverSocketId = getReceiverSocketId(receiverId);

            if (receiverSocketId) {
                  io.to(receiverSocketId).emit("message:new", message);
            }
      });

      socket.on("disconnect", () => {
            if (userId) {
                  delete userSocketMap[userId];
                  onlineUsers.delete(userId);
                  console.log(`User disconnected: ${userId}`);
                  io.emit("user:status", { userId, isOnline: false });
            }
      });
});

export { app, io, server };
