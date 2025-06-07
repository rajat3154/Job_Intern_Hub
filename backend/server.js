import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from './app.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log("Connected to socket.io", socket.id);

    socket.on("setup", (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.join(userId);
        console.log("User connected:", userId);
        io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
        const userId = [...onlineUsers.entries()]
            .find(([_, socketId]) => socketId === socket.id)?.[0];
            
        if (userId) {
            onlineUsers.delete(userId);
            io.emit("online-users", Array.from(onlineUsers.keys()));
        }
    });

    socket.on("message", (message) => {
        const receiverSocketId = onlineUsers.get(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("new-message", message);
        }
    });
});

const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});