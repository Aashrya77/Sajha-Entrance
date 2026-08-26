import Student from "../models/Student.js";
import AdminUserModel from "../models/AdminUser.js";
import OnlineClass from "../models/OnlineClass.js";
import RecordedClass from "../models/RecordedClass.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { firebaseAdminClient } from "../config/firebaseadmin.js";
import { getClassStatus } from "./Class.js";
import { MailHandler } from "./MailHandler.js";
import { resolveRecordedClassMedia } from "../utils/youtube.js";
import { resolvePublicFrontendUrl } from "../utils/publicUrl.js";
import { getCourseRegexMatchers } from "../utils/courseAccess.js";
import { isAakashSmsConfigured, normalizeNepalMobileNumber, sendAakashSms } from "../services/aakashSmsService.js";

import {
  buildOnlineClassCourseQuery,
  formatOnlineClassCourseLabel,
  resolveOnlineClassCourses,
} from "../utils/onlineClassCourses.js";
import {
  canSwitchStudentCourse,
  normalizeStudentCourse,
} from "../constants/studentCourses.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const PASSWORD_RESET_EXPIRY_MS = 1000 * 60 * 30;
const STUDENT_REGISTRATION_ATTEMPTS = 3;

// Generate JWT Token
const generateToken = (id, studentId, email) => {
  return jwt.sign({ id, studentId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const buildFrontendUrl = (req) => resolvePublicFrontendUrl(req);

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const resolveStudentCourseForResponse = (value = "") =>
  normalizeStudentCourse(value) || String(value || "").trim();

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const getDuplicateKeyField = (error) => {
  const keyPatternField = Object.keys(error?.keyPattern || {})[0];
  if (keyPatternField) {
    return keyPatternField;
  }

  const keyValueField = Object.keys(error?.keyValue || {})[0];
  if (keyValueField) {
    return keyValueField;
  }

  const messageMatch = String(error?.message || "").match(/index:\s+([^\s_]+)_/i);
  return messageMatch?.[1] || "";
};

const buildDuplicateFieldMessage = (fieldName) => {
  if (fieldName === "email") {
    return "An account with this email already exists.";
  }

  if (fieldName === "studentId") {
    return "Registration failed because a student ID conflict occurred. Please try again.";
  }

  return "A record with this information already exists.";
};

const createStudentWithRetry = async (studentPayload) => {
  for (let attempt = 1; attempt <= STUDENT_REGISTRATION_ATTEMPTS; attempt += 1) {
    try {
      const student = new Student(studentPayload);
      await student.save();
      return student;
    } catch (error) {
      const duplicateField = getDuplicateKeyField(error);
      const shouldRetryStudentIdConflict =
        error?.code === 11000 &&
        duplicateField === "studentId" &&
        attempt < STUDENT_REGISTRATION_ATTEMPTS;

      if (!shouldRetryStudentIdConflict) {
        throw error;
      }
    }
  }
};

// Student Register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, collegeName, course } = req.body || {};
    const normalizedCourse = normalizeStudentCourse(course);

    if (!name || !email || !password || !course) {
      return res.status(400).json({ success: false, error: "Name, email, password and course are required." });
    }

    if (!normalizedCourse) {
      return res.status(400).json({ success: false, error: "Please select a valid course." });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existingStudent) {
      return res.status(400).json({ success: false, error: "An account with this email already exists." });
    }

    await createStudentWithRetry({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone?.trim(),
      address: address?.trim(),
      collegeName: collegeName?.trim(),
      course: normalizedCourse,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please login.",
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: buildDuplicateFieldMessage(getDuplicateKeyField(error)),
      });
    }
    res.status(500).json({ success: false, error: "Registration failed. Please try again." });
  }
};

