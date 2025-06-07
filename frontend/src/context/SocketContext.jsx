import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext"; // Your custom auth hook/context

// Create a context for socket
const SocketContext = createContext(null);

// Custom hook to access socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// SocketProvider component to wrap your app
export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth(); // Get user and token from your auth context
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Attempt to get token from localStorage if not available from context
    const authToken = token || localStorage.getItem("token");

    console.log("Initializing socket connection...");

    // Connect socket.io client with or without token as auth
    const newSocket = io("http://localhost:8000", {
      auth: authToken ? { token: authToken } : undefined,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    // Socket connected event
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      if (!authToken) {
        console.warn("Socket connected without authentication token");
        toast("Connected to notifications without authentication", { icon: "⚠️" });
      } else {
        toast.success("Connected to real-time notifications");
      }
    });

    // Connection error handling
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      toast.error("Failed to connect to notifications");
    });

    // General socket errors
    newSocket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    // Handle disconnection and try manual reconnect if server disconnects
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        newSocket.connect(); // manual reconnect
      }
    });

    // Example: Handle receiving a new notification
    newSocket.on("newNotification", (notification) => {
      console.log("Received new notification:", notification);
      toast.success("New notification received!");
      // You can also dispatch to Redux or update local state here
    });

    setSocket(newSocket);

    // Cleanup on unmount or when user/token changes
    return () => {
      console.log("Cleaning up socket...");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
