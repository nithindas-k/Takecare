import { Types } from "mongoose";
import { runInTransaction } from "../utils/transaction.util";
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
import { SESSION_STATUS, SessionStatus } from "../utils/sessionStatus.util";
import { ILoggerService } from "./interfaces/ILogger.service";

export class AppointmentService implements IAppointmentService {
    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _userRepository: IUserRepository,
        private _doctorRepository: IDoctorRepository,
        private _scheduleRepository: IScheduleRepository,
        private _walletService: IWalletService,
        private _logger: ILoggerService,
        private _notificationService?: INotificationService,
        private _chatService?: IChatService
    ) {
    }

    private async _requireDoctorIdByUserId(doctorUserId: string): Promise<string> {
        const doctor = await this._doctorRepository.findByUserId(doctorUserId);
        if (!doctor) {
            throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
        }
        return doctor._id.toString();
    }

    // ----------------------- PATIENT --------------------------

    async createAppointment(
        patientId: string,
        appointmentData: any
    ): Promise<any> {
        this._logger.info("Service: createAppointment attempt", {
            patientId,
            doctorId: appointmentData.doctorId,
            slotId: appointmentData.slotId,
            date: appointmentData.appointmentDate,
            time: appointmentData.appointmentTime
        });

        return await runInTransaction(async (session) => {
            const doctor = await this._doctorRepository.findById(appointmentData.doctorId);
            if (!doctor) {
                throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
            }

            const patient = await this._userRepository.findById(patientId);
            if (!patient) {
                throw new AppError(MESSAGES.PATIENT_NOT_FOUND, HttpStatus.NOT_FOUND);
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

            if (appointmentData.slotId) {
                const schedule = await this._scheduleRepository.findByDoctorId(appointmentData.doctorId, session);
                if (schedule) {
                    const slot = schedule.weeklySchedule
                        .flatMap(day => day.slots)
                        .find(s => s.customId === appointmentData.slotId);

                    if (slot && slot.booked) {
                        this._logger.info("Slot marked as booked. Searching for existing PENDING appointment to reuse.", {
                            patientId,
                            doctorId: appointmentData.doctorId,
                            slotId: appointmentData.slotId,
                            date: appointmentData.appointmentDate
                        });


                        let pId, dId;
                        try {
                            pId = typeof patientId === 'string' ? new Types.ObjectId(patientId) : patientId;
                            dId = typeof appointmentData.doctorId === 'string' ? new Types.ObjectId(appointmentData.doctorId) : appointmentData.doctorId;
                        } catch (err) {
                            this._logger.error("Error converting IDs for search", { patientId, doctorId: appointmentData.doctorId });
                            throw new AppError(MESSAGES.INVALID_ID_FORMAT, HttpStatus.BAD_REQUEST);
                        }


                        const searchDate = new Date(appointmentData.appointmentDate);
                        if (isNaN(searchDate.getTime())) {
                            this._logger.error("Invalid appointment date provided", { date: appointmentData.appointmentDate });
                            throw new AppError("Invalid appointment date", HttpStatus.BAD_REQUEST);
                        }


                        const startDate = new Date(searchDate);
                        startDate.setHours(startDate.getHours() - 12);
                        const endDate = new Date(searchDate);
                        endDate.setHours(endDate.getHours() + 12);

                        const existingAppointment = await this._appointmentRepository.findOne({
                            patientId: pId,
                            doctorId: dId,
                            appointmentDate: {
                                $gte: startDate,
                                $lte: endDate
                            },
                            slotId: appointmentData.slotId,
                            status: APPOINTMENT_STATUS.PENDING
                        }, session);

                        if (existingAppointment) {
                            this._logger.info("Found existing PENDING appointment. Updating and reusing.", {
                                appointmentId: existingAppointment._id.toString(),
                                previousStatus: existingAppointment.status
                            });


                            const adminCommission = (consultationFees * PAYMENT_COMMISSION.ADMIN_PERCENT) / 100;
                            const doctorEarnings = (consultationFees * PAYMENT_COMMISSION.DOCTOR_PERCENT) / 100;

                            const updated = await this._appointmentRepository.updateById(existingAppointment._id.toString(), {
                                appointmentType: appointmentData.appointmentType,
                                consultationFees,
                                adminCommission,
                                doctorEarnings,
                                reason: appointmentData.reason || existingAppointment.reason,
                                appointmentTime: appointmentData.appointmentTime,
                                appointmentDate: new Date(appointmentData.appointmentDate)
                            }, session);

                            const populatedAppointment = await this._appointmentRepository.findByIdPopulated(updated!._id.toString());
                            return AppointmentMapper.toResponseDTO(populatedAppointment);
                        }

                        this._logger.warn("Slot is booked but no matching PENDING appointment found for this user.", {
                            patientId,
                            slotId: appointmentData.slotId,
                            doctorId: appointmentData.doctorId
                        });

                        throw new AppError(MESSAGES.APPOINTMENT_SLOT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
                    }
                }
            }

            const adminCommission = (consultationFees * PAYMENT_COMMISSION.ADMIN_PERCENT) / 100;
            const doctorEarnings = (consultationFees * PAYMENT_COMMISSION.DOCTOR_PERCENT) / 100;

            const appointmentToCreate = {
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
            };


            if (appointmentData.slotId) {
                const [startTime] = appointmentData.appointmentTime.split("-").map((t: string) => t.trim());
                const slotUpdated = await this._scheduleRepository.updateSlotBookedStatus(
                    appointmentData.doctorId,
                    appointmentData.slotId,
                    true,
                    new Date(appointmentData.appointmentDate),
                    startTime,
                    session
                );

                if (!slotUpdated) {
                    this._logger.warn("Failed to mark slot as booked - possibly already taken", {
                        slotId: appointmentData.slotId,
                        doctorId: appointmentData.doctorId
                    });
                    throw new AppError(MESSAGES.APPOINTMENT_SLOT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
                }
            }

            const appointment = await this._appointmentRepository.create(appointmentToCreate, session);

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
        });
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
        this._logger.info("cancelAppointment started", { appointmentId, userId, userRole });

        return runInTransaction(async (session) => {
            const appointment = await this._appointmentRepository.findById(appointmentId, session);

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

            if (userRole === ROLES.DOCTOR) {
                const doctor = await this._doctorRepository.findByUserId(userId);
                isDoctor = doctor?._id.toString() === appointmentDoctorId;
            }

            if (!isPatient && !isDoctor && userRole !== ROLES.ADMIN) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }


            const updatedAppointment = await this._appointmentRepository.updateById(appointmentId, {
                status: APPOINTMENT_STATUS.CANCELLED,
                cancelledBy: userRole === ROLES.PATIENT ? "patient" : userRole === ROLES.ADMIN ? "admin" : "doctor",
                cancellationReason,
                cancelledAt: new Date(),
            }, session);


            if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
                const totalFee = appointment.consultationFees;
                const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
                const patient = await this._userRepository.findById(appointment.patientId.toString());

                let refundAmount = 0;

                if (userRole === ROLES.PATIENT) {
                    refundAmount = (totalFee * CANCELLATION_RULES.USER_CANCEL_REFUND_PERCENT) / 100;
                    const adminKeeps = (totalFee * CANCELLATION_RULES.USER_CANCEL_ADMIN_COMMISSION) / 100;
                    const doctorKeeps = (totalFee * CANCELLATION_RULES.USER_CANCEL_DOCTOR_COMMISSION) / 100;

                    const doctorDeduction = appointment.doctorEarnings - doctorKeeps;
                    const adminDeduction = appointment.adminCommission - adminKeeps;

                    if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), doctorDeduction, `Cancellation: patient cancelled #${appointment.customId || appointment.id}`, appointment._id.toString(), "Consultation Reversal", session);

                    const admins = await this._userRepository.findByRole(ROLES.ADMIN);
                    const adminUser = admins[0];
                    if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), adminDeduction, `Commission Reversal: patient cancelled #${appointment.customId || appointment.id}`, appointment._id.toString(), "Commission Reversal", session);

                    if (patient) await this._walletService.addMoney(patient._id.toString(), refundAmount, `Refund: appointment #${appointment.customId || appointment.id} cancelled (30% fee applied)`, appointment._id.toString(), "Refund", session);

                } else {
                    refundAmount = totalFee;

                    if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), appointment.doctorEarnings, `Cancellation: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString(), "Consultation Reversal", session);

                    const admins = await this._userRepository.findByRole(ROLES.ADMIN);
                    const adminUser = admins[0];
                    if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), appointment.adminCommission, `Commission Reversal: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString(), "Commission Reversal", session);

                    if (patient) await this._walletService.addMoney(patient._id.toString(), refundAmount, `Refund: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString(), "Refund", session);
                }

                await this._appointmentRepository.updateById(appointmentId, {
                    paymentStatus: PAYMENT_STATUS.REFUNDED
                }, session);
            }

            if (appointment.slotId) {
                const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                const docId = getIdString(appointment.doctorId);
                if (docId) {
                    await this._scheduleRepository.updateSlotBookedStatus(
                        docId,
                        appointment.slotId,
                        false,
                        new Date(appointment.appointmentDate),
                        startTime,
                        session
                    );
                }
            }

            if (this._notificationService) {
                const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
                const patient = await this._userRepository.findById(appointment.patientId.toString());
                const customId = appointment.customId || appointmentId;

                if (userRole === ROLES.PATIENT) {
                    if (doctor) await this._notificationService.notify(doctor.userId.toString(), {
                        title: "Appointment Cancelled",
                        message: `Patient has cancelled appointment #${customId}.`,
                        type: "warning",
                        appointmentId: appointment._id.toString()
                    });
                } else {
                    if (patient) await this._notificationService.notify(patient._id.toString(), {
                        title: "Appointment Cancelled",
                        message: `Your appointment #${customId} has been cancelled by the ${userRole}.`,
                        type: "info",
                        appointmentId: appointment._id.toString()
                    });
                }
            }

            return updatedAppointment;
        });
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
        this._logger.info("rescheduleAppointment started", { appointmentId, userId });

        return runInTransaction(async (session) => {
            const appointment = await this._appointmentRepository.findById(appointmentId, session);

            if (!appointment) {
                throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
            }

            if ((appointment.rescheduleCount ?? 0) >= 1) {
                throw new AppError(MESSAGES.APPOINTMENT_CANNOT_RESCHEDULE, HttpStatus.BAD_REQUEST);
            }

            const isPatient = appointment.patientId.toString() === userId;
            if (!isPatient && userRole !== ROLES.ADMIN) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }

            const allowedStatuses = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.UPCOMING];
            if (!allowedStatuses.includes(appointment.status as any)) {
                throw new AppError(MESSAGES.APPOINTMENT_CANNOT_MODIFY, HttpStatus.BAD_REQUEST);
            }


            if (appointment.slotId) {
                const [oldStartTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    oldStartTime,
                    session
                );
            }

            if (rescheduleData.slotId) {
                const schedule = await this._scheduleRepository.findByDoctorId(appointment.doctorId.toString(), session);
                if (schedule) {
                    const slot = schedule.weeklySchedule
                        .flatMap(day => day.slots)
                        .find(s => s.customId === rescheduleData.slotId);

                    if (slot && slot.booked) {
                        throw new AppError(MESSAGES.APPOINTMENT_SLOT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
                    }
                }
            }


            if (rescheduleData.slotId) {
                const [newStartTime] = rescheduleData.appointmentTime.split("-").map((t: string) => t.trim());
                const slotUpdated = await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    rescheduleData.slotId,
                    true,
                    new Date(rescheduleData.appointmentDate),
                    newStartTime,
                    session
                );

                if (!slotUpdated) {
                    throw new AppError(MESSAGES.APPOINTMENT_SLOT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
                }
            }


            const updatedAppointment = await this._appointmentRepository.updateById(appointmentId, {
                appointmentDate: new Date(rescheduleData.appointmentDate),
                appointmentTime: rescheduleData.appointmentTime,
                slotId: rescheduleData.slotId || null,
                status: APPOINTMENT_STATUS.PENDING,
                rescheduleCount: (appointment.rescheduleCount || 0) + 1,
            }, session);

            const populated = await this._appointmentRepository.findByIdPopulated(appointmentId);
            return AppointmentMapper.toResponseDTO(populated);
        });
    }

    // ==================== DOCTOR SIDE ====================



    async approveAppointmentRequest(appointmentId: string, doctorUserId: string): Promise<void> {
        this._logger.info("approveAppointmentRequest started", { appointmentId, doctorUserId });

        return runInTransaction(async (session) => {
            const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
            const appointment = await this._appointmentRepository.findById(appointmentId, session);

            if (!appointment) {
                throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
            }
            if (appointment.doctorId.toString() !== doctorId) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }
            if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
                throw new AppError(MESSAGES.APPOINTMENT_NOT_PENDING, HttpStatus.BAD_REQUEST);
            }

            if (appointment.paymentStatus !== PAYMENT_STATUS.PAID) {
                throw new AppError("Only paid appointments can be approved.", HttpStatus.BAD_REQUEST);
            }

            await this._appointmentRepository.updateById(appointmentId, {
                status: APPOINTMENT_STATUS.CONFIRMED,
            }, session);


            if (appointment.slotId) {
                const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    startTime,
                    session
                );
                this._logger.info(`Released slot lock for ${appointment.slotId} after confirmation of appointment ${appointmentId}`);
            }

            if (this._notificationService) {
                await this._notificationService.notify(appointment.patientId.toString(), {
                    title: "Appointment Confirmed",
                    message: `Your appointment #${appointment.customId || appointment.id} has been confirmed.`,
                    type: "success",
                    appointmentId: appointment._id.toString()
                });
            }
        });
    }

    async rejectAppointmentRequest(
        appointmentId: string,
        doctorUserId: string,
        rejectionReason: string
    ): Promise<void> {
        this._logger.info("rejectAppointmentRequest started", { appointmentId, doctorUserId });

        return runInTransaction(async (session) => {
            const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
            const appointment = await this._appointmentRepository.findById(appointmentId, session);

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
            }, session);


            if (appointment.paymentStatus === PAYMENT_STATUS.PAID) {
                const patient = await this._userRepository.findById(appointment.patientId.toString());
                const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());

                if (patient) await this._walletService.addMoney(patient._id.toString(), appointment.consultationFees, `Refund: appointment #${appointment.customId || appointment.id} rejected by doctor`, appointment._id.toString(), "Refund", session);

                if (doctor) await this._walletService.deductMoney(doctor.userId.toString(), appointment.doctorEarnings, `Reversal: appointment #${appointment.customId || appointment.id} rejected`, appointment._id.toString(), "Consultation Reversal", session);

                const admins = await this._userRepository.findByRole(ROLES.ADMIN);
                const adminUser = admins[0];
                if (adminUser) await this._walletService.deductMoney(adminUser._id.toString(), appointment.adminCommission, `Commission Reversal: appointment #${appointment.customId || appointment.id} rejected`, appointment._id.toString(), "Commission Reversal", session);

                await this._appointmentRepository.updateById(appointmentId, {
                    paymentStatus: PAYMENT_STATUS.REFUNDED
                }, session);
            }


            if (appointment.slotId) {
                const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
                const getIdString = (value: any): string | null => {
                    if (!value) return null;
                    if (typeof value === "string") return value;
                    if (typeof value === "object") {
                        if (value._id) return value._id.toString();
                        if (value.id) return value.id.toString();
                    }
                    return null;
                };
                const docId = getIdString(appointment.doctorId);
                if (docId) {
                    await this._scheduleRepository.updateSlotBookedStatus(
                        docId,
                        appointment.slotId,
                        false,
                        new Date(appointment.appointmentDate),
                        startTime,
                        session
                    );
                }
            }


            if (this._notificationService) {
                await this._notificationService.notify(appointment.patientId.toString(), {
                    title: "Appointment Rejected",
                    message: `Your appointment #${appointment.customId || appointment.id} has been rejected by the doctor.`,
                    type: "error",
                    appointmentId: appointment._id.toString()
                });
            }
        });
    }

    async completeAppointment(
        appointmentId: string,
        doctorUserId: string,
        doctorNotes?: string,
        prescriptionUrl?: string
    ): Promise<void> {
        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
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

        const updateData: any = {
            status: APPOINTMENT_STATUS.COMPLETED,
            prescriptionUrl: prescriptionUrl || null,
            sessionEndTime: new Date(),
        };

        await this._appointmentRepository.updateById(appointmentId, updateData);


        if (appointment.slotId) {
            const [startTime] = appointment.appointmentTime.split("-").map((t: string) => t.trim());
            await this._scheduleRepository.updateSlotBookedStatus(
                appointment.doctorId.toString(),
                appointment.slotId,
                false,
                new Date(appointment.appointmentDate),
                startTime
            );
            this._logger.info(`Released slot ${appointment.slotId} after completion of appointment ${appointmentId}`);
        }
    }

    async startConsultation(appointmentId: string, userId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }


        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }


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

                socketService.emitMessage(appointment._id.toString(), message);
            }
        }
    }

    async updateSessionStatus(
        appointmentId: string,
        userId: string,
        status: SessionStatus
    ): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }


        if (appointment.sessionStatus === SESSION_STATUS.ENDED) {
            this._logger.warn("UpdateSessionStatus rejected: Session already ended", {
                appointmentId,
                currentStatus: appointment.sessionStatus,
                requestedStatus: status
            });
            throw new AppError("Session has already ended and cannot be modified.", HttpStatus.BAD_REQUEST);
        }

        const doctor = await this._doctorRepository.findByUserId(userId);
        const isDoctor = doctor && doctor._id.toString() === appointment.doctorId.toString();


        const canTriggerStatus = (s: string) => s === "time_over" || s === SESSION_STATUS.WAITING_FOR_DOCTOR;

        if (!isDoctor && !canTriggerStatus(status)) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        const updateData: any = {
            sessionStatus: status
        };

        if (status === SESSION_STATUS.ACTIVE) {
            if (!appointment.sessionStartTime) {
                updateData.sessionStartTime = new Date();
            }
        } else if (status === SESSION_STATUS.CONTINUED_BY_DOCTOR) {
            updateData.extensionCount = (appointment.extensionCount || 0) + 1;
        } else if (status === SESSION_STATUS.ENDED) {
            updateData.sessionEndTime = new Date();
            updateData.status = APPOINTMENT_STATUS.COMPLETED;
        }

        await this._appointmentRepository.updateById(appointmentId, updateData);

        const populatedApt = await this._appointmentRepository.findByIdPopulated(appointmentId);
        const pUserId = populatedApt?.patientId?._id?.toString() || populatedApt?.patientId?.toString();
        const dUserId = populatedApt?.doctorId?.userId?._id?.toString() || populatedApt?.doctorId?.userId?.toString();

        const statusData = {
            appointmentId,
            status: updateData.sessionStatus,
            extensionCount: updateData.extensionCount || appointment.extensionCount
        };

        if (pUserId) socketService.emitToUser(pUserId, "session-status-updated", statusData);
        if (dUserId) socketService.emitToUser(dUserId, "session-status-updated", statusData);

        socketService.emitToRoom(appointmentId, "session-status-updated", statusData);


        if (this._chatService) {
            let messageContent = "";
            if (status === SESSION_STATUS.ACTIVE) {
                messageContent = "The doctor has started the session.";
            } else if (status === SESSION_STATUS.CONTINUED_BY_DOCTOR) {
                messageContent = `The doctor has extended the session. (Extension #${updateData.extensionCount})`;
            } else if (status === SESSION_STATUS.ENDED) {
                messageContent = "The consultation has been concluded.";
            }

            if (messageContent) {
                const docId = appointment.doctorId.toString();
                const patientId = appointment.patientId.toString();

                const message = await this._chatService.saveMessage(
                    appointmentId,
                    docId,
                    'Doctor',
                    messageContent,
                    'system'
                );

                if (pUserId) socketService.emitToUser(pUserId, "receive-message", message);
                if (dUserId) socketService.emitToUser(dUserId, "receive-message", message);
                socketService.emitMessage(appointmentId, message);
            }
        }

        if (updateData.sessionStatus === SESSION_STATUS.ENDED) {
            const endData = { appointmentId };
            if (pUserId) socketService.emitToUser(pUserId, "session-ended", endData);
            if (dUserId) socketService.emitToUser(dUserId, "session-ended", endData);
            socketService.emitToRoom(appointmentId, "session-ended", endData);
        }
    }

    async enablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        const apptDoctorId = (appointment.doctorId as any)?._id?.toString() || (appointment.doctorId as any)?.toString();

        if (apptDoctorId !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }


        if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
            throw new AppError("Chat can only be enabled for completed appointments", HttpStatus.BAD_REQUEST);
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await this._appointmentRepository.updateById(appointmentId, {
            sessionStatus: SESSION_STATUS.TEST_NEEDED,
            TEST_NEEDED: true,
            postConsultationChatWindow: {
                isActive: true,
                expiresAt
            }
        });

        if (this._chatService) {
            const doctor = await this._doctorRepository.findById(doctorId);
            const ptId = (appointment.patientId as any)?._id?.toString() || (appointment.patientId as any)?.toString();
            const patient = await this._userRepository.findById(ptId);
            const patientName = patient?.name || 'Patient';

            const messageContent = `Hello ${patientName}, you have 24 hours to proceed with your test results. The chat is now open for you.`;

            const realAptId = appointment._id.toString();
            const patientId = (appointment.patientId as any)?._id?.toString() || (appointment.patientId as any)?.toString();
            const docId = (appointment.doctorId as any)?._id?.toString() || (appointment.doctorId as any)?.toString();
            const persistentRoomId = `persistent-${patientId}-${docId}`;

            const message = await this._chatService.saveMessage(
                realAptId,
                doctorId,
                'Doctor',
                messageContent,
                'text'
            );

            const patientUserId = patient?._id?.toString() || ptId;
            const populatedDoctor = await this._doctorRepository.findById(doctorId);
            const doctorUserId = populatedDoctor?.userId?.toString();

            const messagePayload = {
                ...message.toObject(),
                id: (message as any)._id.toString(),
                persistentRoomId
            };

            if (patientUserId) socketService.emitToUser(patientUserId, "receive-message", messagePayload);
            if (doctorUserId) socketService.emitToUser(doctorUserId, "receive-message", messagePayload);
            socketService.emitMessage(realAptId, messagePayload);
            if (persistentRoomId) socketService.emitToRoom(persistentRoomId, "receive-message", messagePayload);

            const statusUpdate = {
                appointmentId: realAptId,
                customId: appointment.customId,
                status: SESSION_STATUS.TEST_NEEDED,
                TEST_NEEDED: true,
                postConsultationChatWindow: {
                    isActive: true,
                    expiresAt
                }
            };

            const patientData = appointment.patientId as any;
            const doctorData = appointment.doctorId as any;

            const pUserId = patientData?.userId?._id?.toString() || patientData?.userId?.toString() || patientData?._id?.toString() || patientData?.toString();
            const dUserId = doctorData?.userId?._id?.toString() || doctorData?.userId?.toString() || doctorData?._id?.toString() || doctorData?.toString();

            socketService.emitToRoom(realAptId, "session-status-updated", statusUpdate);

            if (persistentRoomId) socketService.emitToRoom(persistentRoomId, "session-status-updated", statusUpdate);

            if (pUserId) socketService.emitToUser(pUserId, "session-status-updated", statusUpdate);
            if (dUserId) socketService.emitToUser(dUserId, "session-status-updated", statusUpdate);
        }
    }

    async disablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        const apptDoctorId = (appointment.doctorId as any)?._id?.toString() || (appointment.doctorId as any)?.toString();

        if (apptDoctorId !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            sessionStatus: SESSION_STATUS.ENDED,
            TEST_NEEDED: false,
            postConsultationChatWindow: {
                isActive: false,
                expiresAt: new Date()
            }
        });

        if (this._chatService) {
            const ptId = (appointment.patientId as any)?._id?.toString() || (appointment.patientId as any)?.toString();
            const patient = await this._userRepository.findById(ptId);
            const patientName = patient?.name || 'Patient';

            const messageContent = `Hello ${patientName}, the doctor has closed this chat session.`;

            const realAptId = appointment._id.toString();
            const persistentRoomId = `persistent-${appointment.patientId.toString()}-${doctorId}`;

            const message = await this._chatService.saveMessage(
                realAptId,
                doctorId,
                'Doctor',
                messageContent,
                'text'
            );

            const patientUserId = patient?._id?.toString() || appointment.patientId.toString();
            const populatedDoctor = await this._doctorRepository.findById(doctorId);
            const doctorUserId = populatedDoctor?.userId?.toString();

            if (patientUserId) socketService.emitToUser(patientUserId, "receive-message", message);
            if (doctorUserId) socketService.emitToUser(doctorUserId, "receive-message", message);
            socketService.emitMessage(realAptId, message);

            const statusUpdate = {
                appointmentId: realAptId,
                status: SESSION_STATUS.ENDED,
                TEST_NEEDED: false,
                postConsultationChatWindow: {
                    isActive: false,
                    expiresAt: appointment.postConsultationChatWindow?.expiresAt
                }
            };

            const patientData = appointment.patientId as any;
            const doctorData = appointment.doctorId as any;

            const pUserId = patientData?.userId?._id?.toString() || patientData?.userId?.toString() || patientData?._id?.toString() || patientData?.toString();
            const dUserId = doctorData?.userId?._id?.toString() || doctorData?.userId?.toString() || doctorData?._id?.toString() || doctorData?.toString();

            socketService.emitToRoom(realAptId, "session-status-updated", statusUpdate);
            if (pUserId) socketService.emitToUser(pUserId, "session-status-updated", statusUpdate);
            if (dUserId) socketService.emitToUser(dUserId, "session-status-updated", statusUpdate);

            await this._appointmentRepository.updateById(realAptId, {
                sessionStatus: SESSION_STATUS.ENDED
            });

            socketService.emitToRoom(realAptId, "session-ended", { appointmentId: realAptId });
            if (pUserId) socketService.emitToUser(pUserId, "session-ended", { appointmentId: realAptId });
            if (dUserId) socketService.emitToUser(dUserId, "session-ended", { appointmentId: realAptId });
        }
    }

    async updateDoctorNotes(appointmentId: string, doctorUserId: string, note: any): Promise<void> {
        this._logger.info("Updating doctor notes", { appointmentId, doctorUserId, note });

        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            this._logger.warn("Appointment not found for note update", { appointmentId });
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        if (appointment.doctorId.toString() !== doctorId) {
            this._logger.warn("Unauthorized attempt to update notes", { appointmentId, doctorUserId });
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        const result = await this._appointmentRepository.updateById(appointmentId, {
            $push: { doctorNotes: note }
        });

        if (!result) {
            this._logger.error("Failed to update doctor notes in database", { appointmentId });
            throw new AppError("Failed to update notes", HttpStatus.INTERNAL_ERROR);
        }

        this._logger.info("Doctor notes updated successfully", { appointmentId });
    }
}
