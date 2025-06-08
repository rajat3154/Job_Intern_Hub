import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import profilePic from "./assets/a.jpg";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";

const LatestInternshipCards = ({ internship }) => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [isSaved, setIsSaved] = useState(false);

  // Check saved status on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/internship/is-saved-internship/${internship._id}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          setIsSaved(data.isSaved);
        }
      } catch (error) {
        console.error("Error checking saved internship:", error);
      }
    };

    checkSavedStatus();
  }, [internship._id, user]);

  const handleSaveInternship = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/signup");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/internship/save-internship/${internship._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSaved(data.isSaved);
        toast.success(data.message);
      } else {
        toast.error("Could not save internship");
      }
    } catch (err) {
      console.error("Error saving internship:", err);
      toast.error("Failed to save internship");
    }
  };

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
      {/* Top Right Buttons */}
      <div className="absolute top-3 right-4 flex gap-2">
        <Button
          onClick={handleButtonClick}
          variant="outline"
          className="px-3 py-1 bg-purple-500 border-purple-500 text-white text-sm font-bold rounded-md hover:bg-purple-600"
        >
          View Details
        </Button>
        <Button
          onClick={handleSaveInternship}
          variant="outline"
          className={`px-3 py-1 text-sm font-bold rounded-md flex items-center gap-2 ${
            isSaved
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          {isSaved ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="mt-12">
        <div className="flex justify-between mb-4">
          <p className="text-sm text-gray-400">
            {new Date(internship.createdAt).toDateString()}
          </p>
        </div>

        <div className="flex gap-3 mb-4 items-start">
          <img
            src={internship?.createdAt?.profilePic || profilePic}
            alt={`${internship.companyname} Logo`}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="font-semibold text-lg">{internship.companyname}</h1>
            <p className="text-sm text-gray-400">{internship.location}</p>
          </div>
        </div>

        <div className="mb-3 text-left">
          <h1 className="font-bold text-xl">{internship.title}</h1>
          {internship.description && (
            <p className="text-sm text-gray-300 mt-1">
              {internship.description}
            </p>
          )}
        </div>

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
