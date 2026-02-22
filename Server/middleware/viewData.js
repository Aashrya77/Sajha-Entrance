import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to inject student data into all views
export const injectStudentData = async (req, res, next) => {
  const token = req.cookies?.studentToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const student = await Student.findOne({ studentId: decoded.studentId })
        .select("name studentId course accountStatus");

      if (student) {
        req.studentData = {
          name: student.name,
          studentId: student.studentId,
          course: student.course,
          accountStatus: student.accountStatus,
        };
        res.locals.studentData = req.studentData;
        res.locals.isAuthenticated = true;
      } else {
        res.locals.isAuthenticated = false;
      }
    } catch (error) {
      res.locals.isAuthenticated = false;
    }
  } else {
    res.locals.isAuthenticated = false;
  }

  next();
};
