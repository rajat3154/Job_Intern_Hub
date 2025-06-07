import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Mail, Briefcase, Link as LinkIcon, Pen } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { setAllJobs } from "@/redux/jobSlice";
import Navbar from "./shared/Navbar";

const RecruiterProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const { user: currentUser } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/api/v1/recruiter/profile/${currentUser._id}`,
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );
        setProfileData(response.data.data);
      } catch (error) {
        toast.error("Failed to load profile data");
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPostedJobs = async () => {
      try {
        setJobsLoading(true);
        const response = await fetch(
          "http://localhost:8000/api/v1/job/recruiter",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.jobs)) {
          setJobs(data.jobs);
          dispatch(setAllJobs(data.jobs));
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setJobsLoading(false);
      }
    };

    const fetchRecruiterInternships = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/internship/recruiter",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.internships)) {
          setInternships(data.internships);
        } else {
          setInternships([]);
        }
      } catch (error) {
        console.error("Error fetching internships:", error);
      }
    };

    fetchProfileData();
    fetchPostedJobs();
    fetchRecruiterInternships();
  }, [currentUser._id, dispatch]);

  const renderCards = (posts, type = "job") => {
    if (jobsLoading && type === "job") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg bg-gray-800" />
          ))}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">
            You haven't posted any {type === "job" ? "jobs" : "internships"}{" "}
            yet.
          </p>
          <Button
            onClick={() =>
              navigate(type === "job" ? "/post-job" : "/post-internship")
            }
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Post a {type === "job" ? "Job" : "Internship"}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative p-6 rounded-lg shadow-lg bg-gray-900 text-white border border-blue-500/30 hover:bg-gray-800 cursor-pointer transition duration-300"
            onClick={() =>
              navigate(
                type === "job"
                  ? `/job/details/${post._id}`
                  : `/internship/details/${post._id}`
              )
            }
          >
            <div className="absolute top-3 right-4">
              <Badge className="bg-blue-600">
                {post.applications?.length || 0} applicants
              </Badge>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12 rounded-full border border-blue-500">
                <AvatarImage src={profileData?.profile?.profilePhoto} />
                <AvatarFallback className="bg-gray-800 text-blue-400">
                  {profileData?.companyname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-lg">
                  {profileData?.companyname}
                </h1>
                <p className="text-sm text-gray-400">{post.location}</p>
              </div>
            </div>

            <div className="mb-4">
              <h1 className="font-bold text-xl mb-3">{post.title}</h1>
              <p className="text-sm text-gray-300 line-clamp-3">
                {post.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
              {post.position && (
                <Badge className="bg-blue-400 text-black">
                  {post.position} Position{post.position > 1 ? "s" : ""}
                </Badge>
              )}
              {post.jobType && (
                <Badge className="bg-red-600 text-white">{post.jobType}</Badge>
              )}
              {post.salary && (
                <Badge className="bg-yellow-400 text-black">
                  {type === "job"
                    ? `${post.salary} LPA`
                    : `${post.salary} /month`}
                </Badge>
              )}
              {type === "internship" && post.duration && (
                <Badge className="bg-green-500 text-white">
                  {post.duration} months
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                className="px-2 py-1 bg-blue-500 border-blue-500 text-white text-sm font-bold rounded-md hover:bg-blue-600 cursor-pointer"
              >
                View Details
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex justify-center items-center h-[80vh]">
          <Skeleton className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-gray-900 rounded-lg p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-blue-500">
                <AvatarImage src={profileData?.profile?.profilePhoto} />
                <AvatarFallback className="bg-gray-800 text-2xl text-blue-400">
                  {profileData?.companyname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-blue-400">
                  {profileData?.companyname}
                </h1>
                <p className="text-gray-300">
                  {profileData?.role === "recruiter" ? "Recruiter Profile" : ""}
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/profile/edit")}
              variant="outline"
              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
            >
              <Pen className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-blue-400 mb-2">
                About
              </h2>
              <p className="text-gray-300">
                {profileData?.profile?.bio ||
                  "No company description provided."}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-400 mb-2">
                Contact Information
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="text-blue-400 h-4 w-4" />
                  <span>{profileData?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="text-blue-400 h-4 w-4" />
                  <span>CIN: {profileData?.cinnumber || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="text-blue-400 h-4 w-4" />
                  <span>
                    {profileData?.companyaddress || "Address not provided"}
                  </span>
                </div>
                {profileData?.profile?.website && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="text-blue-400 h-4 w-4" />
                    <a
                      href={profileData.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {profileData.profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900">
              <TabsTrigger
                value="jobs"
                className="data-[state=active]:bg-blue-600"
              >
                Posted Jobs ({jobs.length})
              </TabsTrigger>
              <TabsTrigger
                value="internships"
                className="data-[state=active]:bg-blue-600"
              >
                Posted Internships ({internships.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="mt-6">
              {renderCards(jobs, "job")}
            </TabsContent>

            <TabsContent value="internships" className="mt-6">
              {renderCards(internships, "internship")}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default RecruiterProfile;
