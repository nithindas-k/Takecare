import mongoose, { Schema, Document, Model } from "mongoose";

import { IDoctor, IDoctorDocument } from "types/doctor.type";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

const DoctorSchema = new Schema<IDoctorDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      default: null,
      trim: true,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    specialty: {
      type: String,
      default: null,
    },
    experienceYears: {
      type: Number,
      default: null,
      min: 0,
    },
    VideoFees: {
      type: Number,
      default: null,
      min: 0,
    },
    ChatFees: {
      type: Number,
      default: null,
      min: 0,
    },
    about: {
      type: String,
      default: null
    },
    languages: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.Pending,
    },
    verificationDocuments: {
      type: [String],
      default: [],
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DoctorSchema.index({ userId: 1 }, { unique: true });
DoctorSchema.index({ specialty: 1 });
DoctorSchema.index({ verificationStatus: 1 });
DoctorSchema.index({ isActive: 1 });

DoctorSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

const DoctorModel: Model<IDoctorDocument> =
  mongoose.models.Doctor || mongoose.model<IDoctorDocument>("Doctor", DoctorSchema);

export default DoctorModel;
