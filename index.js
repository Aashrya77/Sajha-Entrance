
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";
import CourseRoutes from "./routes/Course.js";
import CollegeRoutes from "./routes/College.js";
import HomeRoutes from "./routes/Home.js";
import BlogRoutes from "./routes/Blog.js";
import AuthRoutes from "./routes/Auth.js";
import { adminRouter } from "./admin/Admin.js"; // Import matra garne
import { NotFoundHandler } from "./controllers/Home.js";
import { injectStudentData } from "./middleware/viewData.js";

dotenv.config();
// ... (aru imports sabai thik chha)

const app = express();
const PORT = 4000;

/* Basic Middleware */
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cookieParser());
app.use(injectStudentData);

// Yaha bata express.urlencoded HATAIDINUHOS (yo tala hunu parchha)

const startServer = async () => {
  try {
    // 1. Database connect
    await connectDB();
    console.log("✅ MongoDB Connected");

    // 2. SABAI BHANDA PAHILA ADMIN ROUTER (Body-parser vanda mathi)
    app.use(adminRouter);

    // 3. ABA BALLA BODY-PARSER RAKHNE (AdminJS setup bhanda muni)
    app.use(express.json()); // Yo pani thapnuhos, kaam lagcha
    app.use(express.urlencoded({ extended: true }));

    // 4. Aru Routes haru
    app.use(HomeRoutes);
    app.use(BlogRoutes);
    app.use(CourseRoutes);
    app.use(CollegeRoutes);
    app.use("/student", AuthRoutes);

    app.get("*", NotFoundHandler);

    app.listen(PORT, () => {
      console.log("🚀 Server is Running !!");
      console.log(`🔗 Link: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
