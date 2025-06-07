import React, { useEffect } from "react";
import Message from "./Message";
import useGetMessages from "../hooks/useGetMessages";
import { useSelector, useDispatch } from "react-redux";
import useGetRealTimeMessage from "../hooks/useGetRealTimeMessage";
import { setSelectedUser } from "../../redux/userSlice";

const Messages = () => {
  const dispatch = useDispatch();
  const { messages } = useSelector((store) => store.message);
  const { authUser } = useSelector((store) => store.user);

  useEffect(() => {
    // Get selected user from localStorage
    const selectedUser = JSON.parse(localStorage.getItem('selectedUser'));
    if (selectedUser) {
      dispatch(setSelectedUser(selectedUser));
      // Clear localStorage after setting the user
      localStorage.removeItem('selectedUser');
    }
  }, [dispatch]);

  // Pass the selected user ID to useGetMessages
  useGetMessages(authUser?._id);
  useGetRealTimeMessage();

  return (
    <div className="px-4 flex-1 overflow-auto">
      {messages &&
        messages?.map((message) => {
          return <Message key={message._id} message={message} />;
        })}
    </div>
  );
};

export default Messages;
