export interface IAppointmentService {
    createAppointment(
        patientId: string,
        appointmentData: {
            doctorId: string,
            appointmentDate: Date | string,
            appointmentTime: string,
            slotId?: string,
            appointmentType: "video" | "chat",
            reason?: string
        }
    ): Promise<any>;

    listAppointments(
        userId: string,
        userRole: string,
        filters: import("../../dtos/admin.dtos/admin.dto").AppointmentFilterDTO
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;

    getAppointmentById(
        appointmentId: string,
        userId: string,
        userRole: string
    ): Promise<any>;

    cancelAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        cancellationReason: string
    ): Promise<void>;

    rescheduleAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        rescheduleData: {
            appointmentDate: Date | string,
            appointmentTime: string,
            slotId?: string
        }
    ): Promise<any>;

    approveAppointmentRequest(
        appointmentId: string,
        doctorUserId: string
    ): Promise<void>;

    rejectAppointmentRequest(
        appointmentId: string,
        doctorUserId: string,
        rejectionReason: string
    ): Promise<void>;

    completeAppointment(
        appointmentId: string,
        doctorUserId: string,
        doctorNotes?: string,
        prescriptionUrl?: string
    ): Promise<void>;

    startConsultation(
        appointmentId: string,
        userId: string
    ): Promise<void>;

    updateSessionStatus(
        appointmentId: string,
        userId: string,
        status: "ACTIVE" | "WAITING_FOR_DOCTOR" | "CONTINUED_BY_DOCTOR" | "ENDED"
    ): Promise<void>;

    enablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    disablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    updateDoctorNotes(appointmentId: string, doctorUserId: string, notes: any): Promise<void>;
}