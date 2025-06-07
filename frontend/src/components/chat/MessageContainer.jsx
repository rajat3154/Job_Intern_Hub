import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SendIcon } from "lucide-react";
import axios from "axios";
import { setMessages } from "../../redux/messageSlice";
import { io } from "socket.io-client";

const MessageContainer = () => {
      const { selectedUser } = useSelector((state) => state.auth);
      const { user: authUser } = useSelector((state) => state.auth);
      const messages = useSelector((state) => state.message.messages) || [];
      const dispatch = useDispatch();
      const [newMessage, setNewMessage] = useState("");
      const [socket, setSocket] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [conversations, setConversations] = useState({});

      // Initialize socket connection
      useEffect(() => {
            if (!authUser?._id) return;

            const newSocket = io("http://localhost:8000", {
                  query: {
                        userId: authUser._id
                  },
                  withCredentials: true
            });

            newSocket.on("connect", () => {
                  console.log("Socket connected");
                  setError(null);
            });

            newSocket.on("connect_error", (error) => {
                  console.error("Socket connection error:", error);
                  setError("Failed to connect to chat server");
            });

            setSocket(newSocket);

            return () => {
                  newSocket.disconnect();
            };
      }, [authUser?._id]);

      // Listen for new messages
      useEffect(() => {
            if (!socket) return;

            socket.on("message:new", (message) => {
                  const conversationId = message.senderId === authUser._id ? message.receiverId : message.senderId;
                  const currentMessages = conversations[conversationId] || [];
                  setConversations(prev => ({
                        ...prev,
                        [conversationId]: [...currentMessages, message]
                  }));

                  // Update Redux store if this is the current conversation
                  if (conversationId === selectedUser?._id) {
                        dispatch(setMessages([...currentMessages, message]));
                  }
            });

            return () => {
                  socket.off("message:new");
            };
      }, [socket, selectedUser?._id, authUser._id, conversations, dispatch]);

      // Fetch messages when both users are available
      useEffect(() => {
            const fetchMessages = async () => {
                  if (!selectedUser?._id || !authUser?._id) return;

                  try {
                        setLoading(true);
                        setError(null);
                        const response = await axios.get(
                              `http://localhost:8000/api/v1/messages/${selectedUser._id}`,
                              { withCredentials: true }
                        );
                        
                        if (response.data.success) {
                              const messagesData = Array.isArray(response.data.messages) ? response.data.messages : [];
                              dispatch(setMessages(messagesData));
                              setConversations(prev => ({
                                    ...prev,
                                    [selectedUser._id]: messagesData
                              }));
                        } else {
                              throw new Error(response.data.error || "Failed to fetch messages");
                        }
                  } catch (error) {
                        console.error("Error fetching messages:", error);
                        setError(error.response?.data?.error || "Failed to load messages. Please try again.");
                        dispatch(setMessages([]));
                  } finally {
                        setLoading(false);
                  }
            };

            // If we already have messages for this conversation, use them
            if (conversations[selectedUser?._id]) {
                  dispatch(setMessages(conversations[selectedUser._id]));
            } else {
                  fetchMessages();
            }
      }, [selectedUser?._id, authUser?._id, dispatch, conversations]);

      const handleSendMessage = async (e) => {
            e.preventDefault();
            if (!newMessage.trim() || !selectedUser?._id || !authUser?._id) return;

            try {
                  setError(null);
                  const response = await axios.post(
                        `http://localhost:8000/api/v1/messages/send/${selectedUser._id}`,
                        { message: newMessage.trim() },
                        { withCredentials: true }
                  );

                  if (response.data.success && response.data.newMessage) {
                        const currentMessages = conversations[selectedUser._id] || [];
                        const updatedMessages = [...currentMessages, response.data.newMessage];
                        
                        // Update conversations state
                        setConversations(prev => ({
                              ...prev,
                              [selectedUser._id]: updatedMessages
                        }));
                        
                        // Update Redux store
                        dispatch(setMessages(updatedMessages));
                        setNewMessage("");
                  } else {
                        throw new Error(response.data.error || "Failed to send message");
                  }
            } catch (error) {
                  console.error("Error sending message:", error);
                  setError(error.response?.data?.error || "Failed to send message. Please try again.");
            }
      };

      if (!selectedUser) {
            return (
                  <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400">
                        <p>Select a user to start chatting</p>
                  </div>
            );
      }

      return (
            <div className="flex-1 flex flex-col bg-gray-900">
                  {/* Chat header */}
                  <div className="p-4 border-b border-gray-800 flex items-center">
                        <Avatar className="h-10 w-10">
                              <AvatarImage src={selectedUser.profilePhoto} />
                              <AvatarFallback>
                                    {selectedUser.fullName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                              <h3 className="font-medium text-white">{selectedUser.fullName}</h3>
                              <p className="text-xs text-gray-400">
                                    {selectedUser.isOnline ? "Online" : "Offline"}
                              </p>
                        </div>
                  </div>

                  {/* Error message */}
                  {error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                              {error}
                        </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                              <div className="flex justify-center items-center h-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                              </div>
                        ) : Array.isArray(messages) && messages.length > 0 ? (
                              messages.map((message) => (
                                    <div
                                          key={message._id}
                                          className={`flex ${
                                                message.senderId === authUser._id
                                                      ? "justify-end"
                                                      : "justify-start"
                                          }`}
                                    >
                                          <div
                                                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                                                      message.senderId === authUser._id
                                                            ? "bg-blue-600 rounded-tr-none"
                                                            : "bg-gray-800 rounded-tl-none"
                                                }`}
                                          >
                                                <p>{message.message}</p>
                                                <p className="text-xs text-gray-300 text-right mt-1">
                                                      {new Date(message.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                      })}
                                                </p>
                                          </div>
                                    </div>
                              ))
                        ) : (
                              <div className="flex justify-center items-center h-20 text-gray-400">
                                    <p>No messages yet. Start the conversation!</p>
                              </div>
                        )}
                  </div>

                  {/* Message input */}
                  <div className="p-4 border-t border-gray-800">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                              <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-800 border-gray-700 text-white rounded-md px-4 py-2"
                              />
                              <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className={`p-2 rounded-md ${
                                          newMessage.trim()
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    }`}
                              >
                                    <SendIcon className="h-5 w-5" />
                              </button>
                        </form>
                  </div>
            </div>
      );
};

export default MessageContainer;
