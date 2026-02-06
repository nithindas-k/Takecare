import type { AppointmentType, AppointmentStatus, PaymentStatus, CanceledBy } from "../utils/constants";

export interface AppointmentData {
    doctorId: string;
    patientId: string;
    appointmentDate: string | Date;
    appointmentTime: string;
    slotId?: string;
    appointmentType: AppointmentType;
    reason: string;
}

export interface AppointmentFilters {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    [key: string]: unknown;
}

export interface Slot {
    startTime: string;
    endTime: string;
    slotId: string;
    customId?: string;
    id?: string;
}

export interface PopulatedAppointment {
    _id: string;
    id?: string;
    customId?: string;
    doctorId: string | {
        _id: string;
        name: string;
        profileImage?: string;
        specialty?: string;
        department?: string;
        userId?: {
            name: string;
            email: string;
            phone: string;
            profileImage?: string;
        };
        user?: {
            name: string;
            email: string;
            phone: string;
            profileImage?: string;
        };
    };
    doctor?: any; // To support legacy/alternative structures
    patientId: {
        _id: string;
        id?: string;
        name: string;
        profileImage?: string;
        email?: string;
        phone?: string;
    };
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: AppointmentType;
    status: AppointmentStatus;
    rescheduleRequest?: {
        appointmentDate: string;
        appointmentTime: string;
        slotId?: string;
    } | null;
    rescheduleRejectReason?: string | null;
    paymentStatus: PaymentStatus;
    consultationFees?: number;
    reason?: string;
    rejectionReason?: string;
    cancellationReason?: string;
    cancelledBy?: CanceledBy | string;
    cancelledAt?: string;
    createdAt?: string;
    updatedAt?: string;
    // Normalized aliases used in some components
    doctorName?: string;
    doctorEmail?: string;
    doctorPhone?: string;
    specialty?: string;
    doctorImage?: string;
    date?: string;
    time?: string;
    slotId?: string;
}
