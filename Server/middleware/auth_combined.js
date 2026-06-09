import jwt from "jsonwebtoken";
import admin from "../config/firebaseAdmin.js";
import Student from "../models/Student.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticateAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const cookieToken = req.cookies?.studentToken;
    const token = headerToken || cookieToken || req.headers["x-auth-token"];

    console.log("AUTH HEADER:", authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token",
      });
    }

    console.log("TOKEN RECEIVED:", token.substring(0, 30));

    try {
      const mongoUser = jwt.verify(token, JWT_SECRET);

      console.log("Mongo JWT Success");

      req.student = mongoUser;
      req.authType = "mongo";

      return next();
    } catch (e) {
      console.log("Mongo JWT Error:", e.message);
    }

    try {
      const firebaseUser =
        await admin.auth().verifyIdToken(token);

      console.log("Firebase JWT Success");
      console.log("Firebase Email:", firebaseUser.email);

      let student = await Student.findOne({
        email: firebaseUser.email,
      });

      if (!student) {
        student = await Student.create({
          email: firebaseUser.email,
          password: Math.random().toString(36),
          name:
            firebaseUser.name ||
            firebaseUser.email.split("@")[0],
          course: "BSc.CSIT",
        });

        console.log(
          "New Firebase student created:",
          student.email
        );
      }

      req.student = {
        id: student._id,
        email: student.email,
        studentId: student.studentId,
      };

      req.authType = "firebase";

      console.log("CALLING NEXT()");
      return next();
    } catch (e) {
      console.log("Firebase JWT Error:", e.message);
    }

    console.log("RETURNING INVALID TOKEN");

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  } catch (e) {
    console.log("SERVER ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};