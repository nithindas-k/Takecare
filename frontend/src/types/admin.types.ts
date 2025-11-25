import type { Gender } from "./common.types";

export interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin";
  gender?: Gender | null;
  profileImage?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorRequestListItem {
  id: string;
  name: string;
  email: string;
  department: string;
  profileImage?: string | null;
  createdAt: string;
  experienceYears?: number;
  status: "pending" | "approved" | "rejected";
}

export interface DoctorRequestDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: [];
  profileImage?: string | null;
  gender?: Gender | null;
  dob?: string | null;
  qualifications?: string[];
  experienceYears?: number;
  specialties?: string[];
  biography?: string;
  address?: string;
  fees?: number;
  documents?: string[]; // URLs or doc names
  status: "pending" | "approved" | "rejected";
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}
