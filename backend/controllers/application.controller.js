import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Student } from "../models/student.model.js"; 
import { Notification } from "../models/Notification.js";
import { getIO } from "../socket/socket.js";
import { Internship } from "../models/internship.model.js";

export const applyJob = async (req, res) => {
      try {
            const jobId = req.params.id;
            const userId = req.user._id; // Get user ID from authenticated request

            // Get the job details first
            const job = await Job.findById(jobId).populate('created_by');
            if (!job) {
                  return res.status(404).json({
                        success: false,
                        message: "Job not found"
                  });
            }

            // Get student details for notification
            const student = await Student.findById(userId);
            if (!student) {
                  return res.status(404).json({
                        success: false,
                        message: "Student not found"  
                  });
            }

            // Create application with applicant field
            const application = await Application.create({
                  job: jobId,
                  applicant: userId,
                  status: 'pending',
                  ...req.body
            });

            // Add application to job's applications array
            await Job.findByIdAndUpdate(jobId, {
                  $addToSet: { applications: application._id }
            });

            // Create notification for recruiter
            const notification = await Notification.create({
                  recipient: job.created_by._id,
                  sender: userId,
                  senderModel: 'Student',
                  type: 'application',
                  title: 'New Job Application',
                  message: `${student.fullname} applied for "${job.title}"`,
                  read: false
            });            // Get initialized socket instance and emit notification
            const io = getIO();
            if (io) {
                io.to(job.created_by._id.toString()).emit('newNotification', notification);
            }

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
export const applyInternship = async (req, res) => {
      try {
            const internshipId = req.params.id;
            const userId = req.user._id;
            console.log("USER:", req.user);
            console.log("Internship ID:", internshipId);
            console.log("Creating application...");

            const internship = await Internship.findById(internshipId).populate('created_by');
            if (!internship) {
                  return res.status(404).json({
                        success: false,
                        message: "Internship not found"
                  });
            }

            const student = await Student.findById(userId);
            if (!student) {
                  return res.status(404).json({
                        success: false,
                        message: "Student not found"
                  });
            }

            // ✅ Check for duplicate application
            const existingApplication = await Application.findOne({
                  internship: internshipId,
                  applicant: userId
            });

            if (existingApplication) {
                  return res.status(400).json({
                        success: false,
                        message: "You have already applied to this internship"
                  });
            }

            const application = await Application.create({
                  internship: internshipId,
                  applicant: userId,
                  status: 'pending',
                  ...req.body
            });

            await Internship.findByIdAndUpdate(internshipId, {
                  $addToSet: { applications: application._id }
            });

            const notification = await Notification.create({
                  recipient: internship.created_by._id,
                  sender: userId,
                  senderModel: 'Student',
                  type: 'application',
                  title: 'New Internship Application',
                  message: `${student.fullname} applied for "${internship.title}"`,
                  read: false
            });

            console.log("Application created:", application);

            const io = req.app.get('io');
            if (io) {
                  io.to(internship.created_by._id.toString()).emit('newNotification', notification);
            } else {
                  console.warn("Socket.io not available for notification");
            }

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
        const userId = req.user._id; // Using _id instead of id
        console.log("Fetching applications for userId:", userId);

        const applications = await Application.find({ applicant: userId })
            .populate({
                path: 'job',
                model: 'Job', // Explicitly specify the model
                populate: {
                    path: 'created_by',
                    model: 'Recruiter',
                    select: 'companyname'
                }
            })
            .sort({ createdAt: -1 });

        console.log("Found applications:", JSON.stringify(applications, null, 2));

        return res.status(200).json({
            success: true,
            appliedJobs: applications
        });
    } catch (error) {
        console.error("Error in getAppliedJobs:", error);
        next(error);
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
