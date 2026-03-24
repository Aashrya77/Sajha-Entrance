import express from "express";
import {
  submitInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByCollege,
  getInquiriesByUniversity,
} from "../controllers/Inquiry.js";

const router = express.Router();

// Public route - submit inquiry from college or university page
router.post("/inquiry", submitInquiry);

// Admin routes
router.get("/inquiries", getAllInquiries);
router.get("/inquiry/:id", getInquiryById);
router.put("/inquiry/:id", updateInquiryStatus);
router.delete("/inquiry/:id", deleteInquiry);

// Get inquiries by college
router.get("/inquiries/college/:collegeId", getInquiriesByCollege);

// Get inquiries by university
router.get("/inquiries/university/:universityId", getInquiriesByUniversity);

export default router;
