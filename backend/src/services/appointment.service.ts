import { IAppointmentService } from "./interfaces/IAppointmentService";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { AppError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { APPOINTMENT_STATUS, MESSAGES, HttpStatus, PAYMENT_STATUS, PAYMENT_COMMISSION, CANCELLATION_RULES, ROLES } from "../constants/constants";
import { AppointmentMapper } from "../mappers/appointment.mapper";
import { IWalletService } from "./interfaces/IWalletService";
import { IChatService } from "./interfaces/IChatService";
import { INotificationService } from "./notification.service";
import { socketService } from "./socket.service";

export class AppointmentService implements IAppointmentService {
    private readonly logger: LoggerService;

    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _userRepository: IUserRepository,
        private _doctorRepository: IDoctorRepository,
        private _scheduleRepository: IScheduleRepository,
        private _walletService: IWalletService,
        private _notificationService?: INotificationService,
        private _chatService?: IChatService
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



        const adminCommission = (consultationFees * PAYMENT_COMMISSION.ADMIN_PERCENT) / 100;
        const doctorEarnings = (consultationFees * PAYMENT_COMMISSION.DOCTOR_PERCENT) / 100;

        const appointment = await this._appointmentRepository.create({
            patientId,
            doctorId: appointmentData.doctorId,
            appointmentType: appointmentData.appointmentType,
            appointmentDate: new Date(appointmentData.appointmentDate),
            appointmentTime: appointmentData.appointmentTime,
            slotId: appointmentData.slotId || null,
            status: APPOINTMENT_STATUS.PENDING,
            consultationFees,
            adminCommission,
            doctorEarnings,
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

        if (this._notificationService) {
            await this._notificationService.notify(doctor.userId.toString(), {
                title: "New Appointment Request",
                message: `You have a new appointment request from ${patient.name}.`,
                type: "info",
                appointmentId: appointment._id.toString()
            });
        }

        const populatedAppointment = await this._appointmentRepository.findByIdPopulated(appointment._id.toString());
        return AppointmentMapper.toResponseDTO(populatedAppointment);
    }

    async listAppointments(
        userId: string,
        userRole: string,
        filters: import("../dtos/admin.dtos/admin.dto").AppointmentFilterDTO
    ): Promise<{
        appointments: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const repoFilters: any = {
            status: filters.status,
            search: filters.search,
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            doctorId: filters.doctorId,
            patientId: filters.patientId,
        };


        if (userRole === ROLES.PATIENT) {
            repoFilters.patientId = userId;
        } else if (userRole === ROLES.DOCTOR) {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) {
                throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            repoFilters.doctorId = doctor._id.toString();
        } else if (userRole !== ROLES.ADMIN) {
            throw new AppError(MESSAGES.INVALID_ROLE, HttpStatus.FORBIDDEN);
        }

        const result = await this._appointmentRepository.findAll(repoFilters, skip, limit);

        return {
            appointments: result.appointments.map(AppointmentMapper.toResponseDTO),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
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
        if (appointment.status === APPOINTMENT_STATUS.REJECTED) {
            throw new AppError("Cannot cancel an appointment that has already been rejected", HttpStatus.BAD_REQUEST);
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

        // refund
        if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
            const totalFee = appointment.consultationFees;
            const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
            const patient = await this._userRepository.findById(appointment.patientId.toString());

            let refundAmount = 0; // Declare refundAmount here

            if (userRole === 'patient') {
                //user Cancel
                refundAmount = (totalFee * CANCELLATION_RULES.USER_CANCEL_REFUND_PERCENT) / 100;
                const adminKeeps = (totalFee * CANCELLATION_RULES.USER_CANCEL_ADMIN_COMMISSION) / 100;
                const doctorKeeps = (totalFee * CANCELLATION_RULES.USER_CANCEL_DOCTOR_COMMISSION) / 100;


                const doctorDeduction = appointment.doctorEarnings - doctorKeeps;
                const adminDeduction = appointment.adminCommission - adminKeeps;

                if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), doctorDeduction, `Cancellation: patient cancelled #${appointment.customId || appointment.id}`, appointment._id.toString());


                const admins = await this._userRepository.findByRole(ROLES.ADMIN);
                const adminUser = admins[0];
                if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), adminDeduction, `Commission Reversal: patient cancelled #${appointment.customId || appointment.id}`, appointment._id.toString());


                if (patient) await this._walletService.addMoney(patient._id.toString(), refundAmount, `Refund: appointment #${appointment.customId || appointment.id} cancelled (30% fee applied)`, appointment._id.toString());

            } else {

                refundAmount = totalFee;

                if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), appointment.doctorEarnings, `Cancellation: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString());

                const admins = await this._userRepository.findByRole(ROLES.ADMIN);
                const adminUser = admins[0];
                if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), appointment.adminCommission, `Commission Reversal: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString());

                if (patient) await this._walletService.addMoney(patient._id.toString(), refundAmount, `Refund: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString());
            }

            await this._appointmentRepository.updateById(appointmentId, {
                paymentStatus: PAYMENT_STATUS.REFUNDED
            });

            if (this._notificationService) {
                const customId = appointment.customId || appointmentId;
                if (userRole === "patient") {
                    // Notify doctor about patient cancellation
                    if (doctor) await this._notificationService.notify(doctor.userId.toString(), {
                        title: "Appointment Cancelled",
                        message: `Patient has cancelled appointment #${customId}.`,
                        type: "warning",
                        appointmentId: appointment._id.toString()
                    });

                    // Notify patient about their cancellation (Refund already notified by WalletService)
                } else {
                    // Notify patient about cancellation by doctor/admin with full refund
                    if (patient) {
                        await this._notificationService.notify(patient._id.toString(), {
                            title: "Appointment Cancelled",
                            message: `Your appointment #${customId} has been cancelled by the ${userRole}.`,
                            type: "info",
                            appointmentId: appointment._id.toString()
                        });

                        // Refund already notified by WalletService
                    }
                }
            }


        }

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

    async rescheduleAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        rescheduleData: {
            appointmentDate: Date | string,
            appointmentTime: string,
            slotId?: string
        }
    ): Promise<any> {



        const appointment = await this._appointmentRepository.findById(appointmentId);




        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        if ((appointment.rescheduleCount ?? 0) >= 1) {
            throw new AppError(MESSAGES.APPOINTMENT_CANNOT_RESCHEDULE, HttpStatus.BAD_REQUEST);
        }


        const isPatient = appointment.patientId.toString() === userId;
        if (!isPatient && userRole !== "admin") {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }


        const allowedStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.UPCOMING];
        if (!allowedStatuses.includes(appointment.status as any)) {
            throw new AppError(MESSAGES.APPOINTMENT_CANNOT_MODIFY, HttpStatus.BAD_REQUEST);
        }


        if (appointment.slotId) {
            try {
                const [oldStartTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    oldStartTime
                );
            } catch (error) {
                this.logger.error("Failed to release old slot during reschedule", { error, appointmentId });
            }
        }


        if (rescheduleData.slotId) {
            try {
                const [newStartTime] = rescheduleData.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    rescheduleData.slotId,
                    true,
                    new Date(rescheduleData.appointmentDate),
                    newStartTime
                );
            } catch (error) {
                this.logger.error("Failed to book new slot during reschedule", { error, appointmentId });
                throw new AppError("Failed to book selected slot", HttpStatus.BAD_REQUEST);
            }
        }


        const updatedAppointment = await this._appointmentRepository.updateById(appointmentId, {
            appointmentDate: new Date(rescheduleData.appointmentDate),
            appointmentTime: rescheduleData.appointmentTime,
            slotId: rescheduleData.slotId || null,
            status: APPOINTMENT_STATUS.PENDING,
            rescheduleCount: (appointment.rescheduleCount || 0) + 1,
        });




        const populated = await this._appointmentRepository.findByIdPopulated(appointmentId);
        return AppointmentMapper.toResponseDTO(populated);
    }

    // ==================== DOCTOR SIDE ====================



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

        if (this._notificationService) {
            await this._notificationService.notify(appointment.patientId.toString(), {
                title: "Appointment Confirmed",
                message: `Your appointment #${appointment.customId || appointment.id} has been confirmed.`,
                type: "success",
                appointmentId: appointment._id.toString()
            });
        }


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



        // refund reject
        if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
            const patient = await this._userRepository.findById(appointment.patientId.toString());


            if (patient) await this._walletService.addMoney(patient._id.toString(), appointment.consultationFees, `Refund: appointment #${appointment.customId || appointment.id} rejected by doctor`, appointment._id.toString());


            const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
            if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), appointment.doctorEarnings, `Reversal: appointment #${appointment.customId || appointment.id} rejected`, appointment._id.toString());

            const admins = await this._userRepository.findByRole(ROLES.ADMIN);
            const adminUser = admins[0];
            if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), appointment.adminCommission, `Commission Reversal: appointment #${appointment.customId || appointment.id} rejected`, appointment._id.toString());

            await this._appointmentRepository.updateById(appointmentId, {
                paymentStatus: PAYMENT_STATUS.REFUNDED
            });

            if (this._notificationService) {
                // Rejection notification
                await this._notificationService.notify(appointment.patientId.toString(), {
                    title: "Appointment Rejected",
                    message: `Your appointment #${appointment.customId || appointment.id} has been rejected by the doctor.`,
                    type: "error",
                    appointmentId: appointment._id.toString()
                });

                // Refund already notified by WalletService
            }
        }

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

    async startConsultation(appointmentId: string, userId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // Verify it is the doctor starting the consultation
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        // We only send the message if the session hasn't started yet
        if (!appointment.sessionStartTime) {
            await this._appointmentRepository.updateById(appointmentId, {
                sessionStartTime: new Date()
            });

            if (appointment.appointmentType === 'chat' && this._chatService) {
                const patient = await this._userRepository.findById(appointment.patientId.toString());
                const patientName = patient?.name || 'Patient';

                const messageContent = `Hello ${patientName}, shall we start?`;

                const message = await this._chatService.saveMessage(
                    appointmentId,
                    doctor._id.toString(),
                    'Doctor',
                    messageContent,
                    'text'
                );

                // Emit to the specific appointment room
                socketService.emitMessage(appointment._id.toString(), message);
            }
        }
    }

}
