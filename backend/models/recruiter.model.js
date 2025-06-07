import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
      {
            companyname: {
                  type: String,
                  required: true
            },
            email: {
                  type: String,
                  required: true,
                  unique: true,
            },
            cinnumber: {
                  type: String,
                  required: true
            },
            companyaddress: {
                  type: String,
                  required: true
            },

            role: {
                  type: String,
                  default: "recruiter",
                  immutable: true,
            },
            password: {
                  type: String,
                  required: true
            },
            profile: {
                  profilePhoto: {
                        type: String,
                        default: ""
                  }
            },

      },
      {
            timestamps: true,
      }
);
export const Recruiter = mongoose.model("Recruiter", recruiterSchema);