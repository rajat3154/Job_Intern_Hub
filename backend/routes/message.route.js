import express from "express";
import { getMessage, sendMessage } from "../controllers/message.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Send a message
router.route("/send/:id").post(isAuthenticated, sendMessage);

// Get messages (paginated)
router.route("/:id").get(isAuthenticated, getMessage); // Add ?page=1&limit=20 in client

export default router;
