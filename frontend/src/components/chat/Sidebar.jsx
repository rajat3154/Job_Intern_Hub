import React, { useState, useEffect } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setOtherUsers, setSelectedUser, setUser } from "../../redux/authSlice";
import { setMessages } from "../../redux/messageSlice";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { motion } from "framer-motion";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Fetch both students and recruiters
        const [studentsRes, recruitersRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/v1/student/students`, {
            withCredentials: true,
          }),
          axios.get(`http://localhost:8000/api/v1/recruiter/recruiters`, {
            withCredentials: true,
          }),
        ]);

        // Process students data and filter out logged-in user
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

        // Process recruiters data and filter out logged-in user
        const recruiters =
          recruitersRes.data?.data
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

        console.log("Fetched students:", students);
        console.log("Fetched recruiters:", recruiters);

        const combinedUsers = [...students, ...recruiters];

        setUsers(combinedUsers);
        dispatch(
          setOtherUsers({
            students,
            recruiters,
          })
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error(error.response?.data?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      fetchUsers();
    }
  }, [dispatch, authUser]);

  const logoutHandler = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/v1/logout`, {
        withCredentials: true,
      });
      navigate("/login");
      toast.success(res.data.message);
      dispatch(setUser(null));
      dispatch(setMessages(null));
      dispatch(setOtherUsers({ students: [], recruiters: [] }));
      dispatch(setSelectedUser(null));
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const searchSubmitHandler = (e) => {
    e.preventDefault();
    if (!search.trim()) {
      // If search is empty, show all users again
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

    if (filteredUsers.length > 0) {
      dispatch(
        setOtherUsers({
          students: filteredUsers.filter((u) => u.role === "student"),
          recruiters: filteredUsers.filter((u) => u.role === "recruiter"),
        })
      );
    } else {
      toast.error("No users found!");
    }
  };

  const selectUserHandler = (user) => {
    dispatch(setSelectedUser(user));
  };

  return (
    <div className="border-r border-slate-500 p-4 flex flex-col h-full bg-gray-900 text-white">
      {/* User Profile */}
      {authUser && (
        <div className="flex items-center gap-3 mb-4 p-2 bg-gray-800 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={
                authUser.profile?.profilePhoto ||
                (authUser.role === "student"
                  ? "https://randomuser.me/api/portraits/lego/1.jpg"
                  : "https://randomuser.me/api/portraits/lego/5.jpg")
              }
            />
            <AvatarFallback>
              {authUser.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{authUser.fullName}</h3>
            <p className="text-xs text-gray-400">
              {authUser.role === "student"
                ? `Student (${authUser.status || "Unknown"})`
                : `Recruiter at ${authUser.companyname || "Unknown"}`}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <form
        onSubmit={searchSubmitHandler}
        className="flex items-center gap-2 mb-4"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input bg-gray-800 border-gray-700 text-white rounded-md flex-1"
          type="text"
          placeholder="Search users by name or email..."
        />
        <button
          type="submit"
          className="btn bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
        >
          <BiSearchAlt2 className="w-5 h-5" />
        </button>
      </form>

      <div className="border-b border-gray-700 mb-4"></div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Students Section */}
            {users.filter(user => user.role === "student").length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 px-3">Students</h3>
                {users
                  .filter(user => user.role === "student")
                  .map((user) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                      className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800"
                      onClick={() => selectUserHandler(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            user.profilePhoto ||
                            "https://randomuser.me/api/portraits/lego/1.jpg"
                          }
                        />
                        <AvatarFallback>
                          {user.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <h3 className="font-medium">{user.fullName}</h3>
                        <p className="text-xs text-gray-400">
                          Student ({user.identifier})
                        </p>
                      </div>
                      {user.isOnline && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}

            {/* Recruiters Section */}
            {users.filter(user => user.role === "recruiter").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 px-3">Recruiters</h3>
                {users
                  .filter(user => user.role === "recruiter")
                  .map((user) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                      className="flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-800"
                      onClick={() => selectUserHandler(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            user.profilePhoto ||
                            "https://randomuser.me/api/portraits/lego/5.jpg"
                          }
                        />
                        <AvatarFallback>
                          {user.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <h3 className="font-medium">{user.fullName}</h3>
                        <p className="text-xs text-gray-400">
                          Recruiter at {user.identifier}
                        </p>
                      </div>
                      {user.isOnline && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                    </motion.div>
                  ))}
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

      {/* Logout Button */}
      <div className="mt-auto pt-4">
        <button
          onClick={logoutHandler}
          className="btn w-full bg-red-600 hover:bg-red-700 text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
