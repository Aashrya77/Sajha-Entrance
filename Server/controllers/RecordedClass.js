import RecordedClass from "../models/RecordedClass.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Get all recorded classes for a student's course
export const getRecordedClasses = async (req, res) => {
  try {
    const token = req.cookies?.studentToken;
    if (!token) {
      return res.json({ classes: [] });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });

    if (!student) {
      return res.json({ classes: [] });
    }

    // Fetch recorded classes where student's course is in courseIds array
    const recordedClasses = await RecordedClass.find({
      courseIds: { $in: [student.course.trim()] }
    }).sort({
      classDate: -1,
    });

    res.json({ classes: recordedClasses });
  } catch (error) {
    console.error("Get recorded classes error:", error);
    res.json({ classes: [] });
  }
};

// Get single recorded class details
export const getRecordedClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const token = req.cookies?.studentToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });

    if (!student) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recordedClass = await RecordedClass.findById(classId);

    if (!recordedClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify student has access to this class
    // Check if student's course is in the video's courseIds array
    if (!recordedClass.courseIds.includes(student.course.trim())) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(recordedClass);
  } catch (error) {
    console.error("Get recorded class details error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};
