import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./routes/user.route.js";
import jobRoutes from "./routes/job.route.js";
import messageRoutes from "./routes/message.route.js";
import studentRouter from "./routes/student.route.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/job", jobRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/student", studentRouter);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  pingTimeout: 60000,
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join_chat", (room) => {
    socket.join(room);
  });

  socket.on("new_message", (newMessageReceived) => {
    let chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message_received", newMessageReceived);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { httpServer };