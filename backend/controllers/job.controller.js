import { Job } from "../models/job.model.js";
import { Student } from "../models/student.model.js";
import  {Recruiter}  from "../models/recruiter.model.js";

export const postJob = async (req, res) => {
      try {
            const { title, description, requirements, salary, location, jobType, experience, position } = req.body;
            const recruiterId = req.user._id;
            console.log("Recruiter ID:", recruiterId); 
            const recruiter = await Recruiter.findById(recruiterId);
            if (!recruiter) {
                  return res.status(404).json({
                        message: "Recruiter not found",
                        success: false,
                  });
            }
            const job = await Job.create({
                  title,
                  description,
                  requirements: Array.isArray(requirements) ? requirements : [requirements],
                  salary: salary,
                  location,
                  jobType,
                  experience,
                  position,
                  company: recruiter.companyname,
                  created_by: recruiterId,
            });
            return res.status(201).json({
                  message: "Job posted successfully",
                  success: true,
                  job,
            });
      } catch (error) {
            try {
                  console.error("Job Post Error:", error);
            } catch (_) { }
            return res.status(500).json({
                  message: "Server error",
                  success: false,
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
  .populate({ path: "created_by", select: "companyname email companyaddress companystatus profile" }) // ✅ changed recruiter ➝ created_by
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
        const recruiterId = req.user._id;
        console.log("Finding jobs for recruiter ID:", recruiterId);

        const jobs = await Job.find({ created_by: recruiterId })
            .populate('created_by')
            .populate('applications')
            .sort({ createdAt: -1 });

        console.log(`Found ${jobs.length} jobs for recruiter`);

        return res.status(200).json({
            success: true,
            jobs: jobs
        });
    } catch (error) {
        console.error("Error in getRecruiterJobs:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching recruiter jobs"
        });
    }
};
// Get latest jobs
export const getLatestJobs = async (req, res) => {
      try {
            const latestJobs = await Job.find()
                  .populate('created_by', 'companyname profile') // Recruiter name and profile
                  .sort({ createdAt: -1 }) // Sort by newest first
                  .limit(5); // Fetch only top 5

            res.status(200).json({ success: true, jobs: latestJobs });
      } catch (error) {
            console.error("Failed to fetch latest jobs:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
      }
};
  
export const isJobSaved = async (req, res) => {
      try {
            const jobId = req.params.id;
            const userId = req.user._id;

            const student = await Student.findById(userId);
            if (!student) {
                  return res.status(404).json({
                        success: false,
                        message: "Student not found"
                  });
            }

            const isSaved = student.savedJobs.includes(jobId);
            return res.status(200).json({
                  success: true,
                  isSaved
            });
      } catch (error) {
            console.error("Error checking saved job status:", error);
            return res.status(500).json({
                  success: false,
                  message: "Error checking saved status"
            });
      }
};

export const saveJob = async (req, res) => {
      try {
            const jobId = req.params.id;
            const userId = req.user._id;

            const student = await Student.findById(userId);
            if (!student) {
                  return res.status(404).json({
                        success: false,
                        message: "Student not found"
                  });
            }

            const isAlreadySaved = student.savedJobs.includes(jobId);
            if (isAlreadySaved) {
                  // If already saved, remove it (unsave)
                  student.savedJobs = student.savedJobs.filter(id => id.toString() !== jobId);
                  await student.save();
                  return res.status(200).json({
                        success: true,
                        isSaved: false,
                        message: "Job unsaved successfully"
                  });
            } else {
                  // If not saved, add it
                  student.savedJobs.push(jobId);
                  await student.save();
                  return res.status(200).json({
                        success: true,
                        isSaved: true,
                        message: "Job saved successfully"
                  });
            }
      } catch (error) {
            console.error("Error saving/unsaving job:", error);
            return res.status(500).json({
                  success: false,
                  message: "Error saving/unsaving job"
            });
      }
};
export const deleteJobById = async (req, res) => {
      try {
            const jobId = req.params.id;
            const recruiterId = req.user._id;

            const job = await Job.findOne({ _id: jobId, created_by: recruiterId });

            if (!job) {
                  return res.status(404).json({
                        success: false,
                        message: "Job not found or you're not authorized to delete this job",
                  });
            }

            await job.deleteOne();

            return res.status(200).json({
                  success: true,
                  message: "Job deleted successfully",
            });
      } catch (error) {
            console.error("Error deleting job:", error);
            return res.status(500).json({
                  success: false,
                  message: "Server error while deleting job",
            });
      }
};
    