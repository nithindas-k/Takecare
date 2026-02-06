import { SessionStatus } from "../../utils/sessionStatus.util";
import { AppointmentFilterDTO } from "../../dtos/admin.dtos/admin.dto";

export interface IAppointmentService {
    createAppointment(patientId: string, appointmentData: any): Promise<any>;
    listAppointments(userId: string, userRole: string, filters: AppointmentFilterDTO): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        counts?: { upcoming: number; completed: number; cancelled: number };
    }>;
    getPatientHistory(patientId: string, ...args: any[]): Promise<any[]>;
    getAppointmentById(appointmentId: string, userId: string, userRole: string): Promise<any>;
    cancelAppointment(appointmentId: string, userId: string, userRole: string, cancellationReason: string): Promise<any>;
    rescheduleAppointment(appointmentId: string, userId: string, userRole: string, rescheduleData: {
        appointmentDate: Date | string,
        appointmentTime: string,
        slotId?: string
    }): Promise<any>;
    acceptReschedule(appointmentId: string, userId: string): Promise<void>;
    rejectReschedule(appointmentId: string, userId: string, reason: string): Promise<void>;
    approveAppointmentRequest(appointmentId: string, doctorUserId: string): Promise<void>;
    rejectAppointmentRequest(appointmentId: string, doctorUserId: string, rejectionReason: string): Promise<void>;
    completeAppointment(appointmentId: string, doctorUserId: string, doctorNotes?: string, prescriptionUrl?: string): Promise<void>;
    startConsultation(appointmentId: string, userId: string): Promise<void>;
    updateSessionStatus(appointmentId: string, userId: string, status: SessionStatus): Promise<void>;
    enablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    disablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    updateDoctorNotes(appointmentId: string, doctorUserId: string, note: any): Promise<void>;
}
