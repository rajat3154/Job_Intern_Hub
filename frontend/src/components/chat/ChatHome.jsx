import React, { useState, useEffect, useRef } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { Send, Paperclip, Smile, Video, ChevronLeft } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setOtherUsers, setSelectedUser, setUser } from "../../redux/authSlice";
import { setMessages } from "../../redux/messageSlice";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import Navbar from "../shared/Navbar";
import { io } from "socket.io-client";

const ChatHome = () => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const [unreadCounts, setUnreadCounts] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }

    // Check for selected user in localStorage
    const selectedUser = JSON.parse(localStorage.getItem('selectedUser'));
    if (selectedUser) {
      dispatch(setSelectedUser(selectedUser));
      // Clear localStorage after setting the user
      localStorage.removeItem('selectedUser');
    }
  }, [user, navigate, dispatch]);

  return (
    <div className="min-h-screen bg-black p-6">
      <Navbar />
      <div className="max-w-7xl mx-auto bg-black bg-opacity-90 text-white rounded-lg shadow-lg overflow-hidden border border-gray-800">
        <div className="flex flex-col sm:flex-row h-[calc(100vh-180px)]">
          <Sidebar unreadCounts={unreadCounts} setUnreadCounts={setUnreadCounts} />
          <MessageContainer unreadCounts={unreadCounts} setUnreadCounts={setUnreadCounts} />
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ unreadCounts, setUnreadCounts }) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useSelector((state) => state.auth);
  const messages = useSelector((state) => state.message.messages) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useRef(null);

  const getLatestMessage = (userId) => {
    console.log(
      `[getLatestMessage] Getting latest message for userId: ${userId}`
    );
    const userMessages = messages.filter(
      (msg) => msg.senderId === userId || msg.receiverId === userId
    );
    console.log(`[getLatestMessage] Found ${userMessages.length} messages`);
    if (userMessages.length > 0) {
      const latest = userMessages.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0];
      console.log(`[getLatestMessage] Latest message:`, latest);
      return latest;
    }
    console.log("[getLatestMessage] No messages found");
    return null;
  };

  useEffect(() => {
    if (!authUser?._id) {
      console.log("[useEffect] authUser._id not found, skipping socket setup");
      return;
    }

    console.log("[useEffect] Initializing socket connection...");
    socket.current = io("http://localhost:8000", {
      query: { userId: authUser._id },
      withCredentials: true,
    });

    socket.current.on("connect", () => {
      console.log("[Socket] Connected, emitting user:online");
      socket.current.emit("user:online", authUser._id);
    });

    socket.current.on("disconnect", () => {
      console.log("[Socket] Disconnected, emitting user:offline");
      socket.current.emit("user:offline", authUser._id);
    });

    socket.current.on("user:status", ({ userId, isOnline }) => {
      console.log(
        `[Socket] user:status event received for userId ${userId}: isOnline=${isOnline}`
      );
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isOnline } : user
        )
      );
    });

    return () => {
      if (socket.current) {
        console.log(
          "[useEffect Cleanup] Emitting user:offline and disconnecting socket"
        );
        socket.current.emit("user:offline", authUser._id);
        socket.current.disconnect();
      }
    };
  }, [authUser?._id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("[fetchUsers] Fetching students and recruiters...");
        setLoading(true);

        const [studentsRes, recruitersRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/v1/students`, {
            withCredentials: true,
          }),
          axios.get(`http://localhost:8000/api/v1/recruiter/recruiters`, {
            withCredentials: true,
          }),
        ]);

        console.log("[fetchUsers] Students and recruiters fetched");

        const students =
          studentsRes.data?.data
            ?.filter((student) => student._id !== authUser?._id)
            .map((student) => ({
              _id: student._id,
              fullName: student.fullname,
              email: student.email,
              role: "student",
              profilePhoto: student.profile?.profilePhoto,
              identifier: student.status || "Student",
              isOnline: false,
            })) || [];

        const recruiters =
          recruitersRes.data?.recruiters
            ?.filter((recruiter) => recruiter._id !== authUser?._id)
            .map((recruiter) => ({
              _id: recruiter._id,
              fullName: recruiter.companyname,
              email: recruiter.email,
              role: "recruiter",
              profilePhoto: recruiter.profile?.profilePhoto,
              identifier: recruiter.companyname || "Recruiter",
              isOnline: false,
            })) || [];

        const combinedUsers = [...students, ...recruiters];
        console.log(
          `[fetchUsers] Combined users count: ${combinedUsers.length}`
        );

        setUsers(combinedUsers);
        dispatch(setOtherUsers({ students, recruiters }));

        if (socket.current) {
          console.log("[fetchUsers] Emitting get:onlineStatus for all users");
          socket.current.emit(
            "get:onlineStatus",
            combinedUsers.map((user) => user._id)
          );
        }
      } catch (error) {
        console.error("[fetchUsers] Error fetching users:", error);
        toast.error(error.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      console.log("[useEffect] authUser found, calling fetchUsers");
      fetchUsers();
    }
  }, [dispatch, authUser]);

  const logoutHandler = async () => {
    try {
      console.log("[logoutHandler] Logging out user...");
      await axios.get(`http://localhost:8000/api/v1/logout`, {
        withCredentials: true,
      });
      navigate("/login");
      dispatch(setUser(null));
      dispatch(setMessages(null));
      dispatch(setOtherUsers({ students: [], recruiters: [] }));
      dispatch(setSelectedUser(null));
      toast.success("Logged out successfully");
      console.log("[logoutHandler] Logout successful, redirected to login");
    } catch (error) {
      console.error("[logoutHandler] Logout failed:", error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const searchSubmitHandler = (e) => {
    e.preventDefault();
    console.log(
      `[searchSubmitHandler] Search submitted with query: "${search}"`
    );
    if (!search.trim()) {
      console.log(
        "[searchSubmitHandler] Search is empty, resetting users list"
      );
      dispatch(
        setOtherUsers({
          students: users.filter((u) => u.role === "student"),
          recruiters: users.filter((u) => u.role === "recruiter"),
        })
      );
      return;
    }

    const filteredUsers = users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    console.log(
      `[searchSubmitHandler] Found ${filteredUsers.length} filtered users`
    );
    if (filteredUsers.length > 0) {
      dispatch(
        setOtherUsers({
          students: filteredUsers.filter((u) => u.role === "student"),
          recruiters: filteredUsers.filter((u) => u.role === "recruiter"),
        })
      );
    } else {
      toast.error("No users found!");
      console.log("[searchSubmitHandler] No users matched search query");
    }
  };

  const selectUserHandler = (user) => {
    console.log(
      `[selectUserHandler] User selected: ${user.fullName} (${user._id})`
    );
    dispatch(setSelectedUser(user));
    setUnreadCounts((prev) => ({
      ...prev,
      [user._id]: 0,
    }));
  };

  return (
    <div className="w-full sm:w-1/3 border-r border-gray-800 bg-black bg-opacity-90 overflow-hidden flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-400">Chats</h2>
        </div>

        <form onSubmit={searchSubmitHandler} className="relative">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-gray-900 border-gray-700 text-white pl-10 pr-4 py-2"
          />
          <BiSearchAlt2 className="absolute left-3 top-3 text-gray-400" />
        </form>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {/* Students Section */}
            {users.filter((u) => u.role === "student").length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-2 px-2">
                  Students
                </h3>
                {users
                  .filter((u) => u.role === "student")
                  .map((user) => {
                    const latestMessage = getLatestMessage(user._id);
                    return (
                      <motion.div
                        key={user._id}
                        whileHover={{
                          backgroundColor: "rgba(30, 41, 59, 0.5)",
                        }}
                        className="flex items-center p-3 rounded-lg cursor-pointer"
                        onClick={() => selectUserHandler(user)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                user.profilePhoto ||
                                "https://randomuser.me/api/portraits/lego/1.jpg"
                              }
                            />
                            <AvatarFallback>
                              {user.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
                              user.isOnline ? "bg-green-500" : "bg-gray-500"
                            }`}
                          ></div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white truncate">
                              {user.fullName}
                            </h3>
                            {unreadCounts[user._id] > 0 && (
                              <Badge className="bg-blue-500 text-white">
                                {unreadCounts[user._id]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {latestMessage ? (
                              <>
                                <span className="text-gray-500">
                                  {latestMessage.senderId === authUser._id
                                    ? "You: "
                                    : ""}
                                </span>
                                {latestMessage.message}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}

            {/* Recruiters Section */}
            {users.filter((u) => u.role === "recruiter").length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-2 px-2">
                  Recruiters
                </h3>
                {users
                  .filter((u) => u.role === "recruiter")
                  .map((user) => {
                    const latestMessage = getLatestMessage(user._id);
                    return (
                      <motion.div
                        key={user._id}
                        whileHover={{
                          backgroundColor: "rgba(30, 41, 59, 0.5)",
                        }}
                        className="flex items-center p-3 rounded-lg cursor-pointer"
                        onClick={() => selectUserHandler(user)}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                user.profilePhoto ||
                                "https://randomuser.me/api/portraits/lego/5.jpg"
                              }
                            />
                            <AvatarFallback>
                              {user.fullName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black ${
                              user.isOnline ? "bg-green-500" : "bg-gray-500"
                            }`}
                          ></div>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-white truncate">
                              {user.fullName}
                            </h3>
                            {unreadCounts[user._id] > 0 && (
                              <Badge className="bg-blue-500 text-white">
                                {unreadCounts[user._id]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {latestMessage ? (
                              <>
                                <span className="text-gray-500">
                                  {latestMessage.senderId === authUser._id
                                    ? "You: "
                                    : ""}
                                </span>
                                {latestMessage.message}
                              </>
                            ) : (
                              "No messages yet"
                            )}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}

            {users.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                No users found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current User Profile & Logout */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={authUser?.profile?.profilePhoto} />
              <AvatarFallback>
                {authUser?.fullName?.charAt(0) || authUser?.fullname?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">
                {authUser?.fullName || authUser?.fullname}
              </h3>
              <p className="text-xs text-gray-400">
                {authUser?.role === "student" ? "Student" : "Recruiter"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={logoutHandler}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
const MessageContainer = ({ unreadCounts, setUnreadCounts }) => {
  const { selectedUser } = useSelector((state) => state.auth);
  const { user: authUser } = useSelector((state) => state.auth);
  const messages = useSelector((state) => state.message.messages) || [];
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authUser?._id) return;

    const newSocket = io("http://localhost:8000", {
      query: { userId: authUser._id },
      withCredentials: true
    });

    newSocket.on("connect", () => setError(null));
    newSocket.on("connect_error", (error) => {
      setError("Failed to connect to chat server");
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [authUser?._id]);

  useEffect(() => {
    if (!socket || !authUser?._id) return;

    socket.on("message:new", (message) => {
      const conversationId = message.senderId === authUser._id ? message.receiverId : message.senderId;
      const currentMessages = conversations[conversationId] || [];
      setConversations(prev => ({
        ...prev,
        [conversationId]: [...currentMessages, message]
      }));

      if (conversationId === selectedUser?._id) {
        dispatch(setMessages([...currentMessages, message]));
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));
      }
    });

    return () => socket.off("message:new");
  }, [socket, selectedUser?._id, authUser._id, conversations, dispatch, setUnreadCounts]);

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
        }
      } catch (error) {
        setError(error.response?.data?.error || "Failed to load messages");
        dispatch(setMessages([]));
      } finally {
        setLoading(false);
      }
    };

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
      const response = await axios.post(
        `http://localhost:8000/api/v1/messages/send/${selectedUser._id}`,
        { message: newMessage.trim() },
        { withCredentials: true }
      );

      if (response.data.success && response.data.newMessage) {
        const currentMessages = conversations[selectedUser._id] || [];
        const updatedMessages = [...currentMessages, response.data.newMessage];

        setConversations(prev => ({
          ...prev,
          [selectedUser._id]: updatedMessages
        }));

        dispatch(setMessages(updatedMessages));
        setNewMessage("");
        scrollToBottom();
      }
    } catch (error) {
      setError(error.response?.data?.error || "Failed to send message");
    }
  };

  if (!selectedUser || !authUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-8 text-center">
        <div className="max-w-md">
          <h3 className="text-xl font-semibold text-blue-400 mb-2">No conversation selected</h3>
          <p>Choose a user from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-800 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden mr-2 text-gray-400 hover:text-white"
          onClick={() => dispatch(setSelectedUser(null))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 border-2 border-blue-500">
          <AvatarImage src={selectedUser.profilePhoto} />
          <AvatarFallback>{selectedUser.fullName?.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="ml-3">
          <h3 className="font-semibold text-white">{selectedUser.fullName}</h3>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-1 ${selectedUser.isOnline ? "bg-green-500" : "bg-gray-500"}`}></div>
            <p className="text-xs text-gray-400">
              {selectedUser.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
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
          <div className="flex flex-col space-y-4">
            {[...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.senderId === authUser._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    message.senderId === authUser._id
                      ? "bg-blue-600 rounded-tr-none"
                      : "bg-gray-800 rounded-tl-none"
                  }`}
                >
                  <p className="text-white">{message.message}</p>
                  <p className="text-xs text-gray-300 text-right mt-1">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">No messages yet</h3>
            <p>Start the conversation with {selectedUser.fullName}</p>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-400">
            <Smile className="h-5 w-5" />
          </Button>

          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white focus:border-blue-500"
          />

          <Button
            type="submit"
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatHome;