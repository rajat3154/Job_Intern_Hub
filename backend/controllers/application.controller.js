import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Student } from "../models/student.model.js"; 
import { Notification } from "../models/Notification.js";
import { getIO } from "../socket/socket.js";

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

            const application = await Application.findById(applicationId)
                  .populate({
                        path: 'job',
                        populate: {
                              path: 'created_by',
                              select: 'companyname'
                        }
                  })
                  .populate('applicant');

            if (!application) {
                  return res
                        .status(404)
                        .json({ message: "Application not found", success: false });
            }

            application.status = status.toLowerCase();
            await application.save();

            // Create notification
            const notification = await Notification.create({
                  recipient: application.applicant._id,
                  sender: application.job.created_by._id,
                  senderModel: 'Recruiter',
                  type: 'application',
                  title: 'Application Status Updated',
                  message: `Your application for "${application.job.title}" has been ${status.toLowerCase()} by ${application.job.created_by.companyname}`,
                  read: false
            });

            // Get socket instance and emit notification if available
            const io = getIO();
            if (io) {
                  const populatedNotification = {
                        ...notification.toObject(),
                        sender: {
                              _id: application.job.created_by._id,
                              companyname: application.job.created_by.companyname
                        }
                  };
                  io.to(application.applicant._id.toString()).emit('newNotification', populatedNotification);
            } else {
                  console.log('Socket.IO not available for real-time notification');
            }

            return res
                  .status(200)
                  .json({ 
                        message: "Status updated successfully", 
                        success: true,
                        notification 
                  });
      } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error", success: false });
      }
};
