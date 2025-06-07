import { Job } from "../models/job.model.js";
import { Student } from "../models/student.model.js";
import  {Recruiter}  from "../models/recruiter.model.js";

export const postJob = async (req, res) => {
      try {
            // Destructure the job details from the request body
            const { title, description, requirements, salary, location, jobType, experience, position } = req.body;

            // Get the recruiter ID from the logged-in user's information
            const recruiterId = req.user.id; // Assume the user is a recruiter and has `id` field
            console.log(recruiterId);  // For debugging: log recruiter ID

            // Fetch recruiter details using the recruiter ID
            const recruiter = await Recruiter.findById(recruiterId);

            // If recruiter is not found, return an error message
            if (!recruiter) {
                  return res.status(404).json({
                        message: "Recruiter not found",
                        success: false
                  });
            }

            // Create a new job post with the recruiter’s company name and recruiter ID
            const job = await Job.create({
                  title,
                  description,
                  requirements: Array.isArray(requirements) ? requirements : [requirements], // Ensure requirements are an array
                  salary: Number(salary),  // Ensure salary is a number
                  location,
                  jobType,
                  experience,
                  position,
                  company: recruiter.companyname, // Store company name from the recruiter model
                  created_by: recruiterId // Link the job post to the recruiter
            });

            // Return a success response with the newly created job
            return res.status(201).json({
                  message: "Job posted successfully",
                  success: true,
                  job
            });

      } catch (error) {
            console.error(error); // Log the error for debugging
            return res.status(500).json({
                  message: "Server error",
                  success: false
            });
      }
};



export const getAllJobs = async (req, res) => {
      try {
            const keyword = req.query.keyword || "";
            const query = {
                  $or: [
                        { title: { $regex: new RegExp(keyword, "i") } },
                        { description: { $regex: new RegExp(keyword, "i") } },
                  ],
            };

          const jobs = await Job.find(query)
  .populate({ path: "created_by", select: "companyname email companyaddress companystatus" }) // ✅ changed recruiter ➝ created_by
  .sort({ createdAt: -1 });


            if (!jobs || jobs.length === 0) {
                  return res.status(404).json({
                        message: "No jobs found",
                        success: false,
                  });
            }

            return res.status(200).json({
                  message: "Jobs found",
                  jobs,
                  success: true,
            });

      } catch (error) {
            console.log(error);
            return res.status(500).json({
                  message: "Server error",
                  success: false,
            });
      }
};
export const getJobById = async (req, res) => {
      try {
            const jobId = req.params.id;
            const job = await Job.findById(jobId).populate({
                  path: "applications"
            });
            if (!job) {
                  return res.status(404).json({
                        message: "Job not found",
                        success: false
                  })
            };
            return res.status(200).json({
                  job,
                  success: true
            })
      } catch (error) {
            console.log(error);
      }
}


export const getRecruiterJobs = async (req, res) => {
      try {
            console.log("Authenticated user ID:", req.user.id);  // <-- Add this log

            const jobs = await Job.find({ created_by: req.user.id })
                  .populate({
                        path: "applications",
                        select: "student status appliedAt",
                  })
                  .populate({
                        path: "created_by",
                        select: "companyname profile.profilePhoto",
                  })
                  .sort({ createdAt: -1 });

            if (!jobs.length) {
                  return res.status(200).json({
                        message: "You haven't posted any jobs yet",
                        jobs: [],
                        success: true,
                  });
            }

            return res.status(200).json({
                  message: "Your job postings",
                  jobs,
                  success: true,
                  count: jobs.length,
            });
      } catch (error) {
            console.error("Recruiter jobs fetch error:", error);
            return res.status(500).json({
                  message: "Failed to fetch your jobs",
                  success: false,
            });
      }
};
// Get latest jobs
export const getLatestJobs = async (req, res) => {
      try {
            const latestJobs = await Job.find()
                  .sort({ createdAt: -1 }) // Sort by newest first
                  .limit(5); // Fetch only top 6

            res.status(200).json({ success: true, jobs: latestJobs });
      } catch (error) {
            console.error("Failed to fetch latest jobs:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
      }
};
