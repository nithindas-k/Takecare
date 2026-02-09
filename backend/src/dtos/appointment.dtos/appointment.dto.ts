import { AppointmentType, AppointmentStatus } from "../../types/appointment.type";

// ==================== REQUEST DTOs ====================

export interface CreateAppointmentDTO {
    doctorId: string;
    appointmentDate: Date | string;
    appointmentTime: string;
    slotId?: string;
    appointmentType: AppointmentType;
    reason?: string;
}

export interface CancelAppointmentDTO {
    cancellationReason: string;
}

export interface RejectAppointmentDTO {
    rejectionReason: string;
}

export interface CompleteAppointmentDTO {
    doctorNotes?: string;
    prescriptionUrl?: string;
}

export interface RescheduleAppointmentDTO {
    appointmentDate: Date | string;
    appointmentTime: string;
    slotId?: string;
}

// ==================== RESPONSE DTOs ====================

export interface AppointmentResponseDTO {
    id: string;
    patient: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        profileImage?: string;
        gender?: string;
        dob?: Date;
    };
    doctor: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        profileImage?: string;
        specialty?: string;
        experienceYears?: number;
    };
    appointmentType: AppointmentType;
    appointmentDate: Date;
    appointmentTime: string;
    status: AppointmentStatus;
    consultationFees: number;
    reason?: string;
    cancelledBy?: string;
    cancellationReason?: string;
    cancelledAt?: Date;
    rejectionReason?: string;
    paymentStatus: string;
    paymentId?: string;
    paymentMethod?: string;
    sessionStartTime?: Date;
    sessionEndTime?: Date;
    sessionDuration?: number;
    doctorNotes?: string;
    prescriptionUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppointmentListResponseDTO {
    appointments: AppointmentResponseDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==================== QUERY DTOs ====================

export interface AppointmentQueryDTO {
    status?: AppointmentStatus;
    page?: number;
    limit?: number;
}