// Student Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

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
        course: resolveStudentCourseForResponse(student.course),
        accountStatus: student.accountStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed. Please try again." });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required." });
    }

    const requestedAccountType =
      String(req.body?.accountType || "").toLowerCase() === "admin" ? "admin" : "student";
    const account =
      requestedAccountType === "admin"
        ? await AdminUserModel.findOne({ email, isActive: true }).select(
            "+passwordResetToken +passwordResetExpires"
          )
        : await Student.findOne({ email });

    if (!account) {
      return res.json({
        success: true,
        message:
          "If an account with that email exists, reset instructions have been sent to its registered contact details.",
      });
    }

    const rawResetToken = crypto.randomBytes(32).toString("hex");
    account.passwordResetToken = hashResetToken(rawResetToken);
    account.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await account.save();

    const resetUrl = `${buildFrontendUrl(req)}/reset-password/${rawResetToken}?account=${requestedAccountType}`;
    const accountName = requestedAccountType === "admin" ? account.fullName : account.name;

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: account.email,
      subject: "Reset your Sajha Entrance password",
      text: [
        `Hello ${accountName},`,
        "",
        "We received a request to reset your Sajha Entrance password.",
        `Open this link to choose a new password: ${resetUrl}`,
        "",
        "This link will expire in 30 minutes.",
        "If you did not request a password reset, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>Hello ${accountName},</p>
        <p>We received a request to reset your Sajha Entrance password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      `,
    };
    const deliveries = [];
    const studentMobile = requestedAccountType === "student"
      ? normalizeNepalMobileNumber(account.phone)
      : "";

    if (studentMobile && isAakashSmsConfigured()) {
      deliveries.push({
        channel: "SMS",
        promise: sendAakashSms({
          to: studentMobile,
          text: `Sajha Entrance password reset: ${resetUrl} Expires in 30 minutes.`,
        }),
      });
    }

    if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
      deliveries.push({ channel: "email", promise: MailHandler.sendMail(mailOptions) });
    }

    if (!deliveries.length) {
      throw new Error("No password reset delivery channel is configured for this account.");
    }

    const deliveryResults = await Promise.allSettled(
      deliveries.map(({ promise }) => promise)
    );
    deliveryResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.warn(
          `Password reset ${deliveries[index].channel} delivery failed:`,
          result.reason?.message || result.reason
        );
      }
    });
    if (!deliveryResults.some((result) => result.status === "fulfilled")) {
      throw new Error("All password reset delivery channels failed.");
    }

    res.json({
      success: true,
      message:
        "If an account with that email exists, reset instructions have been sent to its registered contact details.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send password reset instructions. Please try again.",
    });
  }
};

export const validateResetToken = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ success: false, error: "Reset token is required." });
    }

    const tokenHash = hashResetToken(token);
    const [student, adminUser] = await Promise.all([
      Student.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      }).select("_id"),
      AdminUserModel.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      }).select("_id +passwordResetToken +passwordResetExpires"),
    ]);

    if (!student && !adminUser) {
      return res.status(400).json({ success: false, error: "Reset link is invalid or has expired." });
    }

    res.json({
      success: true,
      message: "Reset link is valid.",
      accountType: adminUser ? "admin" : "student",
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    res.status(500).json({ success: false, error: "Failed to validate reset link." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token || !password) {
      return res.status(400).json({ success: false, error: "Reset token and password are required." });
    }

    const tokenHash = hashResetToken(token);
    let account = await Student.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });
    let accountType = "student";

    if (!account) {
      account = await AdminUserModel.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
      }).select("+passwordResetToken +passwordResetExpires");
      accountType = "admin";
    }

    if (!account) {
      return res.status(400).json({ success: false, error: "Reset link is invalid or has expired." });
    }

    account.password = password;
    account.passwordResetToken = undefined;
    account.passwordResetExpires = undefined;
    await account.save();

    res.json({
      success: true,
      message: "Password reset successful. Please log in with your new password.",
      accountType,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, error: "Failed to reset password. Please try again." });
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
        course: resolveStudentCourseForResponse(student.course),
        accountStatus: student.accountStatus,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select("-password");

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found." });
    }

    const nextName = String(req.body.name || "").trim();
    if (!nextName) {
      return res.status(400).json({ success: false, error: "Name is required." });
    }

    student.name = nextName;
    student.phone = String(req.body.phone || "").trim();
    student.address = String(req.body.address || "").trim();
    student.collegeName = String(req.body.collegeName || "").trim();

    const hasCourseInPayload = Object.prototype.hasOwnProperty.call(req.body || {}, "course");

    if (hasCourseInPayload) {
      const normalizedRequestedCourse = normalizeStudentCourse(req.body.course);
      if (!normalizedRequestedCourse) {
        return res.status(400).json({
          success: false,
          error: "Please select a valid course.",
        });
      }

      const currentCourse = resolveStudentCourseForResponse(student.course);
      if (normalizedRequestedCourse !== currentCourse) {
        if (!canSwitchStudentCourse(currentCourse)) {
          return res.status(403).json({
            success: false,
            error: "Course can only be changed if your current course is NEB Preparation.",
          });
        }

        student.course = normalizedRequestedCourse;
      } else if (student.course !== normalizedRequestedCourse) {
        student.course = normalizedRequestedCourse;
      }
    }

    await student.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        collegeName: student.collegeName,
        course: resolveStudentCourseForResponse(student.course),
        accountStatus: student.accountStatus,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile." });
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
    const classes = await OnlineClass.find(buildOnlineClassCourseQuery(student.course))
      .sort({ classDateTime: 1 })
      .exec();

    const formattedClasses = classes.map((cls) => {
      const status = getClassStatus(cls.classDateTime, cls.duration || 60);
      const classCourses = resolveOnlineClassCourses(cls);

      return {
        id: cls._id.toString(),
        classTitle: cls.classTitle,
        subject: cls.subject,
        course: formatOnlineClassCourseLabel(classCourses),
        courses: classCourses,
        classDateTime: cls.classDateTime,
        duration: cls.duration,
        status,
        // Only send zoom link if student is paid
        zoomMeetingLink: isPaid ? cls.zoomMeetingLink : null,
      };
    });

    // Get recorded classes
    const courseMatchers = getCourseRegexMatchers(student.course);
    const recordedClasses = await RecordedClass.find({
      courseIds: { $in: courseMatchers },
    })
      .sort({ classDate: -1 })
      .exec();

    const formattedRecorded = recordedClasses.map((cls) => {
      const media = resolveRecordedClassMedia(cls);

      return {
        id: cls._id.toString(),
        subject: cls.subject,
        topicName: cls.topicName,
        contentType: media.contentType,
        videoId: isPaid ? media.videoId : null,
        playlistId: isPaid ? media.playlistId : null,
        youtubeUrl: isPaid ? media.youtubeUrl : null,
        classDate: cls.classDate,
        description: cls.description,
      };
    });

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

//FIREBASE LOGIN
export const firebaseLogin = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        success: false,
        error: "Firebase token required",
      });
    }

    const decoded = await firebaseAdminClient.verifyIdToken(firebaseToken);
    const firebaseEmail = normalizeEmail(decoded.email);

    if (!firebaseEmail) {
      return res.status(403).json({
        success: false,
        code: "REGISTRATION_REQUIRED",
        error: "Student registration is required before Firebase login.",
      });
    }

    const student = await Student.findOne({
      email: firebaseEmail,
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        code: "REGISTRATION_REQUIRED",
        error: "Student registration is required before Firebase login.",
      });
    }

    const token = generateToken(
      student._id,
      student.studentId,
      student.email,
    );

    return res.json({
      success: true,
      token,
      data: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
      },
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message,
    });
  }
};
