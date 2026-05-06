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
import YouTubeLibraryRoutes from "./routes/YouTubeLibrary.js";

import { adminBrandAssets } from "./admin/config/branding.js";
import { ADMIN_ROOT_PATH } from "./admin/config/paths.js";
import { createLogger } from "./utils/logger.js";
import {
  findLegacyMediaFile,
  MEDIA_TYPES,
  mediaRootDirectory,
  publicDirectory,
} from "./utils/media.js";
import { resolvePublicBackendUrl } from "./utils/publicUrl.js";
import { backfillLegacyResultExams } from "./services/resultService.js";
import { syncMockTestIndexes } from "./services/mockTestIndexService.js";
import { refreshYouTubeLibrarySchedule } from "./services/youtubeLibraryScheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const logger = createLogger("server");
const isProduction = process.env.NODE_ENV === "production";

const runtimeState = {
  adminStatus: "pending",
  startupStatus: "pending",
};

const staticFileOptions = {
  fallthrough: true,
  maxAge: "7d",
};

const normalizeRequestedMediaPath = (value = "") =>
  String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => path.basename(segment))
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

const resolvePublicAdminUrl = (req) =>
  `${resolvePublicBackendUrl(req)}${ADMIN_ROOT_PATH}`;

if (isProduction) {
  app.set("trust proxy", 1);
}

// ================= GLOBAL MIDDLEWARE =================
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

// ================= STATIC FILES =================
app.use(express.static(publicDirectory, staticFileOptions));

const adminStaticDirectory = path.join(publicDirectory, "admin");

if (fs.existsSync(adminStaticDirectory)) {
  app.use(
    ADMIN_ROOT_PATH,
    express.static(adminStaticDirectory, staticFileOptions)
  );
}

app.get(/^\/media\/([^/]+)\/(.+)$/, async (req, res, next) => {
  const type = req.params?.[0];
  const requestedAssetPath = normalizeRequestedMediaPath(req.params?.[1] || "");
  const mediaType = MEDIA_TYPES[type];

  if (!mediaType || !requestedAssetPath) {
    return next();
  }

  const requestedSegments = requestedAssetPath.split("/").filter(Boolean);
  const safeFilename = path.basename(requestedAssetPath);
  const targetDirectory = path.join(mediaRootDirectory, mediaType);
  const directTargetPath = path.join(targetDirectory, ...requestedSegments);
  const canonicalTargetPath = path.join(targetDirectory, safeFilename);

  if (fs.existsSync(directTargetPath)) {
    return res.sendFile(directTargetPath);
  }

  if (fs.existsSync(canonicalTargetPath)) {
    return res.sendFile(canonicalTargetPath);
  }

  try {
    const legacyFilePath = await findLegacyMediaFile(mediaType, safeFilename);

    if (!legacyFilePath) {
      return next();
    }

    await fs.promises.mkdir(targetDirectory, { recursive: true });
    await fs.promises.copyFile(legacyFilePath, canonicalTargetPath);

    return res.sendFile(canonicalTargetPath);
  } catch (error) {
    logger.error(
      `Media fallback failed for ${mediaType}/${safeFilename}:`,
      error.message
    );
    return next();
  }
});

app.use("/media", express.static(mediaRootDirectory, staticFileOptions));

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

// ================= ADMINJS =================
// IMPORTANT:
// AdminJS must be mounted BEFORE express.json() / express.urlencoded().
const initializeAdminPanel = async () => {
  try {
    const { startAdminPanel } = await import("./admin/Admin.js");
    const adminRouter = await startAdminPanel();

    app.use(adminRouter);

    runtimeState.adminStatus = "ready";
    logger.info("Admin panel initialized");
  } catch (error) {
    runtimeState.adminStatus = "failed";
    logger.error("Admin panel initialization error:", error.message);
  }
};

// ================= API ROUTES =================
const registerApiRoutes = (router) => {
  router.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        adminStatus: runtimeState.adminStatus,
        startupStatus: runtimeState.startupStatus,
        backendUrl: resolvePublicBackendUrl(_req),
        adminUrl: resolvePublicAdminUrl(_req),
        adminRootPath: ADMIN_ROOT_PATH,
      },
    });
  });

  router.use("/api", HomeRoutes);
  router.use("/api", BlogRoutes);
  router.use("/api", CourseRoutes);
  router.use("/api", CollegeRoutes);
  router.use("/api/student", AuthRoutes);
  router.use("/api", ResultRoutes);
  router.use("/api", PaymentRoutes);
  router.use("/api", UniversityRoutes);
  router.use("/api", MockTestRoutes);
  router.use("/api", BlogUploadRoutes);
  router.use("/api", BookPaymentRoutes);
  router.use("/api", InquiryRoutes);
  router.use("/api/youtube-library", YouTubeLibraryRoutes);

  router.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });
};

const mountPublicApiRoutes = () => {
  const apiRouter = express.Router();

  apiRouter.use(express.json());
  apiRouter.use(express.urlencoded({ extended: true }));

  registerApiRoutes(apiRouter);

  app.use(apiRouter);
};

// ================= STARTUP TASKS =================
const initializeStartupTasks = async () => {
  try {
    await syncMockTestIndexes();
  } catch (error) {
    logger.error("Mock test index sync error:", error.message);
  }

  try {
    const legacyMigration = await backfillLegacyResultExams();

    if (legacyMigration.migratedResults > 0) {
      logger.info(`Backfilled ${legacyMigration.migratedResults} legacy results`);
    }
  } catch (error) {
    logger.error("Migration error:", error.message);
  }

  try {
    await refreshYouTubeLibrarySchedule();
  } catch (error) {
    logger.error("YouTube library scheduler init error:", error.message);
  }
};

// ================= START SERVER =================
const startServer = async () => {
  try {
    await connectDB();
    logger.info("MongoDB connected");

    runtimeState.startupStatus = "initializing";

    // 1. AdminJS first
    await initializeAdminPanel();

    // 2. API routes after AdminJS
    mountPublicApiRoutes();

    // 3. SPA fallback - serve index.html for all non-API, non-static routes
    const indexPath = path.join(publicDirectory, "index.html");
    if (fs.existsSync(indexPath)) {
      app.get("*", (_req, res) => {
        res.sendFile(indexPath);
      });
      logger.info("SPA fallback route registered");
    }

    // 4. Start server
    app.listen(PORT, () => {
      runtimeState.startupStatus = "ready";
      logger.info(`Server running on http://localhost:${PORT}`);
    });

    // 5. Background startup tasks
    void initializeStartupTasks();
  } catch (error) {
    runtimeState.startupStatus = "failed";
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
