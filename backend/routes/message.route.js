import express from "express";
import { getMessage, sendMessage } from "../controllers/message.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Get messages between two users
router.route("/:id").get(isAuthenticated, getMessage);

// Send a message to a user
router.route("/send/:id").post(isAuthenticated, sendMessage);

export default router;
