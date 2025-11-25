import mongoose from "mongoose";
import { env } from "./env";

const MONGODB_URI = env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing in .env");
}

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("🔄 Already connected to MongoDB");
      return;
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};
