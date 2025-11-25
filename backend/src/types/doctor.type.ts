
import { Types, Document } from "mongoose";

export interface IDoctor {
  userId: Types.ObjectId;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  verificationStatus: "pending" | "approved" | "rejected";
  verificationDocuments: string[];
  rejectionReason?: string | null;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
}

export type IDoctorDocument = IDoctor & Document & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


