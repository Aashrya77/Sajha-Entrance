import dotenv from "dotenv";
import mongoose from "mongoose";
import { startAdminPanel } from "../admin/Admin.js";

dotenv.config();

const test = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected.");
        
        console.log("Initializing Admin Panel...");
        const Router = await startAdminPanel();
        console.log("Admin Panel Initialized successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Admin Panel Initialization Failed!");
        console.error(error);
        process.exit(1);
    }
};

test();
