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

            const recruiterId = req.user.id; // Logged-in recruiter ID from auth middleware
            console.log(recruiterId);
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
            console.log("Received internshipId:", internshipId); 
            const internship = await Internship.findById(internshipId).populate({
                  path: "applications"
            });
            if (!internship) {
                  return res.status(404).json({
                        message: "Internship not found",
                        success: false
                  })
            };
            return res.status(200).json({
                  internship,
                  success: true
            })
      } catch (error) {
            console.log(error);
      }
}
export const getInternshipsByRecruiter = async (req, res) => {
      try {
            // Fetch the internships where the recruiter field matches the logged-in user's ID
            const recruiterId = req.user.id; // Get the recruiter ID from the authenticated user
            const internships = await Internship.find({ recruiter: recruiterId })
                  .populate({
                        path: "recruiter",
                        select: "companyname email companyaddress companystatus", // Populate the recruiter fields you need
                  })
                  .sort({ createdAt: -1 }); // Sort by the most recent internships

            if (!internships || internships.length === 0) {
                  return res.status(404).json({
                        message: "No internships found for this recruiter",
                        success: false,
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
