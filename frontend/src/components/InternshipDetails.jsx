import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { MoreHorizontal } from "lucide-react";

const shortlistingStatus = ["Accepted", "Rejected"];

const InternshipDetails = () => {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Replace with your real API endpoint
  const fetchInternshipDetails = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:8000/api/v1/internship/get/${id}`,
        { withCredentials: true }
      );

      console.log("Fetched internship data:", data);
      setInternship(data.internship);
    } catch (error) {
      console.error("Failed to fetch internship details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternshipDetails();
  }, [id]);

  const handleStatusUpdate = async (status, applicantId) => {
    try {
      setUpdating(true);
      const res = await axios.post(
        `http://localhost:8000/api/v1/internship/applicants/${applicantId}/status`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Status updated successfully");
        fetchInternshipDetails();
      } else {
        toast.error("Status update failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-20">Loading...</div>;
  }

  if (!internship) {
    return (
      <div className="text-white text-center mt-20">Internship not found.</div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-20 overflow-x-hidden overflow-y-hidden">
      <div className="container px-4 ml-8 mr-10">
        <div className="flex items-center justify-between mb-6 mr-7">
          <h1 className="text-3xl font-bold">{internship.title}</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-md">
            {internship.duration}
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-md">
            ₹{internship.stipend}/month
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-bold rounded-md">
            {internship.type}
          </span>
        </div>

        <h2 className="border-b-2 border-gray-300 text-xl font-medium py-4 mb-6">
          Internship Details
        </h2>
        <div className="space-y-4 mb-12">
          <h1 className="font-bold text-lg">
            Role:{" "}
            <span className="font-normal text-gray-300">
              {internship.title}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Location:{" "}
            <span className="font-normal text-gray-300">
              {internship.location}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Description:{" "}
            <span className="font-normal text-gray-300">
              {internship.description}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Duration:{" "}
            <span className="font-normal text-gray-300">
              {internship.duration}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Stipend:{" "}
            <span className="font-normal text-gray-300">
              ₹{internship.stipend}/month
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Type:{" "}
            <span className="font-normal text-gray-300">{internship.type}</span>
          </h1>
          <h1 className="font-bold text-lg">
            Required Skills:{" "}
            <div className="flex flex-wrap gap-2 mt-2">
              {internship.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-white text-sm rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </h1>
          <h1 className="font-bold text-lg">
            Total Applicants:{" "}
            <span className="font-normal text-gray-300">
              {internship.applicants?.length || 0}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Posted Date:{" "}
            <span className="font-normal text-gray-300">
              {new Date(internship.createdAt).toDateString()}
            </span>
          </h1>
        </div>

        {/* Applicants Table */}
        {internship.applicants?.length > 0 && (
          <div className="mt-12">
            <h2 className="border-b-2 border-gray-300 text-xl font-medium py-4 mb-6">
              Applicants
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-600">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Resume</th>
                    <th className="pb-3">Applied Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {internship.applicants.map((applicant, index) => (
                    <tr
                      key={applicant._id || index}
                      className="border-b border-gray-600"
                    >
                      <td className="py-4">{applicant.name}</td>
                      <td>{applicant.email}</td>
                      <td>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                          {applicant.status || "Pending Review"}
                        </span>
                      </td>
                      <td>
                        {applicant.resumeUrl ? (
                          <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          "No Resume"
                        )}
                      </td>
                      <td>{new Date(applicant.appliedDate).toDateString()}</td>
                      <td className="relative">
                        <Popover>
                          <PopoverTrigger>
                            <MoreHorizontal className="cursor-pointer text-gray-400 hover:text-white" />
                          </PopoverTrigger>
                          <PopoverContent className="bg-black text-white rounded-lg shadow-lg p-2">
                            {shortlistingStatus.map((status, i) => (
                              <div
                                key={i}
                                onClick={() =>
                                  handleStatusUpdate(status, applicant._id)
                                }
                                className="px-2 py-1 rounded cursor-pointer hover:text-white hover:bg-blue-500"
                              >
                                {status}
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternshipDetails;
