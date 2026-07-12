import jwt from "jsonwebtoken";
import admin from "../config/firebaseAdmin.js";
import Student from "../models/Student.js";
import { createLogger } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const logger = createLogger("auth");

const getRequestToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const cookieToken = req.cookies?.studentToken;

  return {
    authHeader,
    token: headerToken || cookieToken || req.headers["x-auth-token"],
  };
};

const attachStudentFromToken = async (req, token) => {
  try {
    const mongoUser = jwt.verify(token, JWT_SECRET);

    req.student = mongoUser;
    req.authType = "mongo";

    return true;
  } catch (_error) {}

  try {
    const firebaseUser = await admin.auth().verifyIdToken(token);

    let student = await Student.findOne({
      email: firebaseUser.email,
    });

    if (!student) {
      student = await Student.create({
        email: firebaseUser.email,
        password: Math.random().toString(36),
        name: firebaseUser.name || firebaseUser.email.split("@")[0],
        course: "BSc.CSIT",
      });

    }

    req.student = {
      id: student._id,
      email: student.email,
      studentId: student.studentId,
    };

    req.authType = "firebase";

    return true;
  } catch (_error) {}

  return false;
};

export const authenticateAny = async (req, res, next) => {
  try {
    const { token } = getRequestToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token",
      });
    }

    if (await attachStudentFromToken(req, token)) {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  } catch (error) {
    logger.error("Authentication middleware failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate the request.",
    });
  }
};

export const optionalAuthenticateAny = async (req, _res, next) => {
  try {
    const { token } = getRequestToken(req);

    if (token) {
      await attachStudentFromToken(req, token);
    }
  } catch (_error) {
    req.student = null;
    req.authType = null;
  }

  return next();
};
