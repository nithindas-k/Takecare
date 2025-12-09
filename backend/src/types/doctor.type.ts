
import { Types, Document } from "mongoose";
import { VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";

export interface IDoctor {
  userId: Types.ObjectId;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  verificationStatus: VerificationStatus;
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

export interface DoctorRegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  licenseNumber?: string;
  dob?: string | Date;
}

export interface DoctorProfileResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  verificationStatus: VerificationStatus;
  verificationDocuments: string[];
  rejectionReason?: string | null;
  ratingAvg: number;
  ratingCount: number;
  isActive: boolean;
  profileImage?: string | null;
  gender?: string | null;
  dob?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Doctor request list item
 */
export interface DoctorRequestItem {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  specialty?: string | null;
  experienceYears?: number | null;
  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  createdAt: Date;
  profileImage?: string | null;
}

/**
 * Doctor request detail (extends list item with additional fields)
 */
export interface DoctorRequestDetail extends DoctorRequestItem {
  qualifications: string[];
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages: string[];
  verificationDocuments: string[];
  isActive: boolean;
  updatedAt: Date;
  gender?: "male" | "female" | "other" | null;
  dob?: Date | null;
}
