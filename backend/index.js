import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import jobRoute from "./routes/job.route.js"
import internshipRoute from "./routes/internship.route.js"
import studentRoute from "./routes/student.route.js";
import applicationRoute from "./routes/application.route.js"
import adminRoute from "./routes/admin.route.js"
import messageRoute from "./routes/message.route.js"
import followRoute from "./routes/follow.routes.js"
import { createServer } from "http";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initializeSocket } from "./socket/index.js";
import http from "http";
dotenv.config({});

const PORT = process.env.PORT || 8000;

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const corsOptions = {
      origin: ["http://localhost:5173"],
      credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Fix message route mounting
app.use("/api/v1/message", messageRoute);

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

app.use("/api/v1", studentRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/internship", internshipRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/follow", followRoute);
app.use('/api/notifications', notificationRoutes);

server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      connectDB();
});
