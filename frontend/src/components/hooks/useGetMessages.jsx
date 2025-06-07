// useGetMessages.js
import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setMessages } from "../../redux/messageSlice";
import toast from "react-hot-toast";

const useGetMessages = (selectedUserId, authUserId) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMessages = async () => {
      // Only fetch if both users are selected
      if (!selectedUserId || !authUserId) return;

      try {
        const res = await axios.get(`/api/v1/message/${selectedUserId}`, {
          withCredentials: true,
        });
        dispatch(setMessages(res.data));
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error(error.response?.data?.message || "Failed to load messages");
      }
    };

    fetchMessages();
  }, [selectedUserId, authUserId, dispatch]);

  return {};
};

export default useGetMessages;
