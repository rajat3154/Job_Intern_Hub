import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
      try {
            const senderId = req.user.id;
            const receiverId = req.params.id;
            const { message } = req.body;

            if (!senderId || !receiverId || !message) {
                  return res.status(400).json({
                        success: false,
                        error: "Missing sender, receiver, or message",
                  });
            }

            if (senderId.toString() === receiverId.toString()) {
                  return res.status(400).json({
                        success: false,
                        error: "Cannot send message to yourself",
                  });
            }

            // Step 1: Create the message document
            const newMessage = await Message.create({
                  senderId,
                  receiverId,
                  message,
                  read: false,
            });

            // Step 2: Sort participants to ensure consistent order
            const participants = [senderId, receiverId].sort((a, b) =>
                  a.toString().localeCompare(b.toString())
            );

            // Step 3: Find existing conversation or create new one with the message
            const conversation = await Conversation.findOneAndUpdate(
                  { "participants.0": participants[0], "participants.1": participants[1] },
                  {
                        $setOnInsert: { participants },
                        $addToSet: { messages: newMessage._id },
                  },
                  { new: true, upsert: true }
            );

            // Step 4: Emit message event to receiver if connected
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                  io.to(receiverSocketId).emit("message:new", newMessage);
            }

            return res.status(201).json({
                  success: true,
                  message: "Message sent successfully",
                  newMessage,
            });
      } catch (error) {
            console.error("sendMessage error:", error);
            return res.status(500).json({
                  success: false,
                  error: "Internal server error",
                  details: error.message,
            });
      }
};

export const getMessage = async (req, res) => {
      try {
            const senderId = req.user.id;
            const receiverId = req.params.id;

            if (!senderId || !receiverId) {
                  return res.status(400).json({
                        success: false,
                        error: "Sender or Receiver ID missing",
                  });
            }

            // Sort participants for consistent querying
            const participants = [senderId, receiverId].sort((a, b) =>
                  a.toString().localeCompare(b.toString())
            );

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            // Fetch conversation and populate messages with pagination and sorting
            const conversation = await Conversation.findOne({ participants }).populate({
                  path: "messages",
                  options: {
                        sort: { createdAt: -1 },
                        limit,
                        skip,
                  },
            });

            if (!conversation) {
                  return res.status(200).json({ success: true, messages: [] });
            }

            return res.status(200).json({ success: true, messages: conversation.messages });
      } catch (error) {
            console.error("getMessage error:", error);
            return res.status(500).json({
                  success: false,
                  error: "Internal server error",
                  details: error.message,
            });
      }
};
