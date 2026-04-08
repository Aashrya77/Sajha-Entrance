import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";

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
  findLegacyMediaFile,
  MEDIA_TYPES,
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

// 2. Backfill missing media files from legacy folders on demand
app.get("/media/:type/:filename", async (req, res, next) => {
  const { type, filename } = req.params;
  const mediaType = MEDIA_TYPES[type];

  if (!mediaType) {
    return next();
  }

  const safeFilename = path.basename(filename);
  const targetDirectory = path.join(mediaRootDirectory, mediaType);
  const targetPath = path.join(targetDirectory, safeFilename);

  if (fs.existsSync(targetPath)) {
    return next();
  }

  try {
    const legacyFilePath = await findLegacyMediaFile(mediaType, safeFilename);
    if (!legacyFilePath) {
      return next();
    }

    await fs.promises.mkdir(targetDirectory, { recursive: true });
    await fs.promises.copyFile(legacyFilePath, targetPath);
    return res.sendFile(targetPath);
  } catch (error) {
    logger.error(`Media fallback failed for ${mediaType}/${safeFilename}:`, error.message);
    return next();
  }
});

// 3. Canonical media route
app.use("/media", express.static(mediaRootDirectory, staticFileOptions));

// 4. AdminJS assets
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

const registerApiRoutes = () => {
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
};


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

    // Body parser after AdminJS router, before JSON API routes.
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    registerApiRoutes();

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
