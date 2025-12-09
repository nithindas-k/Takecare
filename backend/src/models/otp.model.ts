
import { Schema, model, Document } from "mongoose";

export interface IOTPDocument extends Document {
  email: string;
  otp: string;
  userData: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: string;
    gender?: "male" | "female" | "other" | null;
    dob?: Date | null;
  };
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema = new Schema<IOTPDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true, 
    },
    otp: {
      type: String,
      required: true,
    },
    userData: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      passwordHash: { type: String, required: true },
      role: { type: String, required: true, default: "patient" },
      gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: null,
      },
      dob: { type: Date, default: null },
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

OTPSchema.index({ email: 1 });

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTPModel = model<IOTPDocument>("OTP", OTPSchema);

export default OTPModel;
