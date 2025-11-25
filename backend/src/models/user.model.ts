// src/models/user.model.ts
import mongoose, { Schema, Model } from "mongoose";
import type { IUserDocument } from "../types/user.type";

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // keep unique here (creates a unique index once)
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      sparse: true, // use a sparse indexed field (declare index only here)
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    dob: {
      type: Date,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      index: true,
      sparse: true, // declare sparse index only once here
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const { _id, __v, passwordHash, ...cleanedRet } = ret;
        return {
          ...cleanedRet,
          id: _id,
        };
      },
    },
    toObject: { virtuals: true },
  }
);

// Keep compound / query indexes here (only those not declared via field options)
UserSchema.index({ role: 1, isActive: 1 });

// Model guard to avoid re-registration in hot-reload environments
const UserModel: Model<IUserDocument> =
  (mongoose.models && (mongoose.models as any).User) ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
