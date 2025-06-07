import React, { useEffect } from "react";
import { Button } from "./ui/button";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setSingleInternship } from "@/redux/internshipSlice";
import { INTERNSHIP_API_END_POINT } from "@/utils/constant";

const InternshipDescription = () => {
  const params = useParams();
  const internshipId = params.id;
  const dispatch = useDispatch();
  const { singleInternship } = useSelector((store) => store.internship);

  useEffect(() => {
    const fetchSingleInternship = async () => {
      try {
        const res = await axios.get(
          `${INTERNSHIP_API_END_POINT}/get/${internshipId}`,
          {
            withCredentials: true,
          }
        );
        if (res.data.success) {
          dispatch(setSingleInternship(res.data.internship));
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSingleInternship();
  }, [internshipId, dispatch]);

  if (!singleInternship) {
    return (
      <div className="text-white text-center mt-10">Loading job data...</div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen py-20 overflow-x-hidden overflow-y-hidden">
      <div className="container px-4 ml-8 mr-10">
        {/* Job Title and Apply Button */}
        <div className="flex items-center justify-between mb-6 mr-7">
          <h1 className="text-3xl font-bold">{singleInternship.title}</h1>
          <Button className="rounded-lg text-sm font-bold px-6 py-3 bg-green-600 cursor-pointer">
            Apply Now
          </Button>
        </div>

        {/* Job Info Badges */}
        <div className="flex gap-4 mb-6">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-md">
            {singleInternship.skills?.length || 0} Skills
          </span>
          <span className="px-3 py-1 bg-red-100 text-[#F83002] text-sm font-bold rounded-md">
            {singleInternship.type}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-[#7209b7] text-sm font-bold rounded-md">
            ₹{singleInternship.stipend}
          </span>
        </div>

        {/* Job Description */}
        <h2 className="border-b-2 border-gray-300 text-xl font-medium py-4 mb-6">
          Internship Description
        </h2>
        <div className="space-y-4">
          
          <h1 className="font-bold text-lg">
            Role:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.title}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Location:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.location}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Type:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.type}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Duration:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.duration}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Stipend:{" "}
            <span className="font-normal text-gray-300">
              ₹{singleInternship.stipend}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Description:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.description}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Required Skills:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.skills?.join(", ")}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Total Applicants:{" "}
            <span className="font-normal text-gray-300">
              {singleInternship.applications?.length || 0}
            </span>
          </h1>
          <h1 className="font-bold text-lg">
            Posted Date:{" "}
            <span className="font-normal text-gray-300">
              {new Date(singleInternship.createdAt).toLocaleDateString()}
            </span>
          </h1>
         
        
        </div>
      </div>
    </div>
  );
};

export default InternshipDescription;
