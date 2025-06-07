import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAllInternships, getInternshipById, getInternshipsByRecruiter, postInternship } from "../controllers/internship.controller.js";
import { Internship } from "../models/internship.model.js";

const router = express.Router();
router.route("/post").post(isAuthenticated, postInternship);
router.route("/recruiter").get(isAuthenticated, getInternshipsByRecruiter);
router.route("/get").get(isAuthenticated, getAllInternships);

router.route("/get/:id").get(isAuthenticated,getInternshipById);

export default router;
