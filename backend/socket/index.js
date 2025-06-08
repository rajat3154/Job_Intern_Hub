import { Server } from "socket.io";

let io = null; // Initialize as null
const userSockets = new Map();

export const initializeSocket = (server) => {
      io = new Server(server, {
            cors: {
                  origin: process.env.FRONTEND_URL || "http://localhost:5173",
                  methods: ["GET", "POST"],
                  credentials: true,
            },
            transports: ['websocket', 'polling'],
      });

      io.on("connection", (socket) => {
            console.log("New client connected:", socket.id);

            socket.on("setup", (userId) => {
                  socket.userId = userId;
                  socket.join(userId);
                  userSockets.set(userId, socket.id);
                  socket.emit("connected");
                  io.emit("user:status", { userId, isOnline: true });
            });

            socket.on("disconnect", () => {
                  if (socket.userId) {
                        userSockets.delete(socket.userId);
                        io.emit("user:status", { userId: socket.userId, isOnline: false });
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
      });

      return io;
};

export const getIO = () => {
      if (!io) {
            throw new Error("Socket.io not initialized");
      }
      return io;
};

export const getReceiverSocketId = (receiverId) => {
      return userSockets.get(receiverId);
};