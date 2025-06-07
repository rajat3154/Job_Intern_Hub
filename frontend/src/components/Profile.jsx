import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./shared/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Contact,
  Mail,
  Pen,
  MessageSquare,
  Loader2,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Users,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Badge } from "./ui/badge";
import AppliedJobTable from "./AppliedJobTable";
import UpdateProfileDialog from "./UpdateProfileDialog";
import { useSelector } from "react-redux";
import useGetAppliedJobs from "./hooks/useGetAppliedJobs";
import FollowButton from "./FollowButton";
import FollowList from "./FollowList";
import UsersToFollow from "./UsersToFollow";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const Profile = () => {
  const [open, setOpen] = useState(false);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const { user: currentUser } = useSelector((store) => store.auth);
  const { appliedJobs, loading: jobsLoading } = useGetAppliedJobs();
  const { userId, userType } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const endpoint =
          userId && userType
            ? `http://localhost:8000/api/v1/${userType.toLowerCase()}/${userId}`
            : `http://localhost:8000/api/v1/${currentUser.role.toLowerCase()}/${
                currentUser._id
              }`;

        const response = await axios.get(endpoint, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        setProfileUser(response.data.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, userType, currentUser]);

  useEffect(() => {
    const fetchFollowData = async () => {
      if (!profileUser?._id) return;

      try {
        setFollowersLoading(true);
        setFollowingLoading(true);

        const [followersRes, followingRes] = await Promise.all([
          axios.get(
            `http://localhost:8000/api/v1/follow/followers/${profileUser._id}/${profileUser.role}`,
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          ),
          axios.get(
            `http://localhost:8000/api/v1/follow/following/${profileUser._id}/${profileUser.role}`,
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          ),
        ]);

        setFollowers(followersRes.data.data);
        setFollowing(followingRes.data.data);
      } catch (error) {
        console.error("Error fetching follow data:", error);
        toast.error("Failed to load connections");
      } finally {
        setFollowersLoading(false);
        setFollowingLoading(false);
      }
    };

    fetchFollowData();
  }, [profileUser]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      const followersButton = document.getElementById("followers-button");
      const followingButton = document.getElementById("following-button");
      const followersPopup = document.getElementById("followers-popup");
      const followingPopup = document.getElementById("following-popup");

      if (
        followersOpen &&
        !followersButton?.contains(event.target) &&
        !followersPopup?.contains(event.target)
      ) {
        setFollowersOpen(false);
      }

      if (
        followingOpen &&
        !followingButton?.contains(event.target) &&
        !followingPopup?.contains(event.target)
      ) {
        setFollowingOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [followersOpen, followingOpen]);

  const handleMessageClick = () => {
    // Store the selected user in localStorage with all necessary data
    const selectedUser = {
      _id: profileUser._id,
      fullName: profileUser.fullname || profileUser.companyname,
      email: profileUser.email,
      role: profileUser.role.toLowerCase(),
      profilePhoto: profileUser.profile?.profilePhoto,
      identifier:
        profileUser.role === "STUDENT"
          ? "Student"
          : profileUser.companyname || "Recruiter",
      isOnline: false,
    };
    localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    navigate("/messages");
  };

  const handleFollowCountChange = (isFollowing) => {
    setFollowers((prevFollowers) => {
      if (isFollowing) {
        // Add current user to followers list
        return [
          ...prevFollowers,
          {
            _id: currentUser._id,
            fullname: currentUser.fullname || currentUser.companyname,
            role: currentUser.role,
            profile: { profilePhoto: currentUser.profile?.profilePhoto },
          },
        ];
      } else {
        // Remove current user from followers list
        return prevFollowers.filter(
          (follower) => follower._id !== currentUser._id
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const isOwnProfile = !userId || (currentUser && currentUser._id === userId);
  const isStudent = profileUser?.role?.toUpperCase() === "STUDENT";

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-3 p-3">
          {/* Main Profile Section */}
          <div className="lg:col-span-3 space-y-3">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-blue-500/30">
                        <AvatarImage
                          src={profileUser?.profile?.profilePhoto}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg bg-gray-800 text-blue-400">
                          {(
                            profileUser?.fullname || profileUser?.companyname
                          )?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="font-bold text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                          {profileUser?.fullname || profileUser?.companyname}
                        </h1>
                        <p className="text-gray-400 text-xs">
                          {profileUser?.profile?.headline ||
                            (profileUser?.role?.toUpperCase() === "STUDENT"
                              ? "Student"
                              : "Recruiter")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {!isOwnProfile && (
                        <>
                          <FollowButton
                            userId={profileUser._id}
                            userType={profileUser.role}
                            onFollowSuccess={() => {
                              // Any additional success handling
                            }}
                            onFollowCountChange={handleFollowCountChange}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMessageClick}
                            className="text-blue-400 border-blue-400/50 hover:bg-blue-400/10 hover:text-blue-400 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        </>
                      )}
                      {isOwnProfile && (
                        <Button
                          onClick={() => setOpen(true)}
                          variant="outline"
                          size="sm"
                          className="text-blue-400 border-blue-400/50 hover:bg-blue-400/10 hover:text-blue-400 text-xs"
                        >
                          <Pen className="h-3 w-3 mr-1" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Connections Count */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative">
                      <Button
                        id="followers-button"
                        variant="ghost"
                        className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={() => {
                          setFollowersOpen(!followersOpen);
                          setFollowingOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {followersLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>{followers.length} Followers</span>
                        )}
                      </Button>
                      {followersOpen && (
                        <div
                          id="followers-popup"
                          className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50"
                        >
                          <div className="p-4">
                            <h3 className="font-semibold text-blue-400 mb-2">
                              Followers
                            </h3>
                            <ScrollArea className="h-[300px] pr-4">
                              {followersLoading ? (
                                <div className="flex justify-center items-center h-32">
                                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                              ) : followers.length > 0 ? (
                                <div className="space-y-3">
                                  {followers.map((follower) => (
                                    <div
                                      key={follower._id}
                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                                      onClick={() => {
                                        navigate(
                                          `/profile/${follower.role.toLowerCase()}/${
                                            follower._id
                                          }`
                                        );
                                        setFollowersOpen(false);
                                      }}
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={follower.profile?.profilePhoto}
                                        />
                                        <AvatarFallback className="bg-gray-800 text-blue-400">
                                          {(
                                            follower.fullname ||
                                            follower.companyname
                                          )?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                          {follower.fullname ||
                                            follower.companyname}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                          {follower.role}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-center py-4">
                                  No followers yet
                                </p>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <Button
                        id="following-button"
                        variant="ghost"
                        className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={() => {
                          setFollowingOpen(!followingOpen);
                          setFollowersOpen(false);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {followingLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span>{following.length} Following</span>
                        )}
                      </Button>
                      {followingOpen && (
                        <div
                          id="following-popup"
                          className="absolute top-full left-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50"
                        >
                          <div className="p-4">
                            <h3 className="font-semibold text-blue-400 mb-2">
                              Following
                            </h3>
                            <ScrollArea className="h-[300px] pr-4">
                              {followingLoading ? (
                                <div className="flex justify-center items-center h-32">
                                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                              ) : following.length > 0 ? (
                                <div className="space-y-3">
                                  {following.map((followed) => (
                                    <div
                                      key={followed._id}
                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                                      onClick={() => {
                                        navigate(
                                          `/profile/${followed.role.toLowerCase()}/${
                                            followed._id
                                          }`
                                        );
                                        setFollowingOpen(false);
                                      }}
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage
                                          src={followed.profile?.profilePhoto}
                                        />
                                        <AvatarFallback className="bg-gray-800 text-blue-400">
                                          {(
                                            followed.fullname ||
                                            followed.companyname
                                          )?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                          {followed.fullname ||
                                            followed.companyname}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                          {followed.role}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-center py-4">
                                  Not following anyone yet
                                </p>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-blue-400 mb-1">
                      About
                    </h2>
                    <p className="text-gray-300 text-xs">
                      {profileUser?.profile?.bio || "No bio provided yet."}
                    </p>
                  </div>

                  <Separator className="bg-gray-800 my-3" />

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-300 text-xs">
                      <Mail className="text-blue-400 h-3 w-3" />
                      <span>{profileUser?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 text-xs">
                      <Contact className="text-blue-400 h-3 w-3" />
                      <span>
                        {profileUser?.phonenumber ||
                          profileUser?.phoneNumber ||
                          "Not provided"}
                      </span>
                    </div>
                    {profileUser?.profile?.website && (
                      <div className="flex items-center gap-2 text-gray-300 text-xs">
                        <LinkIcon className="text-blue-400 h-3 w-3" />
                        <a
                          href={profileUser.profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-400 hover:underline"
                        >
                          {profileUser.profile.website}
                        </a>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-800 my-3" />

                  {/* Skills */}
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-1">
                      {isStudent ? (
                        <>
                          <GraduationCap className="h-3 w-3" />
                          Skills & Education
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-3 w-3" />
                          Company Details
                        </>
                      )}
                    </h2>
                    <div className="flex flex-wrap gap-1">
                      {profileUser?.profile?.skills?.length > 0 ? (
                        profileUser.profile.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs px-2 py-0.5"
                          >
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">
                          No skills added
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resume - Only show for students */}
                  {isStudent && (
                    <>
                      <Separator className="bg-gray-800 my-3" />
                      <div className="mb-3">
                        <h2 className="text-sm font-semibold text-blue-400 mb-1">
                          Resume
                        </h2>
                        {profileUser?.profile?.resume ? (
                          <a
                            href={profileUser.profile.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline text-xs"
                          >
                            <LinkIcon className="h-3 w-3" />
                            {profileUser.profile.resumeOriginalName ||
                              "View Resume"}
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            No resume uploaded
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Applied Jobs - Only show for students on their own profile */}
                  {isOwnProfile && isStudent && (
                    <>
                      <Separator className="bg-gray-800 my-3" />
                      <div className="mb-3">
                        <h2 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          Applied Jobs
                        </h2>
                        {jobsLoading ? (
                          <div className="flex justify-center items-center h-16">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          </div>
                        ) : appliedJobs && appliedJobs.length > 0 ? (
                          <div>
                            <Table className="min-w-full bg-black text-white rounded-lg shadow-lg overflow-hidden">
                              <TableHeader className="bg-blue-600">
                                <TableRow>
                                  <TableHead className="text-white py-3 px-4">
                                    Date
                                  </TableHead>
                                  <TableHead className="text-white py-3 px-4">
                                    Job Role
                                  </TableHead>
                                  <TableHead className="text-white py-3 px-4">
                                    Company
                                  </TableHead>
                                  <TableHead className="text-white py-3 px-4 text-right">
                                    Status
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {appliedJobs.slice(0, 3).map((appliedJob) => (
                                  <TableRow
                                    key={appliedJob._id}
                                    className="hover:bg-blue-700 transition-all duration-200"
                                  >
                                    <TableCell className="py-3 px-4">
                                      {appliedJob?.createdAt?.split("T")[0]}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                      {appliedJob.job?.title}
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                      {appliedJob.job?.created_by?.companyname}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                      <Badge
                                        className={`${
                                          appliedJob?.status === "rejected"
                                            ? "bg-red-400 text-white"
                                            : appliedJob.status === "pending"
                                            ? "bg-gray-400 text-white"
                                            : "bg-green-400 text-white"
                                        } py-1 px-3 rounded-full`}
                                      >
                                        {appliedJob.status.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {appliedJobs.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-sm text-white hover:text-blue-400 hover:bg-gray-800/50 mt-2"
                                onClick={() => navigate("/applied-jobs")}
                              >
                                View all {appliedJobs.length} applications
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-white">
                            You haven't applied to any jobs yet.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Users to Follow */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <UsersToFollow />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Update Dialog */}
      <UpdateProfileDialog open={open} setOpen={setOpen} />
    </div>
  );
};

export default Profile;
