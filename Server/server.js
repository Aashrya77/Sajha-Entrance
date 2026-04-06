import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
import { backfillLegacyResultExams } from "./services/resultService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const logger = createLogger("server");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDirectory = path.join(__dirname, "public");


// ================= IMAGE MAPPINGS =================
const imageDirectoryMappings = [
  {
    routes: ["/blog", "/blogs"],
    current: path.join(publicDirectory, "uploads", "blog"),
    legacy: [
      path.join(publicDirectory, "uploads", "blogs"),
      path.join(publicDirectory, "blogs"),
    ],
  },
  {
    routes: ["/advertisement", "/advertisements"],
    current: path.join(publicDirectory, "uploads", "advertisement"),
    legacy: [path.join(publicDirectory, "advertisements")],
  },
  {
    routes: ["/popup", "/popups"],
    current: path.join(publicDirectory, "uploads", "popup"),
    legacy: [path.join(publicDirectory, "popups")],
  },
  {
    routes: ["/landing", "/landingads"],
    current: path.join(publicDirectory, "uploads", "landing"),
    legacy: [path.join(publicDirectory, "landingads")],
  },
  {
    routes: ["/popup-section", "/popup-sections"],
    current: path.join(publicDirectory, "uploads", "popup-section"),
    legacy: [],
  },
  {
    routes: ["/college", "/colleges"],
    current: path.join(publicDirectory, "uploads", "college"),
    legacy: [path.join(publicDirectory, "colleges")],
  },
];


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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ================= STATIC FILES (FIXED) =================

// 1. Serve entire public folder
app.use(express.static(publicDirectory));

// 2. Global uploads fallback (VERY IMPORTANT)
app.use(
  "/uploads",
  express.static(path.join(publicDirectory, "uploads"))
);

// 3. AdminJS assets
if (fs.existsSync(adminBrandAssets.appPublicDirectory)) {
  app.use(
    adminBrandAssets.publicMountPath,
    express.static(adminBrandAssets.appPublicDirectory)
  );

  app.use(
    "/brand-assets",
    express.static(adminBrandAssets.appPublicDirectory)
  );
}

// 4. Advanced image mappings (your system)
imageDirectoryMappings.forEach(({ routes, current, legacy }) => {
  routes.forEach((route) => {
    if (fs.existsSync(current)) {
      app.use(route, express.static(current));
    }

    legacy.forEach((directory) => {
      if (fs.existsSync(directory)) {
        app.use(route, express.static(directory));
      }
    });
  });
});


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

    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();