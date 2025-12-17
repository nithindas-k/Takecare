
import mongoose, { Schema, Model } from "mongoose";
import type { IUserDocument } from "../types/user.type";
import type { JsonTransformReturnType } from "../types/common";
import { IDGenerator, IDPrefix } from "../utils/idGenerator.util";

const UserSchema = new Schema<IUserDocument>(
  {
    customId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, 
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      sparse: true, 
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
      sparse: true, 
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
      transform: function (_doc, ret: Record<string, unknown>): JsonTransformReturnType {
        const { _id, __v, passwordHash, ...cleanedRet } = ret;
        return {
          ...cleanedRet,
          id: _id as string,
        };
      },
    },
    toObject: { virtuals: true },
  }
);


UserSchema.index({ role: 1, isActive: 1 });

UserSchema.pre('save', async function (next) {
  if (this.isNew && !this.customId) {
    if (this.role === 'patient') {
      this.customId = IDGenerator.generatePatientId();
    } else if (this.role === 'doctor') {
      this.customId = IDGenerator.generateDoctorId();
    } else if (this.role === 'admin') {

      this.customId = IDGenerator.generatePatientId();
    }
  }
  next();
});

const UserModel: Model<IUserDocument> =
  (mongoose.models && (mongoose.models.User as Model<IUserDocument>)) ||
  mongoose.model<IUserDocument>("User", UserSchema);

export default UserModel;
