import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";

import connectDB from "./db/connectDB.js";
import CourseRoutes from "./routes/Course.js";
import CollegeRoutes from "./routes/College.js";
import HomeRoutes from "./routes/Home.js";
import BlogRoutes from "./routes/Blog.js";
import AuthRoutes from "./routes/Auth.js";
import ResultRoutes from "./routes/Result.js";
import PaymentRoutes from "./routes/Payment.js";
import UniversityRoutes from "./routes/University.js";
import MockTestRoutes from "./routes/MockTest.js";
import BlogUploadRoutes from "./routes/BlogUpload.js";
import BookPaymentRoutes from "./routes/BookPayment.js";
import InquiryRoutes from "./routes/Inquiry.js";

import { startAdminPanel } from "./admin/Admin.js";
import { adminBrandAssets } from "./admin/config/branding.js";
import { createLogger } from "./utils/logger.js";
import {
  mediaRootDirectory,
  publicDirectory,
} from "./utils/media.js";
import { backfillLegacyResultExams } from "./services/resultService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const logger = createLogger("server");

const staticFileOptions = {
  fallthrough: true,
  maxAge: "7d",
};

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://sajhaentrance.org",
    ],
    credentials: true,
  })
);

app.use(cookieParser());

// ================= STATIC FILES (FIXED) =================

// 1. Serve entire public folder
app.use(express.static(publicDirectory, staticFileOptions));

// 2. Canonical media route
app.use("/media", express.static(mediaRootDirectory, staticFileOptions));

// 3. AdminJS assets
if (fs.existsSync(adminBrandAssets.appPublicDirectory)) {
  app.use(
    adminBrandAssets.publicMountPath,
    express.static(adminBrandAssets.appPublicDirectory, staticFileOptions)
  );

  app.use(
    "/brand-assets",
    express.static(adminBrandAssets.appPublicDirectory, staticFileOptions)
  );
}

// ================= ROUTES =================
app.use("/api", HomeRoutes);
app.use("/api", BlogRoutes);
app.use("/api", CourseRoutes);
app.use("/api", CollegeRoutes);
app.use("/api/student", AuthRoutes);
app.use("/api", ResultRoutes);
app.use("/api", PaymentRoutes);
app.use("/api", UniversityRoutes);
app.use("/api", MockTestRoutes);
app.use("/api", BlogUploadRoutes);
app.use("/api", BookPaymentRoutes);
app.use("/api", InquiryRoutes);

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});


// ================= START SERVER =================
const startServer = async () => {
  try {
    await connectDB();
    logger.info("MongoDB connected");

    try {
      const legacyMigration = await backfillLegacyResultExams();
      if (legacyMigration.migratedResults > 0) {
        logger.info(
          `Backfilled ${legacyMigration.migratedResults} legacy results`
        );
      }
    } catch (err) {
      logger.error("Migration error:", err.message);
    }

    const adminRouter = await startAdminPanel();
    app.use(adminRouter);

    // Body parser AFTER AdminJS router (required by AdminJS)
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
