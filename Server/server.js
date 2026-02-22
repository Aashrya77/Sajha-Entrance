import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./db/connectDB.js";
import CourseRoutes from "./routes/Course.js";
import CollegeRoutes from "./routes/College.js";
import HomeRoutes from "./routes/Home.js";
import BlogRoutes from "./routes/Blog.js";
import AuthRoutes from "./routes/Auth.js";
import ResultRoutes from "./routes/Result.js";
import PaymentRoutes from "./routes/Payment.js";
import { startAdminPanel } from "./admin/Admin.js";
import { NotFoundHandler } from "./controllers/Home.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic Middleware
app.use(cookieParser());
app.use(express.static("public"));

const startServer = async () => {
  try {
    // 1. Database connect
    await connectDB();
    console.log("✅ MongoDB Connected");

    // 2. Bulk upload page (before admin router so it doesn't get intercepted)
    app.get('/admin/bulk-upload', (req, res) => {
      res.sendFile('bulk-upload.html', { root: 'public' });
    });

    // 3. Admin router (before body-parser)
    const adminRouter = await startAdminPanel();
    app.use(adminRouter);

    // 4. Body-parser middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 4. API Routes with /api prefix
    app.use('/api', HomeRoutes);
    app.use('/api', BlogRoutes);
    app.use('/api', CourseRoutes);
    app.use('/api', CollegeRoutes);
    app.use("/api/student", AuthRoutes);
    app.use('/api', ResultRoutes);
    app.use('/api', PaymentRoutes);

    // 404 handler for API routes
    app.use('/api/*', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });

    app.listen(PORT, () => {
      console.log("🚀 Server is Running !!");
      console.log(`🔗 Backend API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
