import { Types } from "mongoose";

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface PatientListItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    gender?: string;
    dob?: Date;
    profileImage?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DoctorListItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    specialty?: string | null;
    experienceYears?: number | null;
    VideoFees?: number | null;
    ChatFees?: number | null;
    profileImage?: string | null;
    verificationStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppointmentListItem {
    id: string;
    doctorId: Types.ObjectId;
    patientId: Types.ObjectId;
    appointmentDate: Date;
    status: string;
    type?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserListItem {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "patient" | "doctor" | "admin";
    profileImage?: string | null;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface JsonTransformReturnType {
    id: string;
    [key: string]: unknown;
}
