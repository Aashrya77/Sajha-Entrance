import jwt from "jsonwebtoken";
import { firebaseAdminClient } from "../config/firebaseadmin.js";
import Student from "../models/Student.js";
import { createLogger } from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const logger = createLogger("auth");
const REGISTRATION_REQUIRED_CODE = "REGISTRATION_REQUIRED";

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

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
    const firebaseUser = await firebaseAdminClient.verifyIdToken(token);
    const firebaseEmail = normalizeEmail(firebaseUser.email);

    if (!firebaseEmail) {
      return REGISTRATION_REQUIRED_CODE;
    }

    const student = await Student.findOne({
      email: firebaseEmail,
    });

    if (!student) {
      return REGISTRATION_REQUIRED_CODE;
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

    const authResult = await attachStudentFromToken(req, token);

    if (authResult === true) {
      return next();
    }

    if (authResult === REGISTRATION_REQUIRED_CODE) {
      return res.status(403).json({
        success: false,
        code: REGISTRATION_REQUIRED_CODE,
        error: "Student registration is required before accessing this resource.",
      });
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
      const authResult = await attachStudentFromToken(req, token);
      if (authResult !== true) {
        req.student = null;
        req.authType = null;
      }
    }
  } catch (_error) {
    req.student = null;
    req.authType = null;
  }

  return next();
};
