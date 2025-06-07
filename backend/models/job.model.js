import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      requirements: [{ type: String }],
      salary: { type: Number, required: true },
      experience: { type: Number, required: true },
      location: { type: String, required: true },
      jobType: { type: String, required: true },
      position: { type: Number, required: true },
      company: { type: String, required: true }, // ✅ Company name stored as a string
      
      created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true }, // ✅ Recruiter reference
      applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }]
}, { timestamps: true });


export const Job = mongoose.model("Job", jobSchema);
