import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAllInternships, getInternshipById, getInternshipsByRecruiter, postInternship, getLatestInternships } from "../controllers/internship.controller.js";
import { Internship } from "../models/internship.model.js";

const router = express.Router();
router.route("/post").post(isAuthenticated, postInternship);
router.route("/recruiter").get(isAuthenticated, getInternshipsByRecruiter);
router.route("/get").get(async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate("created_by", "companyname email profile")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      internships
    });
  } catch (error) {
    console.error("Error fetching internships:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch internships"
    });
  }
});
router.route("/latest").get(async (req, res) => {
  try {
    const internships = await Internship.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("created_by", "companyname profile.profilePhoto");

    res.status(200).json({
      success: true,
      internships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch internships"
    });
  }
});

router.route("/get/:id").get(isAuthenticated,getInternshipById);

export default router;
