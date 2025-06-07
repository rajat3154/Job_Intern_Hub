import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

let io = null;
const userSocketMap = new Map(); // To store user-socket mappings

export const initializeSocket = (server) => {
      try {
            io = new Server(server, {
                  cors: {
                        origin: process.env.FRONTEND_URL || "http://localhost:5173",
                        methods: ["GET", "POST"],
                        credentials: true
                  },
                  transports: ['websocket', 'polling']
            });

            console.log("Socket.IO initialized successfully");

            io.on("connection", (socket) => {
                  console.log("Client connected:", socket.id);

                  // Add socket mapping when user connects
                  socket.on("setup", (userId) => {
                        userSocketMap.set(userId, socket.id);
                        console.log("User connected:", userId, socket.id);
                  });

                  socket.on("disconnect", () => {
                        // Remove socket mapping when user disconnects
                        for (const [userId, socketId] of userSocketMap.entries()) {
                              if (socketId === socket.id) {
                                    userSocketMap.delete(userId);
                                    console.log("User disconnected:", userId);
                                    break;
                              }
                        }
                  });
            });

            return io;
      } catch (error) {
            console.error("Socket initialization error:", error);
            throw error;
      }
};

export const getReceiverSocketId = (receiverId) => {
      return userSocketMap.get(receiverId);
};

export const getIO = () => {
      if (!io) {
            console.warn("Attempting to use Socket.IO before initialization");
            return null;
      }
      return io;
};

export { app, io, server };
