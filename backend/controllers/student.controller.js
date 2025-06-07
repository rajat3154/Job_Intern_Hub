import { Recruiter } from "../models/recruiter.model.js";
import { Student } from "../models/student.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
export const sregister = async (req, res) => {
      try {
            const { fullname, email, phonenumber, password, role, status } = req.body;
            console.log(fullname, email, phonenumber, password, role, status);

            if (!fullname || !email || !phonenumber || !password || !status || !role) {
                  return res.status(400).json({
                        message: "All fields are required",
                        success: false
                  });
            }
            if (!req.file) {
                  return res.status(400).json({
                        message: "Profile photo is required",
                        success: false
                  });
            }
            const file = req.file;
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

            if (role !== "student") {
                  return res.status(400).json({
                        message: "Invalid role",
                        success: false
                  });
            }


            const studentExists = await Student.findOne({ email });
            if (studentExists) {
                  return res.status(400).json({
                        message: "Email already exists",
                        success: false
                  });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await Student.create({
                  fullname,
                  email,
                  phonenumber,
                  password: hashedPassword,
                  role: 'student',
                  status,
                  profile: {
                        profilePhoto: cloudResponse.secure_url,
                  }

            });

            res.status(201).json({
                  message: "Account created successfully",
                  success: true
            });

      } catch (error) {
            console.error("Error in register", error);
            return res.status(500).json({
                  message: "Internal server error",
                  success: false,
                  error: error.message,
            });
      }
};




export const login = async (req, res) => {
      try {
            const { email, password, role } = req.body;

            if (!email || !password || !role) {
                  return res.status(400).json({
                        message: "All fields are required",
                        success: false,
                  });
            }

            // 🔐 Admin login
            if (role === "admin") {
                  if (email !== "admin@gmail.com" || password !== "admin") {
                        return res.status(400).json({
                              message: "Invalid admin credentials",
                              success: false,
                        });
                  }

                  const adminUser = {
                        _id: "admin_default_id",
                        email,
                        role,
                        fullname: "Admin",
                  };

                  const token = jwt.sign(
                        { userId: adminUser._id, role: "admin" },
                        process.env.SECRET_KEY,
                        { expiresIn: "1d" }
                  );

                  return res
                        .status(200)
                        .cookie("token", token, {
                              maxAge: 24 * 60 * 60 * 1000,
                              httpOnly: true,
                              secure: false,
                              sameSite: "lax",
                        })
                        .json({
                              message: "Welcome Admin",
                              success: true,
                              user: adminUser,
                              token,
                        });
            }

            // 🔍 Determine model based on role
            const userModel = role === "student" ? Student : Recruiter;
            const user = await userModel.findOne({ email });

            if (!user) {
                  return res.status(400).json({
                        message: "Incorrect email or password",
                        success: false,
                  });
            }

            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (!isPasswordMatch) {
                  return res.status(400).json({
                        message: "Incorrect email or password",
                        success: false,
                  });
            }

            if (role !== user.role) {
                  return res.status(400).json({
                        message: "Account does not exist with current role",
                        success: false,
                  });
            }

            // ✅ INCLUDE role in token!
            const token = jwt.sign(
                  { userId: user._id, role: user.role },
                  process.env.SECRET_KEY,
                  { expiresIn: "1d" }
            );

            const userResponse =
                  role === "student"
                        ? {
                              _id: user._id,
                              fullname: user.fullname,
                              email: user.email,
                              phonenumber: user.phonenumber,
                              role: user.role,
                              status: user.status,
                              profile: user.profile,
                        }
                        : {
                              _id: user._id,
                              companyname: user.companyname,
                              email: user.email,
                              cinnumber: user.cinnumber,
                              role: user.role,
                              status: user.status,
                              profile: user.profile,
                        };

            const welcomeMessage =
                  role === "student"
                        ? `Welcome back ${user.fullname}`
                        : `Welcome back ${user.companyname}`;

            return res
                  .status(200)
                  .cookie("token", token, {
                        maxAge: 24 * 60 * 60 * 1000,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "Lax",
                  })
                  .json({
                        message: welcomeMessage,
                        success: true,
                        user: userResponse,
                        token,
                        debugCookies: req.cookies,
                  });
      } catch (error) {
            console.error("Login Error:", error.message);
            return res.status(500).json({
                  message: "Internal server error",
                  success: false,
            });
      }
};
export const logout = async (req, res) => {
      try {
            return res.status(200).cookie("token", "", { maxAge: 0 }).json({
                  message: "Logged out successfully",
                  success: true,
            });
      } catch (error) {
            console.log(error);
      }
};
export const updateProfile = async (req, res) => {
      try {
            const { fullname, email, phonenumber, bio, skills } = req.body;
            const file = req.file;

            console.log("Updating Profile for User ID:", req.user.id);

            const user = await Student.findById(req.user.id);
            if (!user) {
                  return res.status(400).json({
                        message: "User not found",
                        success: false,
                  });
            }

            if (fullname) user.fullname = fullname;
            if (email) user.email = email;
            if (phonenumber) user.phonenumber = phonenumber;
            if (bio) user.profile.bio = bio;
            if (skills) user.profile.skills = skills.split(",");

            if (file) {
                  const fileUri = getDataUri(file);
                  const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                  user.profile.resume = cloudResponse.secure_url;
                  user.profile.resumeOriginalName = file.originalname;
            }

            await user.save();

            return res.status(200).json({
                  message: "Profile updated successfully",
                  user,
                  success: true,
            });
      } catch (error) {
            console.error("Update Profile Error:", error.message);
            return res.status(500).json({
                  message: "Internal server error",
                  success: false,
            });
      }
};
export const getAllStudents = async (req, res) => {
      try {
            const students = await Student.find().sort({ createdAt: -1 });

            return res.status(200).json({
                  success: true,
                  students,
            });
      } catch (error) {
            console.error("Error fetching students:", error);
            return res.status(500).json({
                  success: false,
                  message: "Failed to fetch students",
            });
      }
};
export const isAdmin = (req, res, next) => {
      if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                  success: false,
                  message: "Access denied. Admins only.",
            });
      }
      next();
};

// controllers/studentController.js



// DELETE /api/v1/students/:id
export const deleteStudent = async (req, res) => {
      try {
            const studentId = req.params.id;

            // Optional: Only admin can delete, check if user is admin
            if (req.user.role !== "admin") {
                  return res.status(403).json({ message: "Access denied. Admins only." });
            }

            const deletedStudent = await Student.findByIdAndDelete(studentId);

            if (!deletedStudent) {
                  return res.status(404).json({ message: "Student not found." });
            }

            res.status(200).json({ message: "Student deleted successfully." });
      } catch (error) {
            console.error("Error deleting student:", error);
            res.status(500).json({ message: "Server error while deleting student." });
      }
};

export const getOtherUsers = async (req, res) => {
      try {
            const loggedInUserId = req.id;
            const otherUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
            return res.status(200).json(otherUsers);
      } catch (error) {
            console.log(error);
      }
  }
