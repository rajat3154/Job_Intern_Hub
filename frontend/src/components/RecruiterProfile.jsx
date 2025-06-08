import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Mail,
  Briefcase,
  Link as LinkIcon,
  Pen,
  Users,
  MessageSquare,
  Loader2,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Navbar from "./shared/Navbar";
import { ScrollArea } from "./ui/scroll-area";
import FollowButton from "./FollowButton";
import UsersToFollow from "./UsersToFollow";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { Separator } from "./ui/separator";
import PostJob from "./recruiter/PostJob";

const RecruiterProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(true);
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const { user: currentUser } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch profile data
        const profileRes = await axios.get(
          `http://localhost:8000/api/v1/recruiter/profile/${currentUser._id}`,
          { withCredentials: true }
        );
        setProfileData(profileRes.data.data);

        // Fetch posted jobs
        const jobsRes = await axios.get(
          "http://localhost:8000/api/v1/job/recruiter",
          { withCredentials: true }
        );
        setPostedJobs(jobsRes.data.jobs || []);

        // Fetch internships - updated this part
        try {
          const internshipsRes = await axios.get(
            "http://localhost:8000/api/v1/internship/recruiter",
            { withCredentials: true }
          );
          // Check both possible response structures
          setInternships(
            internshipsRes.data.internships || internshipsRes.data || []
          );
          console.log("Internships fetched:", internshipsRes.data.internships);
        } catch (internshipError) {
          console.error("Error fetching internships:", internshipError);
          toast.error("Failed to load internships");
          setInternships([]);
        }

        // Rest of your code...
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
        setJobsLoading(false);
        setFollowersLoading(false);
        setFollowingLoading(false);
      }
    };
    fetchAllData();
  }, [currentUser._id]);

  const handleJobPosted = () => {
    fetchAllData();
    setShowPostJob(false);
  };

  const handleMessageClick = () => {
    const selectedUser = {
      _id: profileData._id,
      fullName: profileData.companyname,
      email: profileData.email,
      role: profileData.role.toLowerCase(),
      profilePhoto: profileData.profile?.profilePhoto,
      identifier: profileData.companyname || "Recruiter",
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

  const handleSaveJob = async (e, jobId) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/signup");
      return;
    }

    setCurrentJobId(jobId);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/v1/job/save-job/${jobId}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        setIsSaved(response.data.isSaved);
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error("Failed to save job");
    }
  };

  const renderJobCard = (job) => (
    <div
      key={job._id}
      className="relative p-6 rounded-lg shadow-lg bg-gray-900 text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300"
      onClick={() => navigate(`/job/details/${job._id}`)}
    >
      <div className="absolute top-3 right-4 flex gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/job/details/${job._id}`);
          }}
          variant="outline"
          className="px-3 py-1 bg-purple-500 border-purple-500 text-white text-sm font-bold rounded-md hover:bg-purple-600 cursor-pointer"
        >
          View Details
        </Button>
        <Button
          onClick={(e) => handleSaveJob(e, job._id)}
          variant="outline"
          className={`px-3 py-1 text-sm font-bold rounded-md flex items-center gap-2 ${
            isSaved && currentJobId === job._id
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {isSaved && currentJobId === job._id ? (
            <BookmarkCheck size={16} />
          ) : (
            <Bookmark size={16} />
          )}
          {isSaved && currentJobId === job._id ? "Saved" : "Save Job"}
        </Button>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {new Date(job.createdAt).toDateString()}
          </p>
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
            {job.applications?.length || 0} applicants
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profileData?.profile?.profilePhoto} />
            <AvatarFallback className="bg-gray-800 text-blue-400">
              {profileData?.companyname?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-lg">
              {profileData?.companyname}
            </h1>
            <p className="text-sm text-gray-400">{job.location}</p>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="font-bold text-xl mb-3">{job.title}</h1>
          <p className="text-sm text-gray-300 line-clamp-3">
            {job.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-blue-400 text-black">
            {job.position} Position{job.position > 1 ? "s" : ""}
          </Badge>
          <Badge className="bg-red-600 text-white">{job.jobType}</Badge>
          <Badge className="bg-yellow-400 text-black">{job.salary} LPA</Badge>
        </div>
      </div>
    </div>
  );

  const renderInternshipCard = (internship) => (
    <div
      key={internship._id}
      className="relative p-6 rounded-lg shadow-lg bg-gray-900 text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300"
      onClick={() => navigate(`/internship/details/${internship._id}`)}
    >
      <div className="absolute top-3 right-4">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/internship/details/${internship._id}`);
          }}
          variant="outline"
          className="px-3 py-1 bg-purple-500 border-purple-500 text-white text-sm font-bold rounded-md hover:bg-purple-600 cursor-pointer"
        >
          View Details
        </Button>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {new Date(internship.createdAt).toDateString()}
          </p>
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
            {internship.applications?.length || 0} applicants
          </span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profileData?.profile?.profilePhoto} />
            <AvatarFallback className="bg-gray-800 text-blue-400">
              {profileData?.companyname?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-lg">
              {profileData?.companyname}
            </h1>
            <p className="text-sm text-gray-400">{internship.location}</p>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="font-bold text-xl mb-3">{internship.title}</h1>
          <p className="text-sm text-gray-300 line-clamp-3">
            {internship.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge className="bg-blue-400 text-black">Internship</Badge>
          <Badge className="bg-green-500 text-white">
            {internship.salary}/month
          </Badge>
          <Badge className="bg-yellow-400 text-black">
            {internship.duration} months
          </Badge>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg bg-gray-800" />
              <Skeleton className="h-96 w-full rounded-lg bg-gray-800" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-lg bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      {showPostJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PostJob
            onClose={() => setShowPostJob(false)}
            onSuccess={handleJobPosted}
          />
        </div>
      )}

      <div className="max-w-max p-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gray-900 border-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 border-2 border-blue-500">
                        <AvatarImage src={profileData?.profile?.profilePhoto} />
                        <AvatarFallback className="text-2xl bg-gray-800 text-blue-400">
                          {profileData?.companyname?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="text-2xl font-bold text-blue-400">
                          {profileData?.companyname}
                        </h1>
                        <p className="text-gray-400">Recruiter Profile</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        onClick={() => setShowPostJob(true)}
                        className="mt-4 bg-green-500 hover:bg-green-600"
                      >
                        Post New Job
                      </Button>
                      <Button
                        onClick={() => navigate("/profile/edit")}
                        variant="outline"
                        className="text-blue-400 border-blue-400/50 hover:bg-blue-400/10"
                      >
                        <Pen className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  {/* About and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                        Contact
                      </h2>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="text-blue-400 h-4 w-4" />
                          <span>{profileData?.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="text-blue-400 h-4 w-4" />
                          <span>
                            CIN: {profileData?.cinnumber || "Not provided"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="text-blue-400 h-4 w-4" />
                          <span>
                            {profileData?.companyaddress ||
                              "Address not provided"}
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Jobs / Internships Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs defaultValue="jobs" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                  <TabsTrigger
                    value="jobs"
                    className="data-[state=active]:bg-blue-600"
                  >
                    Jobs ({postedJobs.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="internships"
                    className="data-[state=active]:bg-blue-600"
                  >
                    Internships ({internships.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="jobs" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobsLoading ? (
                      [...Array(4)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-64 w-full rounded-lg bg-gray-800"
                        />
                      ))
                    ) : postedJobs.length > 0 ? (
                      postedJobs.map(renderJobCard)
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-gray-400 mb-4">No jobs posted yet</p>
                        <Button
                          onClick={() => setShowPostJob(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Post a Job
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="internships" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {jobsLoading ? (
                      [...Array(4)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-64 w-full rounded-lg bg-gray-800"
                        />
                      ))
                    ) : internships.length > 0 ? (
                      internships.map(renderInternshipCard)
                    ) : (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-gray-400 mb-4">
                          No internships posted yet
                        </p>
                        <Button
                          onClick={() => navigate("/post-internship")}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Post an Internship
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
         
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfile;
