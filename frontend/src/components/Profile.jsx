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
} from "lucide-react";
import { Badge } from "./ui/badge";
import UpdateProfileDialog from "./UpdateProfileDialog";
import { useSelector } from "react-redux";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Table,
  TableBody,
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
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [appliedInternships, setAppliedInternships] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [internshipsLoading, setInternshipsLoading] = useState(true);
  const { user: currentUser } = useSelector((store) => store.auth);
  const { userId, userType } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        let endpoint;

        if (userId && userType) {
          endpoint = `http://localhost:8000/api/v1/${userType.toLowerCase()}/${userId}`;
        } else if (currentUser?._id) {
          endpoint = `http://localhost:8000/api/v1/${currentUser.role.toLowerCase()}/${
            currentUser._id
          }`;
        } else {
          toast.error("No user ID available");
          setLoading(false);
          return;
        }

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

    if (userId || currentUser?._id) {
      fetchUserProfile();
    }
  }, [userId, userType, currentUser?._id, navigate]);

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

  const fetchAppliedJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await axios.get(
        "http://localhost:8000/api/v1/application/get",
        {
          withCredentials: true,
        }
      );
      console.log("Applied Jobs Response:", response.data);

      if (response.data.success) {
        setAppliedJobs(response.data.appliedJobs);
      }
    } catch (error) {
      console.error("Error fetching applied jobs:", error.response || error);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchAppliedInternships = async () => {
    try {
      setInternshipsLoading(true);
      const response = await axios.get(
        "http://localhost:8000/api/v1/application/internships/get",
        { withCredentials: true }
      );
      console.log("Applied Internships Response:", response.data);

      if (response.data.success) {
        setAppliedInternships(response.data.applications);
      }
    } catch (error) {
      console.error("Error fetching applied internships:", error);
      toast.error("Failed to load applied internships");
    } finally {
      setInternshipsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id && currentUser?.role === "student") {
      fetchAppliedJobs();
      fetchAppliedInternships();
    }
  }, [currentUser]);

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
        return prevFollowers.filter(
          (follower) => follower._id !== currentUser._id
        );
      }
    });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser?._id && !userId) {
      navigate("/login");
    }
  }, [loading, currentUser, userId, navigate]);

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

  const isOwnProfile = !userId || currentUser?._id === userId;
  const isStudent = profileUser?.role?.toUpperCase() === "STUDENT";

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-8 border border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-blue-500">
                <AvatarImage
                  src={profileUser?.profile?.profilePhoto}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl bg-gray-800 text-blue-400">
                  {(profileUser?.fullname || profileUser?.companyname)?.charAt(
                    0
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {profileUser?.fullname || profileUser?.companyname}
                </h1>
                <p className="text-gray-300">
                  {profileUser?.profile?.headline ||
                    (isStudent ? "Student" : "Recruiter")}
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              {!isOwnProfile && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMessageClick}
                    className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
              {isOwnProfile && (
                <Button
                  onClick={() => setOpen(true)}
                  variant="outline"
                  size="sm"
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <Pen className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-400 mb-2">About</h2>
            <p className="text-gray-300">
              {profileUser?.profile?.bio || "No bio provided yet."}
            </p>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 text-gray-300">
              <Mail className="text-blue-400 h-5 w-5" />
              <span>{profileUser?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Contact className="text-blue-400 h-5 w-5" />
              <span>
                {profileUser?.phonenumber ||
                  profileUser?.phoneNumber ||
                  "Not provided"}
              </span>
            </div>
            {profileUser?.profile?.website && (
              <div className="flex items-center gap-3 text-gray-300">
                <LinkIcon className="text-blue-400 h-5 w-5" />
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

          {/* Skills */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
              {isStudent ? (
                <>
                  <GraduationCap className="h-5 w-5" />
                  Skills & Education
                </>
              ) : (
                <>
                  <Briefcase className="h-5 w-5" />
                  Company Details
                </>
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profileUser?.profile?.skills?.length > 0 ? (
                profileUser.profile.skills.map((skill, idx) => (
                  <Badge
                    key={idx}
                    className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1"
                  >
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500">No skills added</span>
              )}
            </div>
          </div>

          {/* Resume */}
          {isStudent && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-blue-400 mb-2">
                Resume
              </h2>
              {profileUser?.profile?.resume ? (
                <a
                  href={profileUser.profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:underline"
                >
                  <LinkIcon className="h-5 w-5" />
                  {profileUser.profile.resumeOriginalName || "View Resume"}
                </a>
              ) : (
                <span className="text-gray-500">No resume uploaded</span>
              )}
            </div>
          )}

          {/* Followers/Following */}
          <div className="flex items-center gap-4 mt-6">
            <div className="relative">
              <Button
                id="followers-button"
                variant="ghost"
                className="text-gray-300 hover:text-blue-400 hover:bg-blue-400/10"
                onClick={() => {
                  setFollowersOpen(!followersOpen);
                  setFollowingOpen(false);
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                {followersLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{followers.length} Followers</span>
                )}
              </Button>
              {followersOpen && (
                <div
                  id="followers-popup"
                  className="absolute top-full left-0 mt-2 w-72 bg-black border border-gray-700 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-blue-400 mb-3">
                      Followers
                    </h3>
                    <ScrollArea className="h-64 pr-3">
                      {followersLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : followers.length > 0 ? (
                        <div className="space-y-3">
                          {followers.map((follower) => (
                            <div
                              key={follower._id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                              onClick={() => {
                                navigate(
                                  `/profile/${follower.role.toLowerCase()}/${
                                    follower._id
                                  }`
                                );
                                setFollowersOpen(false);
                              }}
                            >
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={follower.profile?.profilePhoto}
                                />
                                <AvatarFallback className="bg-gray-700 text-blue-400">
                                  {(
                                    follower.fullname || follower.companyname
                                  )?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                  {follower.fullname || follower.companyname}
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                  {follower.role}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-6">
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
                className="text-gray-300 hover:text-blue-400 hover:bg-blue-400/10"
                onClick={() => {
                  setFollowingOpen(!followingOpen);
                  setFollowersOpen(false);
                }}
              >
                <Users className="h-5 w-5 mr-2" />
                {followingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{following.length} Following</span>
                )}
              </Button>
              {followingOpen && (
                <div
                  id="following-popup"
                  className="absolute top-full left-0 mt-2 w-72 bg-black border border-gray-700 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4">
                    <h3 className="font-semibold text-blue-400 mb-3">
                      Following
                    </h3>
                    <ScrollArea className="h-64 pr-3">
                      {followingLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      ) : following.length > 0 ? (
                        <div className="space-y-3">
                          {following.map((followed) => (
                            <div
                              key={followed._id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                              onClick={() => {
                                navigate(
                                  `/profile/${followed.role.toLowerCase()}/${
                                    followed._id
                                  }`
                                );
                                setFollowingOpen(false);
                              }}
                            >
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={followed.profile?.profilePhoto}
                                />
                                <AvatarFallback className="bg-gray-700 text-blue-400">
                                  {(
                                    followed.fullname || followed.companyname
                                  )?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                  {followed.fullname || followed.companyname}
                                </p>
                                <p className="text-sm text-gray-400 truncate">
                                  {followed.role}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-center py-6">
                          Not following anyone yet
                        </p>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Applied Jobs and Internships - Only for student's own profile */}
        {isOwnProfile && isStudent && (
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-blue-400 mb-6">
              Applications
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Applied Jobs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Applied Jobs
                  </h3>
                  <Badge className="bg-blue-500/20 text-blue-400 px-3 py-1">
                    {jobsLoading ? "..." : appliedJobs.length}
                  </Badge>
                </div>

                {jobsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : appliedJobs.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-700">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gray-800">
                        <TableRow>
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">
                            Position
                          </TableHead>
                          <TableHead className="text-gray-300">
                            Company
                          </TableHead>
                          <TableHead className="text-right text-gray-300">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appliedJobs.map((app) => (
                          <TableRow
                            key={app._id}
                            className="border-gray-700 hover:bg-gray-800/50 transition-colors"
                          >
                            <TableCell className="text-gray-300">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {app.job?.title}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {app.job?.created_by?.companyname}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={`
                                  ${
                                    app.status === "rejected"
                                      ? "bg-red-500/20 text-red-400"
                                      : app.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-green-500/20 text-green-400"
                                  } 
                                  px-3 py-1
                                `}
                              >
                                {app.status.charAt(0).toUpperCase() +
                                  app.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <p className="text-gray-400">
                      You haven't applied to any jobs yet
                    </p>
                  </div>
                )}
              </div>

              {/* Applied Internships */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Applied Internships
                  </h3>
                  <Badge className="bg-blue-500/20 text-blue-400 px-3 py-1">
                    {internshipsLoading ? "..." : appliedInternships.length}
                  </Badge>
                </div>

                {internshipsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : appliedInternships.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-700">
                    <Table className="min-w-full">
                      <TableHeader className="bg-gray-800">
                        <TableRow>
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">
                            Position
                          </TableHead>
                          <TableHead className="text-gray-300">
                            Company
                          </TableHead>
                          <TableHead className="text-right text-gray-300">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appliedInternships.map((app) => (
                          <TableRow
                            key={app._id}
                            className="border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate(
                                `/internship/details/${app.internship?._id}`
                              )
                            }
                          >
                            <TableCell className="text-gray-300">
                              {new Date(app.appliedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {app.internship?.title}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {app.internship?.recruiter?.companyname}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                className={`
                                  ${
                                    app.status === "rejected"
                                      ? "bg-red-500/20 text-red-400"
                                      : app.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-green-500/20 text-green-400"
                                  } 
                                  px-3 py-1
                                `}
                              >
                                {app.status.charAt(0).toUpperCase() +
                                  app.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <p className="text-gray-400">
                      You haven't applied to any internships yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Update Dialog */}
      <UpdateProfileDialog open={open} setOpen={setOpen} />
    </div>
  );
};

export default Profile;
