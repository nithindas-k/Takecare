import mongoose from "mongoose";
import { env } from "./env";
import { LoggerService } from "../services/logger.service";
import { MESSAGES, HttpStatus } from "../constants/constants";
import { AppError } from "../errors/AppError";

const MONGODB_URI = env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new AppError(MESSAGES.MONGODB_URI_MISSING, HttpStatus.INTERNAL_ERROR);
}

const logger = new LoggerService("Database");

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      logger.info("Already connected to MongoDB");
      return;
    }

    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database connection error";
    logger.error("MongoDB connection error", { error: errorMessage });
    throw new AppError(
      MESSAGES.SERVER_ERROR,
      HttpStatus.INTERNAL_ERROR
    );
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  }
};
