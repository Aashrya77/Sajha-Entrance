import Student from "../models/Student.js";
import OnlineClass from "../models/OnlineClass.js";
import jwt from "jsonwebtoken";
import Notice from "../models/Notice.js";
import Popup from "../models/Popup.js";
import { canAccessClasses, getClassStatus } from "./Class.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

// Generate JWT Token
const generateToken = (studentId, studentName) => {
  return jwt.sign(
    { studentId, studentName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Student Login Page
export const loginPage = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  
  res.render("student/login", {
    pageName: "Student Login",
    parentGroup: "None",
    notice,
    popup,
    errorMessage: req.query.error || null,
  });
};

// Student Login
export const login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.render("student/login", {
        pageName: "Student Login",
        parentGroup: "None",
        notice: await Notice.findOne().sort({ _id: -1 }).exec(),
        popup: await Popup.findOne({ isActive: true }).exec(),
        errorMessage: "Please provide both Student ID and Password",
      });
    }

    // Find student
    const student = await Student.findOne({ studentId: studentId.trim() });

    if (!student) {
      return res.render("student/login", {
        pageName: "Student Login",
        parentGroup: "None",
        notice: await Notice.findOne().sort({ _id: -1 }).exec(),
        popup: await Popup.findOne({ isActive: true }).exec(),
        errorMessage: "Invalid Student ID or Password",
      });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);

    if (!isPasswordValid) {
      return res.render("student/login", {
        pageName: "Student Login",
        parentGroup: "None",
        notice: await Notice.findOne().sort({ _id: -1 }).exec(),
        popup: await Popup.findOne({ isActive: true }).exec(),
        errorMessage: "Invalid Student ID or Password",
      });
    }

    // Generate token
    const token = generateToken(student.studentId, student.name);

    // Set cookie
    res.cookie("studentToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to profile
    res.redirect("/student/profile");
  } catch (error) {
    console.error("Login error:", error);
    res.render("student/login", {
      pageName: "Student Login",
      parentGroup: "None",
      notice: await Notice.findOne().sort({ _id: -1 }).exec(),
      popup: await Popup.findOne({ isActive: true }).exec(),
      errorMessage: "An error occurred. Please try again.",
    });
  }
};

// Student Profile Page
export const profilePage = async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();

    // Get student data from database
    const student = await Student.findOne({ studentId: req.student.studentId });

    if (!student) {
      res.clearCookie("studentToken");
      return res.redirect("/student/login");
    }

    // Debug: Get all classes to see what's in database
    const allClasses = await OnlineClass.find({}).exec();
    console.log(`Total classes in database: ${allClasses.length}`);
    if (allClasses.length > 0) {
      console.log("All courses in database:", allClasses.map(c => c.course));
    }
    console.log(`Student course: "${student.course}"`);

    // Get classes for student's course (exact match, trimmed)
    const classes = await OnlineClass.find({ 
      course: student.course.trim()
    })
      .sort({ classDateTime: 1 })
      .exec();

    console.log(`Found ${classes.length} classes for course: "${student.course}"`);
    if (classes.length > 0) {
      console.log("Classes found:", classes.map(c => ({ title: c.classTitle, course: c.course })));
    }

    // Format classes with status
    const formattedClasses = classes.map(cls => ({
      id: cls._id.toString(),
      classTitle: cls.classTitle,
      subject: cls.subject,
      classDateTime: cls.classDateTime,
      status: getClassStatus(cls.classDateTime, cls.duration || 60),
    }));

    // Check access
    const accessCheck = canAccessClasses(student);

    res.render("student/profile", {
      pageName: "Student Profile",
      parentGroup: "None",
      notice,
      popup,
      student: {
        name: student.name,
        studentId: student.studentId,
        course: student.course,
        accountStatus: student.accountStatus,
        trialExpiryDate: student.trialExpiryDate,
      },
      classes: formattedClasses,
      canAccessClasses: accessCheck.allowed,
      accessMessage: accessCheck.message,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.redirect("/student/login");
  }
};

// Get Student Data (for API/JSON responses)
export const getStudentData = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.student.studentId })
      .select("-password");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      name: student.name,
      studentId: student.studentId,
      course: student.course,
      accountStatus: student.accountStatus,
      trialExpiryDate: student.trialExpiryDate,
    });
  } catch (error) {
    console.error("Get student data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Student Logout
export const logout = (req, res) => {
  res.clearCookie("studentToken");
  res.redirect("/");
};
