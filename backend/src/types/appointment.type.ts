import { Document, Types } from "mongoose";

export type AppointmentType = "video" | "chat";

export type AppointmentStatus =
    | "pending" 
    | "confirmed" 
    | "completed" 
    | "rejected"
    | "cancelled";

export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";


export type PaymentMethod = "card" | "upi" | "wallet" | "netbanking" | null;

export type CancelledBy = "patient" | "doctor" | "admin" | null;

export interface IAppointment {
    customId?: string;
    
    patientId: Types.ObjectId;
    doctorId: Types.ObjectId;

    appointmentType: AppointmentType;
    appointmentDate: Date;
    appointmentTime: string; 
    slotId?: string; 
    status: AppointmentStatus;
    consultationFees: number;
    reason?: string | null;

    cancelledBy?: CancelledBy;
    cancellationReason?: string | null;
    cancelledAt?: Date | null;

    rejectionReason?: string | null;

    paymentStatus: PaymentStatus;
    paymentId?: string | null;
    paymentMethod?: PaymentMethod;

    sessionStartTime?: Date | null;
    sessionEndTime?: Date | null;
    sessionDuration?: number | null; 

    doctorNotes?: string | null;
    prescriptionUrl?: string | null;

    createdAt?: Date;
    updatedAt?: Date;
}

export interface IAppointmentDocument extends IAppointment, Document {
    _id: Types.ObjectId;
    id: string;
}

export interface IAppointmentPopulated extends Omit<IAppointment, "patientId" | "doctorId"> {
    patient: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        profileImage?: string;
    };
    doctor: {
        id: string;
        userId: Types.ObjectId;
        specialty?: string;
        experienceYears?: number;
        VideoFees?: number;
        ChatFees?: number;
        user: {
            name: string;
            email: string;
            phone?: string;
            profileImage?: string;
        };
    };
}
