import { IAppointmentService } from "./interfaces/IAppointmentService";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { AppError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { APPOINTMENT_STATUS, MESSAGES, HttpStatus, PAYMENT_STATUS } from "../constants/constants";
import { Types } from "mongoose";
import { AppointmentMapper } from "../mappers/appointment.mapper";

export class AppointmentService implements IAppointmentService {
    private readonly logger: LoggerService;

    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _userRepository: IUserRepository,
        private _doctorRepository: IDoctorRepository,
        private _scheduleRepository: IScheduleRepository
    ) {
        this.logger = new LoggerService("AppointmentService");
    }

    private async requireDoctorIdByUserId(doctorUserId: string): Promise<string> {
        const doctor = await this._doctorRepository.findByUserId(doctorUserId);
        if (!doctor) {
            throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return doctor._id.toString();
    }

    // ----------------------- PATIENT --------------------------

    async createAppointment(
        patientId: string,
        appointmentData: {
            doctorId: string;
            appointmentDate: Date | string;
            appointmentTime: string;
            slotId?: string;
            appointmentType: "video" | "chat";
            reason?: string;
        }
    ): Promise<any> {
        const patient = await this._userRepository.findById(patientId);
        if (!patient) {
            throw new AppError(MESSAGES.PATIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctor = await this._doctorRepository.findById(appointmentData.doctorId);
        if (!doctor) {
            throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if (!doctor.isActive) {
            throw new AppError(MESSAGES.DOCTOR_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
        }

        const consultationFees = appointmentData.appointmentType === "video"
            ? doctor.VideoFees || 0
            : doctor.ChatFees || 0;

        if (consultationFees === 0) {
            throw new AppError(
                MESSAGES.DOCTOR_FEES_NOT_SET.replace("{type}", appointmentData.appointmentType),
                HttpStatus.BAD_REQUEST
            );
        }

        const appointment = await this._appointmentRepository.create({
            patientId: new Types.ObjectId(patientId),
            doctorId: new Types.ObjectId(appointmentData.doctorId),
            appointmentType: appointmentData.appointmentType,
            appointmentDate: new Date(appointmentData.appointmentDate),
            appointmentTime: appointmentData.appointmentTime,
            slotId: appointmentData.slotId || null,
            status: APPOINTMENT_STATUS.PENDING,
            consultationFees,
            reason: appointmentData.reason || null,
            paymentStatus: PAYMENT_STATUS.PENDING,
            paymentId: null,
            paymentMethod: null,
        });

        if (appointmentData.slotId) {
            try {
                const [startTime] = appointmentData.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointmentData.doctorId,
                    appointmentData.slotId,
                    true,
                    new Date(appointmentData.appointmentDate),
                    startTime
                );
            } catch (error) {
                this.logger.error("Failed to mark slot as booked", { error, doctorId: appointmentData.doctorId });
            }
        }

        const populatedAppointment = await this._appointmentRepository.findByIdPopulated(appointment._id.toString());
        return AppointmentMapper.toResponseDTO(populatedAppointment);
    }

    async getMyAppointments(
        userId: string,
        userRole: string,
        status?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;
        let appointments: any[] = [];
        let total = 0;

        if (userRole === "patient") {
            const result = await this._appointmentRepository.findByPatientId(userId, status, skip, limit);
            appointments = result.appointments;
            total = result.total;
        } else if (userRole === "doctor") {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) {
                throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            const result = await this._appointmentRepository.findByDoctorId(doctor._id.toString(), status, skip, limit);
            appointments = result.appointments;
            total = result.total;
        } else {
            throw new AppError(MESSAGES.INVALID_ROLE, HttpStatus.FORBIDDEN);
        }

        return {
            appointments: appointments.map(AppointmentMapper.toResponseDTO),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getAppointmentById(
        appointmentId: string,
        userId: string,
        userRole: string
    ): Promise<any> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const getIdString = (value: any): string | null => {
            if (!value) return null;
            if (typeof value === "string") return value;
            if (typeof value === "object") {
                if (value._id) return value._id.toString();
                if (value.id) return value.id.toString();
            }
            return null;
        };

        const appointmentPatientId = getIdString(appointment.patientId);
        const appointmentDoctorId = getIdString(appointment.doctorId);

        const isPatient = appointmentPatientId === userId;
        let isDoctor = false;

        if (userRole === "doctor") {
            const doctor = await this._doctorRepository.findByUserId(userId);
            isDoctor = doctor?._id.toString() === appointmentDoctorId;
        }

        if (!isPatient && !isDoctor && userRole !== "admin") {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        return AppointmentMapper.toResponseDTO(appointment);
    }

    async cancelAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        cancellationReason: string
    ): Promise<any> {
        const appointment = await this._appointmentRepository.findById(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
            throw new AppError(MESSAGES.APPOINTMENT_ALREADY_CANCELLED, HttpStatus.BAD_REQUEST);
        }
        if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
            throw new AppError(MESSAGES.APPOINTMENT_ALREADY_COMPLETED, HttpStatus.BAD_REQUEST);
        }

        const getIdString = (value: any): string | null => {
            if (!value) return null;
            if (typeof value === "string") return value;
            if (typeof value === "object") {
                if (value._id) return value._id.toString();
                if (value.id) return value.id.toString();
            }
            return null;
        };

        const appointmentPatientId = getIdString(appointment.patientId);
        const appointmentDoctorId = getIdString(appointment.doctorId);

        const isPatient = appointmentPatientId === userId;
        let isDoctor = false;

        if (userRole === "doctor") {
            const doctor = await this._doctorRepository.findByUserId(userId);
            isDoctor = doctor?._id.toString() === appointmentDoctorId;
        }

        if (!isPatient && !isDoctor && userRole !== "admin") {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        const updatedAppointment = await this._appointmentRepository.updateById(appointmentId, {
            status: APPOINTMENT_STATUS.CANCELLED,
            cancelledBy: userRole === "patient" ? "patient" : userRole === "admin" ? "admin" : "doctor",
            cancellationReason,
            cancelledAt: new Date(),
        });

        if (appointment.slotId) {
            try {
                const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    startTime
                );
            } catch (error) {
                this.logger.error("Failed to mark slot as available", { error, doctorId: appointment.doctorId.toString() });
            }
        }

        return updatedAppointment;
    }

    // ==================== DOCTOR SIDE ====================

    async getDoctorAppointmentRequests(
        doctorUserId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const doctorId = await this.requireDoctorIdByUserId(doctorUserId);
        const skip = (page - 1) * limit;

        const result = await this._appointmentRepository.findByDoctorId(
            doctorId,
            APPOINTMENT_STATUS.PENDING,
            skip,
            limit
        );

        return {
            appointments: result.appointments.map(AppointmentMapper.toResponseDTO),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
        };
    }

    async getDoctorAppointments(
        doctorUserId: string,
        status?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const doctorId = await this.requireDoctorIdByUserId(doctorUserId);
        const skip = (page - 1) * limit;
        const result = await this._appointmentRepository.findByDoctorId(doctorId, status, skip, limit);

        return {
            appointments: result.appointments.map(AppointmentMapper.toResponseDTO),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
        };
    }

    async approveAppointmentRequest(appointmentId: string, doctorUserId: string): Promise<void> {
        const doctorId = await this.requireDoctorIdByUserId(doctorUserId);
        const appointment = await this._appointmentRepository.findById(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (appointment.doctorId.toString() !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }
        if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_PENDING, HttpStatus.BAD_REQUEST);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            status: APPOINTMENT_STATUS.CONFIRMED,
        });
    }

    async rejectAppointmentRequest(
        appointmentId: string,
        doctorUserId: string,
        rejectionReason: string
    ): Promise<void> {
        const doctorId = await this.requireDoctorIdByUserId(doctorUserId);
        const appointment = await this._appointmentRepository.findById(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (appointment.doctorId.toString() !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }
        if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_PENDING, HttpStatus.BAD_REQUEST);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            status: APPOINTMENT_STATUS.REJECTED,
            rejectionReason,
        });

        if (appointment.slotId) {
            try {
                const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    startTime
                );
            } catch (error) {
                this.logger.error("Failed to mark slot as available (rejected)", { error, doctorId: appointment.doctorId.toString() });
            }
        }
    }

    async completeAppointment(
        appointmentId: string,
        doctorUserId: string,
        doctorNotes?: string,
        prescriptionUrl?: string
    ): Promise<void> {
        const doctorId = await this.requireDoctorIdByUserId(doctorUserId);
        const appointment = await this._appointmentRepository.findById(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        if (appointment.doctorId.toString() !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }
        if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_CONFIRMED, HttpStatus.BAD_REQUEST);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            status: APPOINTMENT_STATUS.COMPLETED,
            doctorNotes: doctorNotes || null,
            prescriptionUrl: prescriptionUrl || null,
            sessionEndTime: new Date(),
        });
    }

    // ==================== ADMIN SIDE ====================

    async getAllAppointments(
        status?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;
        const result = await this._appointmentRepository.findAll(status, skip, limit);

        return {
            appointments: result.appointments.map(AppointmentMapper.toResponseDTO),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
        };
    }
}
