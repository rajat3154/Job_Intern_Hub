import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser, setOnlineUsers } from "../../redux/authSlice";
import { io } from "socket.io-client";
import Sidebar from "./Sidebar";
import MessageContainer from "./MessageContainer";
import Navbar from "../shared/Navbar";

const ChatHome = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { selectedUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [unreadCounts, setUnreadCounts] = useState({});
  const socket = useRef(null);

  useEffect(() => {
    if (!authUser?._id) return;

    // Initialize socket connection
    socket.current = io("http://localhost:8000", {
      withCredentials: true,
    });

    // Setup user connection
    socket.current.emit("setup", authUser._id);

    // Listen for user status updates
    socket.current.on("user:status", ({ userId, isOnline }) => {
      dispatch(setOnlineUsers({ userId, isOnline }));
    });

    return () => {
        if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [authUser?._id, dispatch]);

  const handleSelectUser = (user) => {
    dispatch(setSelectedUser(user));
  };

  return (
    <>
    <Navbar/>
      <div className="flex  bg-black mx-auto h-screen">
        <div className="flex justify-center  w-7xl h-150 bg-black mx-auto ">
          <Sidebar
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            unreadCounts={unreadCounts}
            setUnreadCounts={setUnreadCounts}
            socket={socket}
          />
          <MessageContainer
            selectedUser={selectedUser}
            unreadCounts={unreadCounts}
            setUnreadCounts={setUnreadCounts}
            socket={socket}
          />
        </div>
      </div>
    </>
  );
};

export default ChatHome;