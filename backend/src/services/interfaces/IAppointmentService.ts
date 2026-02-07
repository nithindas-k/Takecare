import { SessionStatus } from "../../utils/sessionStatus.util";
import { AppointmentFilterDTO } from "../../dtos/admin.dtos/admin.dto";
import { CreateAppointmentDTO, AppointmentResponseDTO, RescheduleAppointmentDTO } from "../../dtos/appointment.dtos/appointment.dto";

export interface IAppointmentService {
    createAppointment(patientId: string, appointmentData: CreateAppointmentDTO): Promise<AppointmentResponseDTO>;
    listAppointments(userId: string, userRole: string, filters: AppointmentFilterDTO): Promise<{
        appointments: AppointmentResponseDTO[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        counts?: { upcoming: number; completed: number; cancelled: number };
    }>;
    getPatientHistory(patientId: string): Promise<AppointmentResponseDTO[]>;
    getAppointmentById(appointmentId: string, userId: string, userRole: string): Promise<AppointmentResponseDTO>;
    cancelAppointment(appointmentId: string, userId: string, userRole: string, cancellationReason: string): Promise<AppointmentResponseDTO>;
    rescheduleAppointment(appointmentId: string, userId: string, userRole: string, rescheduleData: RescheduleAppointmentDTO): Promise<AppointmentResponseDTO>;
    acceptReschedule(appointmentId: string, userId: string): Promise<void>;
    rejectReschedule(appointmentId: string, userId: string, reason: string): Promise<void>;
    approveAppointmentRequest(appointmentId: string, doctorUserId: string): Promise<void>;
    rejectAppointmentRequest(appointmentId: string, doctorUserId: string, rejectionReason: string): Promise<void>;
    completeAppointment(appointmentId: string, doctorUserId: string, doctorNotes?: string, prescriptionUrl?: string): Promise<void>;
    startConsultation(appointmentId: string, userId: string): Promise<void>;
    updateSessionStatus(appointmentId: string, userId: string, status: SessionStatus): Promise<void>;
    enablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    disablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void>;
    updateDoctorNotes(appointmentId: string, doctorUserId: string, note: string): Promise<void>;
}
