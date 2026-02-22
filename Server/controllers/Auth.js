import Student from "../models/Student.js";
import OnlineClass from "../models/OnlineClass.js";
import RecordedClass from "../models/RecordedClass.js";
import jwt from "jsonwebtoken";
import { getClassStatus } from "./Class.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

// Generate JWT Token
const generateToken = (id, studentId, email) => {
  return jwt.sign({ id, studentId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Student Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, collegeName, course } = req.body;

    if (!name || !email || !password || !course) {
      return res.status(400).json({ success: false, error: "Name, email, password and course are required." });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingStudent) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }

    const student = new Student({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      address: address?.trim(),
      collegeName: collegeName?.trim(),
      course: course.trim(),
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: "Registration successful! Please login.",
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }
    res.status(500).json({ success: false, error: "Registration failed. Please try again." });
  }
};

// Student Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    const student = await Student.findOne({ email: email.toLowerCase().trim() });

    if (!student) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid email or password." });
    }

    const token = generateToken(student._id, student.studentId, student.email);

    // Set cookie for browser
    res.cookie("studentToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      data: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        course: student.course,
        accountStatus: student.accountStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed. Please try again." });
  }
};

// Get Profile
export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found." });
    }

    res.json({
      success: true,
      data: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        collegeName: student.collegeName,
        course: student.course,
        accountStatus: student.accountStatus,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile." });
  }
};

// Get Classes for student's course
export const getClasses = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found." });
    }

    const isPaid = student.accountStatus === "Paid";

    // Get live/upcoming classes for student's course
    const classes = await OnlineClass.find({ course: student.course.trim() })
      .sort({ classDateTime: 1 })
      .exec();

    const formattedClasses = classes.map((cls) => {
      const status = getClassStatus(cls.classDateTime, cls.duration || 60);
      return {
        id: cls._id.toString(),
        classTitle: cls.classTitle,
        subject: cls.subject,
        course: cls.course,
        classDateTime: cls.classDateTime,
        duration: cls.duration,
        status,
        // Only send zoom link if student is paid
        zoomMeetingLink: isPaid ? cls.zoomMeetingLink : null,
      };
    });

    // Get recorded classes
    const recordedClasses = await RecordedClass.find({
      courseIds: { $in: [student.course.trim()] },
    })
      .sort({ classDate: -1 })
      .exec();

    const formattedRecorded = recordedClasses.map((cls) => ({
      id: cls._id.toString(),
      subject: cls.subject,
      topicName: cls.topicName,
      videoId: isPaid ? cls.videoId : null,
      youtubeUrl: isPaid ? cls.youtubeUrl : null,
      classDate: cls.classDate,
      description: cls.description,
    }));

    res.json({
      success: true,
      isPaid,
      data: {
        liveClasses: formattedClasses,
        recordedClasses: formattedRecorded,
      },
    });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch classes." });
  }
};

// Student Logout
export const logout = (req, res) => {
  res.clearCookie("studentToken");
  res.json({ success: true, message: "Logged out successfully." });
};
