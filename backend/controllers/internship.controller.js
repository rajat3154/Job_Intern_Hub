import { Internship } from "../models/internship.model.js"; // Adjust path if needed




export const postInternship = async (req, res) => {
      try {
            const {
                  title,
                  description,
                  duration,
                  stipend,
                  location,
                  type,
                  skills,
            } = req.body;

            const recruiterId = req.user._id; // Use _id, not id

            if (!title || !description || !duration || !stipend || !location || !type || !skills) {
                  return res.status(400).json({
                        message: "Please fill in all fields",
                        success: false,
                  });
            }

            const skillsArray = Array.isArray(skills)
                  ? skills
                  : skills.split(",").map(skill => skill.trim());

            const internship = await Internship.create({
                  title,
                  description,
                  duration,
                  stipend,
                  location,
                  type,
                  skills: skillsArray,
                  recruiter: recruiterId,
                  created_by: recruiterId,  // << Add this line!
            });

            return res.status(201).json({
                  message: "Internship posted successfully",
                  success: true,
                  internship,
            });
      } catch (error) {
            console.error("Error posting internship:", error);
            return res.status(500).json({
                  message: "Server error",
                  success: false,
            });
      }
};
    
export const getAllInternships = async (req, res) => {
      try {
            const internships = await Internship.find({})
                  .populate({
                        path: "recruiter",
                        select: "companyname email companyaddress companystatus"
                  })
                  .sort({ createdAt: -1 });

            if (!internships || internships.length === 0) {
                  return res.status(404).json({
                        message: "No internships found",
                        success: false,
                  });
            }

            return res.status(200).json({
                  message: "Internships fetched successfully",
                  internships,
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

export const getInternshipById = async (req, res) => {
      try {
            const internshipId = req.params.id;
            const userId = req.user?._id; // get logged in user ID from auth middleware

            console.log("Received internshipId:", internshipId);

            const internship = await Internship.findById(internshipId).populate({
                  path: "applications",
                  populate: {
                        path: "applicant",
                        model: "Student",
                        select: "fullname email resumeUrl"
                  }
            });

            if (!internship) {
                  return res.status(404).json({
                        message: "Internship not found",
                        success: false
                  });
            }

            // Find if the logged in user has applied and get their application status
            let currentUserApplication = null;
            if (userId) {
                  const userApp = internship.applications.find(
                        (app) => app.applicant._id.toString() === userId.toString()
                  );
                  if (userApp) {
                        currentUserApplication = {
                              status: userApp.status,
                              appliedDate: userApp.createdAt
                        };
                  }
            }

            return res.status(200).json({
                  internship,
                  currentUserId: userId || null,
                  currentUserApplication,
                  success: true
            });
      } catch (error) {
            console.log(error);
            return res.status(500).json({
                  message: "Failed to fetch internship",
                  success: false,
                  error: error.message
            });
      }
};


export const getInternshipsByRecruiter = async (req, res) => {
      try {
            const recruiterId = req.user._id;
            const internships = await Internship.find({ recruiter: recruiterId })
                  .populate({
                        path: "recruiter",
                        select: "companyname email companyaddress companystatus",
                  })
                  .sort({ createdAt: -1 });

            if (!internships || internships.length === 0) {
                  return res.status(404).json({
                        message: "No internships found for this recruiter",
                        success: false,
                        internships: [],
                  });
            }

            return res.status(200).json({
                  message: "Internships posted by recruiter",
                  internships,
                  success: true,
            });
      } catch (error) {
            console.error("Error fetching internships:", error);
            return res.status(500).json({
                  message: "Server error",
                  success: false,
            });
      }
};

export const getLatestInternships = async (req, res) => {
      try {
            const internships = await Internship.find()
                  .sort({ createdAt: -1 })
                  .limit(5)
                  .populate('created_by', 'companyname profile.profilePhoto');

            res.status(200).json({
                  success: true,
                  internships
            });
      } catch (error) {
            console.error("Failed to fetch latest internships:", error);
            res.status(500).json({
                  success: false,
                  message: "Failed to fetch latest internships"
            });
      }
};
