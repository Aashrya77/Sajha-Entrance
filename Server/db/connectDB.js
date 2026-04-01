import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import { createLogger } from "../utils/logger.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const logger = createLogger("db");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
  } catch (error) {
    logger.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
