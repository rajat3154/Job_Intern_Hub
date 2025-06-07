import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Student } from "../models/student.model.js"; 



export const applyJob = async (req, res) => {
      try {
            const jobId = req.params.id;
            const userId = req.user._id; // Get user ID from authenticated request

            // Create application with applicant field
            const application = await Application.create({
                  job: jobId,
                  applicant: userId, // Add the applicant field
                  status: 'pending',
                  ...req.body
            });

            // Add application to job's applications array
            await Job.findByIdAndUpdate(jobId, {
                  $addToSet: { applications: application._id }
            });

            return res.status(201).json({
                  success: true,
                  message: "Application submitted successfully",
                  application
            });
      } catch (error) {
            console.log(error);
            return res.status(500).json({
                  success: false,
                  message: "Failed to submit application",
                  error: error.message
            });
      }
};
export const getAppliedJobs = async (req, res, next) => {
      try {
            const userId = req.user.id;

            const applications = await Application.find({ applicant: userId })
                  .sort({ createdAt: -1 })
                  .populate({
                        path: "job",
                        populate: {
                              path: "created_by",
                              select: "companyname", // Fetch company name
                        },
                  });

            res.status(200).json({
                  success: true,
                  appliedJobs: applications, // ✅ Fix here
            });
      } catch (error) {
            console.log("Error in getAppliedJobs", error);
            next?.(error);
      }
};


export const getApplicants = async (req, res) => {
      const job = await Job.findById(req.params.id)
            .populate({
                  path: "applications",
                  populate: {
                        path: "applicant",
                        model: "Student",
                  },
            });

      return res.status(200).json({
            job,
            applicants: job.applications.map(app => app.applicant),
            success: true,
      });
};
export const updateStatus = async (req, res) => {
      try {
            const { status } = req.body;
            const applicationId = req.params.id;
            if (!status) {
                  return res
                        .status(400)
                        .json({ message: "Status is required", success: false });
            }
            const application = await Application.findById(applicationId);
            if (!application) {
                  return res
                        .status(404)
                        .json({ message: "Application not found", success: false });
            }
            application.status = status.toLowerCase();
            await application.save();
            return res
                  .status(200)
                  .json({ message: "Status *updated successfully", success: true });
      } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error", success: false });
      }
};
