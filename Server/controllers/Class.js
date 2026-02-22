import OnlineClass from "../models/OnlineClass.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";
import Notice from "../models/Notice.js";
import Popup from "../models/Popup.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Check if student can access classes
export const canAccessClasses = (student) => {
  if (student.accountStatus === "Paid") {
    return { allowed: true };
  }

  if (student.accountStatus === "Free Trial") {
    if (!student.trialExpiryDate) {
      return { allowed: false, message: "Your free trial has expired. Please complete payment to join classes." };
    }

    const now = new Date();
    const expiryDate = new Date(student.trialExpiryDate);
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    // Allow if trial hasn't expired and is within 2 days of expiry (or any active trial)
    if (daysRemaining > 0 && daysRemaining <= 2) {
      return { allowed: true };
    } else if (daysRemaining > 2) {
      // Allow all free trial users (within their trial period)
      return { allowed: true };
    } else {
      return { allowed: false, message: "Your free trial has expired. Please complete payment to join classes." };
    }
  }

  // Expired or Unpaid
  return { allowed: false, message: "Your free trial has expired. Please complete payment to join classes." };
};

// Get class status (Live Now, Upcoming, Completed)
export const getClassStatus = (classDateTime, duration = 60) => {
  const now = new Date();
  const classStart = new Date(classDateTime);
  const classEnd = new Date(classStart.getTime() + duration * 60 * 1000);

  if (now < classStart) {
    return "Upcoming";
  } else if (now >= classStart && now <= classEnd) {
    return "Live Now";
  } else {
    return "Completed";
  }
};

// Join Class - validates and redirects to Zoom
export const joinClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Get student from token
    const token = req.cookies?.studentToken;
    if (!token) {
      return res.redirect("/student/login");
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });

    if (!student) {
      res.clearCookie("studentToken");
      return res.redirect("/student/login");
    }

    // Check access control
    const accessCheck = canAccessClasses(student);
    if (!accessCheck.allowed) {
      return res.redirect(`/student/profile?error=${encodeURIComponent(accessCheck.message)}`);
    }

    // Find class
    const onlineClass = await OnlineClass.findById(classId);

    if (!onlineClass) {
      return res.status(404).send("Class not found");
    }

    // Verify student's course matches class course
    if (onlineClass.course !== student.course) {
      return res.status(403).send("You don't have access to this class");
    }

    // Redirect to Zoom meeting
    res.redirect(onlineClass.zoomMeetingLink);
  } catch (error) {
    console.error("Join class error:", error);
    res.status(500).send("An error occurred while joining the class");
  }
};
