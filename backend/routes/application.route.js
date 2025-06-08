import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
      applyInternship,
      applyJob,
      getApplicants,
      getAppliedJobs,
      updateStatus,
} from "../controllers/application.controller.js";
const router = express.Router();
router.route("/apply/:id").get(isAuthenticated, applyJob);
router.route("/apply/intern/:id").post(isAuthenticated, applyInternship);
router.route("/get").get(isAuthenticated, getAppliedJobs);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);

export default router;
