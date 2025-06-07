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
import { app, io, server } from "./socket/socket.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initializeSocket } from "./socket/index.js";
import http from "http";
dotenv.config({});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
      origin: ["http://localhost:5173"],
      credentials: true
};
app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;

app.use("/api/v1", studentRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/internship", internshipRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/messages", messageRoute);
app.use("/api/v1/follow", followRoute);
app.use('/api/notifications', notificationRoutes);

server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      connectDB();
});
