import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { setSingleJob } from "@/redux/jobSlice";
import { Bookmark, BookmarkCheck } from "lucide-react";

const LatestJobCards = ({ job }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if job is saved when component mounts
    const checkIfJobSaved = async () => {
      if (!user) return;
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/job/is-saved/${job._id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfJobSaved();
  }, [job._id, user]);

  const handleSaveJob = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/signup');
      return;
    }

    try {      const response = await fetch(
        `http://localhost:8000/api/v1/job/save-job/${job._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      const data = await response.json();
      if (data.success) {
        setIsSaved(data.isSaved);
        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  };

  return (
    <div className="w-full p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300 flex flex-col h-full relative">
      {/* Action Buttons in Top Right */}
      <div className="absolute top-3 right-4 flex gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/job/description/${job._id}`);
          }}
          variant="outline"
          className="px-3 py-1 bg-purple-500 border-purple-500 text-white text-sm font-bold rounded-md hover:bg-purple-600 cursor-pointer"
        >
          View Details
        </Button>
        <Button
          onClick={handleSaveJob}
          variant="outline"
          className={`px-3 py-1 text-sm font-bold rounded-md flex items-center gap-2 ${
            isSaved ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {isSaved ? "Saved" : "Save Job"}
        </Button>
      </div>

      {/* Rest of the card content with adjusted top padding */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {new Date(job.createdAt).toDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <img
            src={job.created_by?.profile?.profilePhoto || "https://via.placeholder.com/50"}
            alt="Company Logo"
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h1 className="font-semibold text-lg">{job.company || "Company"}</h1>
            <p className="text-sm text-gray-400">{job.location}</p>
          </div>
        </div>

        <div className="mb-4 flex-grow">
          <h1 className="font-bold text-xl mb-3">{job.title}</h1>
          <p className="text-sm text-gray-300 line-clamp-3">{job.description}</p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-400 text-black text-sm font-bold rounded-md">
              {job.position} Positions
            </span>
            <span className="px-2 py-1 bg-red-600 text-white text-sm font-bold rounded-md">
              {job.jobType}
            </span>
            <span className="px-2 py-1 bg-yellow-400 text-black text-sm font-bold rounded-md">
              {job.salary} LPA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestJobCards;
