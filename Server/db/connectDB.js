import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // Uses Google DNS
dotenv.config();
dotenv.config();

const connectDB = async () => {
    try {
        // Tapaiko MONGO_URI use garne ra second parameter ma options halne
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds samma connection parkhinchha
        });
        
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1); 
    }
}

export default connectDB;