import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "./ui/button";

const LatestJobCards = ({ job }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  const handleCardClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate(`/job/description/${job._id}`);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/signup');
      return;
    }
    navigate(`/job/description/${job._id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300 flex flex-col h-full relative"
    >
      {/* Action Buttons in Top Right */}
      <div className="absolute top-3 right-4 flex gap-2">
        <Button
          onClick={handleButtonClick}
          variant="outline"
          className="px-3 py-1 bg-purple-500 border-purple-500 text-white text-sm font-bold rounded-md hover:bg-purple-600 cursor-pointer"
        >
          View Details
        </Button>
        <Button
          onClick={handleButtonClick}
          className="px-3 py-1 bg-green-500 border-green-500 text-white text-sm font-bold rounded-md hover:bg-green-600 cursor-pointer"
        >
          Apply Now
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
