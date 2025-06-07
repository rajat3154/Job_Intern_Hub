import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LatestJobCards from "./LatestJobCards";

const LatestJobs = ({ query }) => {
  const [latestJobs, setLatestJobs] = useState([]);

  const fetchLatestJobs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/job/latest", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Fetched jobs data:", data); // ✅ DEBUG LOG

      if (data.success && Array.isArray(data.jobs)) {
        setLatestJobs(data.jobs);
      } else {
        console.error("Invalid job data format", data);
      }
    } catch (error) {
      console.error("Error fetching latest jobs:", error);
    }
  };

  useEffect(() => {
    fetchLatestJobs();
  }, []);

  const filteredJobs = latestJobs.filter((job) => {
    const q = query?.toLowerCase().trim();
    if (!q) return true; // if query is empty, return all jobs

    const combinedValues = [
      job.title,
      job.description,
      job.company?.name,
      job.location,
      job.type,
      job.stipend,
      job.duration,
      ...(job.skills || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return combinedValues.includes(q);
  });

  console.log("Filtered Jobs:", filteredJobs); // ✅ DEBUG LOG

  return (
    <div className="bg-black text-white py-16">
      <div className="container mx-auto text-center px-4">
        <h1 className="text-5xl font-bold mb-10">
          <span className="text-blue-500 text-3xl">Latest and Top </span>Job
          Openings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length <= 0 ? (
            <span className="col-span-full text-gray-400 text-lg">
              No Job Available
            </span>
          ) : (
            filteredJobs.map((job) => (
              <LatestJobCards key={job._id} job={job} />
            ))
          )}

          <Link
            to="/jobs"
            className="p-6 rounded-lg shadow-lg bg-black text-white border border-blue-500 hover:bg-gray-800 cursor-pointer transition duration-300 flex flex-col items-center justify-center"
          >
            <h2 className="text-2xl font-bold text-blue-400">View More Jobs</h2>
            <p className="mt-2 text-gray-300 text-lg">
              Explore all job openings
            </p>
            <div className="mt-6 flex justify-center">
              <button className="w-12 h-12 flex items-center justify-center rounded-full border border-blue-500 text-blue-400 text-2xl cursor-pointer hover:text-white transition duration-300">
                ➡️
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LatestJobs;
