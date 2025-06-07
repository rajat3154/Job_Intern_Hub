import React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const LatestJobCards = ({ job }) => {
  const { user } = useSelector((store) => store.auth);
  const navigate = useNavigate();

  return (
    <div className="relative p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 transition duration-300 overflow-hidden w-[455px] h-[280px] flex flex-col">
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        {/* Date */}
        <p className="text-sm text-gray-400">
          {new Date(job.createdAt).toDateString()}
        </p>

        {/* Buttons Container */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-white bg-purple-800 border-purple-800 hover:bg-purple-900 transition-all duration-300 px-4 py-2 rounded-md shadow-lg hover:shadow-purple-400"
            onClick={() => {
              if (user?.role === "student") {
                navigate(`/job/description/${job._id}`);
              } else if (user?.role === "recruiter") {
                navigate(`/job/details/${job._id}`);
              }
            }}
          >
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-white bg-green-500 border-green-500 hover:bg-green-600 transition-all duration-300 px-4 py-2 rounded-md shadow-lg hover:shadow-green-400"
          >
            Apply Now
          </Button>
        </div>
      </div>

      {/* Company Info */}
      <div className="flex gap-3 mb-4 items-center">
        <img
          src={job.company?.logo || "https://via.placeholder.com/50"}
          alt={`${job.company?.name || "Company"} Logo`}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h1 className="font-semibold text-lg">
            {job.company?.name || "Company"}
          </h1>
          <p className="text-sm text-gray-400">{job.location}</p>
        </div>
      </div>

      {/* Job Info */}
      <div className="flex-1 flex flex-col">
        <div className="mb-3">
          <h1 className="font-bold text-xl mb-2">{job.title}</h1>
          {job.description && (
            <p className="text-sm text-gray-300 line-clamp-3">
              {job.description}
            </p>
          )}
        </div>

        {/* Job Tags */}
        <div className="mt-auto flex flex-wrap gap-2">
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
  );
};

export default LatestJobCards;
