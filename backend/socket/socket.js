import { Server } from "socket.io";
import http from "http";
import express from "express";
import { Message } from "../models/message.model.js";
import { Student } from "../models/student.model.js";
import { Recruiter } from "../models/recruiter.model.js";
import { setIO } from "../utils/socket.js";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

let io;
const userSockets = new Map();

export const initSocket = (server) => {
      io = new Server(server, {
            cors: {
                  origin: process.env.FRONTEND_URL || "http://localhost:5173",
                  methods: ["GET", "POST"],
                  credentials: true,
                  allowedHeaders: ["Content-Type"]
            },
            transports: ['websocket', 'polling'],
            path: '/socket.io/',
            pingTimeout: 60000
      });

      // Set io instance in utility
      setIO(io);

      // Middleware to verify token
      io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                  return next(new Error("Authentication error"));
            }

            try {
                  const decoded = jwt.verify(token, process.env.JWT_SECRET);
                  socket.user = decoded;
                  next();
            } catch (err) {
                  return next(new Error("Authentication error"));
            }
      });

      io.on("connection", (socket) => {
            console.log("New client connected:", socket.id);

            socket.on("setup", async (userId) => {
                  try {
                        socket.userId = userId;
                        socket.join(userId);
                        userSockets.set(userId, socket.id);
                        socket.emit("connected");

                        // Update user's online status
                        const student = await Student.findById(userId);
                        if (student) {
                              student.isOnline = true;
                              await student.save();
                        } else {
                              const recruiter = await Recruiter.findById(userId);
                              if (recruiter) {
                                    recruiter.isOnline = true;
                                    await recruiter.save();
                              }
                        }

                        // Broadcast user's online status
                        io.emit("user:status", { userId, isOnline: true });
                  } catch (error) {
                        console.error("Error in setup:", error);
                  }
            });

            socket.on("typing:start", ({ receiverId }) => {
                  const receiverSocket = userSockets.get(receiverId);
                  if (receiverSocket) {
                        io.to(receiverSocket).emit("typing:start", { 
                              userId: socket.userId,
                              chatId: `${socket.userId}-${receiverId}`
                        });
                  }
            });

            socket.on("typing:stop", ({ receiverId }) => {
                  const receiverSocket = userSockets.get(receiverId);
                  if (receiverSocket) {
                        io.to(receiverSocket).emit("typing:stop", { 
                              userId: socket.userId,
                              chatId: `${socket.userId}-${receiverId}`
                        });
                  }
            });

            socket.on("disconnect", async () => {
                  if (socket.userId) {
                        const userId = socket.userId;
                        userSockets.delete(userId);
                        
                        try {
                              // Update user's offline status and lastSeen
                              const student = await Student.findById(userId);
                              if (student) {
                                    student.isOnline = false;
                                    student.lastSeen = new Date();
                                    await student.save();
                              } else {
                                    const recruiter = await Recruiter.findById(userId);
                                    if (recruiter) {
                                          recruiter.isOnline = false;
                                          recruiter.lastSeen = new Date();
                                          await recruiter.save();
                                    }
                              }

                              // Broadcast user's offline status
                              io.emit("user:status", { userId, isOnline: false });
                        } catch (error) {
                              console.error("Error updating user status:", error);
                        }
                  }
            });

            socket.on("join_chat", (chatId) => {
                  socket.join(chatId);
                  console.log("User joined chat:", chatId);
            });

            socket.on("new_message", (message) => {
                  const receiverSocket = userSockets.get(message.receiverId);
                  if (receiverSocket) {
                        io.to(receiverSocket).emit("message_received", message);
                  }
            });

            socket.on("mark_messages_read", async ({ senderId, receiverId }) => {
                  try {
                        // Update all unread messages from this sender to read
                        await Message.updateMany(
                              {
                                    senderId,
                                    receiverId,
                                    read: false
                              },
                              { $set: { read: true } }
                        );

                        // Notify the sender that their messages have been read
                        const senderSocket = userSockets.get(senderId);
                        if (senderSocket) {
                              io.to(senderSocket).emit("messages_read", {
                                    readerId: receiverId
                              });
                        }
                  } catch (error) {
                        console.error("Error marking messages as read:", error);
                  }
            });
      });

      return io;
};

export const getIO = () => {
      if (!io) throw new Error("Socket.io not initialized");
      return io;
};

export const getReceiverSocketId = (receiverId) => {
      return userSockets.get(receiverId);
};

export { app, io, server };
