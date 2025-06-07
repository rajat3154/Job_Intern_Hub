import React, { useEffect, useState } from "react";
import Navbar from "./shared/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PostInternship from "./recruiter/PostInternship";
import { Button } from "./ui/button";
import { setAllInternships } from "../redux/internshipSlice";
import LatestInternshipCards from "./LatestInternshipCards";

const Internships = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { allInternships } = useSelector((store) => store.internship);

  const [recruiterInternships, setRecruiterInternships] = useState([]);
  const [showPostInternship, setShowPostInternship] = useState(false);

  const fetchInternships = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/internship/get",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.internships)) {
        dispatch(setAllInternships(data.internships));
      }
    } catch (error) {
      console.error("Error fetching internships:", error);
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
        setRecruiterInternships(data.internships);
      } else {
        setRecruiterInternships([]);
      }
    } catch (error) {
      console.error("Error fetching recruiter internships:", error);
    }
  };

  useEffect(() => {
    fetchInternships();
    if (user?.role === "recruiter") {
      fetchRecruiterInternships();
    }
  }, [dispatch, user]);

  console.log("All Internships from Redux:", allInternships);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto text-center py-10">
        <h1 className="text-3xl font-bold mb-3 text-blue-500">
          Explore <span className="text-white text-4xl">Internships</span>
        </h1>
        <p className="text-lg text-gray-300">
          Gain hands-on experience and kickstart your career!
        </p>
        {user?.role === "recruiter" && (
          <Button
            onClick={() => setShowPostInternship(true)}
            className="mt-4 bg-green-500 hover:bg-green-600"
          >
            Post New Internship
          </Button>
        )}
      </div>

      {/* Post Internship Modal */}
      {showPostInternship && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PostInternship
            onClose={() => setShowPostInternship(false)}
            onSuccess={() => {
              fetchRecruiterInternships();
              setShowPostInternship(false);
            }}
          />
        </div>
      )}

      {/* Recruiter's Internships */}
      {user?.role === "recruiter" && recruiterInternships.length > 0 && (
        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-2xl font-bold text-left text-green-400 mb-4">
            Your Posted Internships
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiterInternships.map((internship) => (
              <LatestInternshipCards
                key={internship._id}
                internship={internship}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Internships - show only if role is student */}
      {user?.role === "student" && (
        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-2xl font-semibold text-blue-400 mb-4">
            All Internships
          </h2>
          {allInternships?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allInternships.map((internship) => (
                <LatestInternshipCards
                  key={internship._id}
                  internship={internship}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-gray-400 text-xl font-medium mb-2">
                No internships found.
              </p>
              <p className="text-sm text-gray-500">
                Try posting a new one or check your server data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Internships;
