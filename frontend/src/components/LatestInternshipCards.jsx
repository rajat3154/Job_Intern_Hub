import React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import profilePic from "./assets/a.jpg";

const LatestInternshipCards = ({ internship }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/signup");
      return;
    }
    navigate(`/internship/description/${internship._id}`);
  };

  return (
    <div className="w-full p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300 flex flex-col h-full relative">
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

      <div className="mt-12">
        {/* Date */}
        <div className="flex justify-between mb-4">
          <p className="text-sm text-gray-400">
            {new Date(internship.createdAt).toDateString()}
          </p>
        </div>

        {/* Company Info */}
        <div className="flex gap-3 mb-4 items-start">
          <img
            src={profilePic}
            alt={`${internship.companyname} Logo`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="font-semibold text-lg">{internship.companyname}</h1>
            <p className="text-sm text-gray-400">{internship.location}</p>
          </div>
        </div>

        {/* Title & Description */}
        <div className="mb-3 text-left">
          <h1 className="font-bold text-xl">{internship.title}</h1>
          {internship.description && (
            <p className="text-sm text-gray-300 mt-1">{internship.description}</p>
          )}
        </div>

        {/* Duration, Stipend, Type */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="px-2 py-1 bg-orange-400 text-black text-sm font-bold rounded-md">
            {internship.duration}
          </span>
          <span className="px-2 py-1 bg-blue-500 text-black text-sm font-bold rounded-md">
            {internship.stipend}
          </span>
          <span
            className={`px-2 py-1 text-sm font-bold rounded-md ${
              internship.type === "Remote"
                ? "bg-yellow-500 text-black"
                : "bg-purple-700 text-white"
            }`}
          >
            {internship.type}
          </span>
        </div>

        {/* Skills */}
        <div className="mt-3 text-left">
          <p className="text-gray-300 text-sm font-semibold mb-2">
            Required Skills:
          </p>
          <div className="flex flex-wrap gap-2">
            {internship.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700 text-white text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestInternshipCards;
