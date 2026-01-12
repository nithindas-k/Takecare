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

export interface IDoctorNote {
    id: string;
    title: string;
    description?: string;
    category?: 'observation' | 'diagnosis' | 'medicine' | 'lab_test';
    dosage?: string;
    frequency?: string;
    duration?: string;
    createdAt: Date;
}

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
    adminCommission: number;
    doctorEarnings: number;
    reason?: string | null;
    rescheduleCount?: number;

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

    doctorNotes?: IDoctorNote[] | null;
    prescriptionUrl?: string | null;

    sessionStatus?: "idle" | "ACTIVE" | "WAITING_FOR_DOCTOR" | "CONTINUED_BY_DOCTOR" | "ENDED" | "TEST_NEEDED";
    extensionCount?: number;

    reminderSent?: boolean;
    startNotificationSent?: boolean;

    TEST_NEEDED?: boolean;

    postConsultationChatWindow?: {
        isActive: boolean;
        expiresAt: Date | null;
    };

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

export interface DashboardStats {
    totalAppointments: number;
    totalRevenue: number;
    statusDistribution: {
        completed: number;
        cancelled: number;
        pending: number;
        confirmed: number;
    };
    revenueGraph: { date: string; amount: number }[];
    topDoctors?: { doctorId: string; name: string; revenue: number; appointments: number }[];
}

export interface DoctorDashboardStats {
    totalAppointments: number;
    totalPatients: number;
    totalEarnings: number;
    appointmentsToday: number;
    revenueGraph: { date: string; amount: number }[];
    nextAppointment: any; // Using any for simplicity as it involves populated fields
}
