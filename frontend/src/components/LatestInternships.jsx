import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import LatestInternshipCards from "./LatestInternshipCards";
import { setAllInternships } from "../redux/internshipSlice";

const LatestInternships = ({ query }) => {
  const dispatch = useDispatch();
  const [latestInternships, setLatestInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestInternships = async () => {
    try {
      console.log("Fetching internships for latest view...");
      setLoading(true);
      setError(null);
      const response = await fetch(
        "http://localhost:8000/api/v1/internship/get",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();
      console.log("API Response for latest internships:", data);

      if (data.success && Array.isArray(data.internships)) {
        console.log("Processing internships data...");
        const latest = data.internships
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        console.log("Latest 5 internships:", latest);
        setLatestInternships(latest);
        dispatch(setAllInternships(data.internships));
      } else {
        console.warn("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error in fetchLatestInternships:", error);
      setError("Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestInternships();
  }, []);

  const filteredInternships = latestInternships.filter((internship) => {
    const q = query.toLowerCase().trim();

    const combinedValues = [
      internship.title,
      internship.description,
      internship.company?.name,
      internship.location,
      internship.type,
      internship.duration,
      internship.stipend,
      ...(internship.skills || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return combinedValues.includes(q);
  });

  return (
    <div className="bg-black text-white py-16">
      <div className="container mx-auto text-center px-4">
        <h1 className="text-4xl font-bold mb-10">
          <span className="text-blue-500 text-3xl">Latest and Top </span>
          Internships
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              Loading internships...
            </div>
          ) : error ? (
            <div className="col-span-3 text-center text-red-400">{error}</div>
          ) : latestInternships.length > 0 ? (
            <>
              {latestInternships.map((internship) => (
                <LatestInternshipCards
                  key={internship._id}
                  internship={internship}
                />
              ))}
              <Link
                to="/internships"
                className="p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300 overflow-hidden flex flex-col items-center justify-center text-center w-full"
                style={{ minHeight: "270px" }}
              >
                <h2 className="text-2xl font-bold text-blue-400">
                  View More Internships
                </h2>
                <p className="mt-2 text-gray-300 text-lg">
                  Explore all Internships
                </p>

                <div className="mt-6 flex justify-center">
                  <button className="w-12 h-12 flex items-center justify-center rounded-full border border-blue-500 text-blue-400 text-2xl cursor-pointer hover:text-white transition duration-300">
                    ➡️
                  </button>
                </div>
              </Link>
            </>
          ) : (
            <div className="col-span-3 text-center text-gray-400">
              No internships available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestInternships;
