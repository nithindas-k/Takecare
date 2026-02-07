import { Types, UpdateQuery } from "mongoose";
import { IAppointmentDocument, AppointmentStatus } from "../types/appointment.type";
import { runInTransaction } from "../utils/transaction.util";
import { IAppointmentService } from "./interfaces/IAppointmentService";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { AppError } from "../errors/AppError";

import { APPOINTMENT_STATUS, MESSAGES, HttpStatus, PAYMENT_STATUS, PAYMENT_COMMISSION, CANCELLATION_RULES, ROLES, APPOINTMENT_LOCKS, APPOINTMENT_RULES, NOTIFICATION_TYPES } from "../constants/constants";
import { AppointmentMapper } from "../mappers/appointment.mapper";
import { IWalletService } from "./interfaces/IWalletService";

import { CreateAppointmentDTO, AppointmentResponseDTO, RescheduleAppointmentDTO } from "../dtos/appointment.dtos/appointment.dto";
import { IChatService } from "./interfaces/IChatService";

import { INotificationService } from "./notification.service";
import { socketService } from "./socket.service";
import { SESSION_STATUS, SessionStatus } from "../utils/sessionStatus.util";
import { ILoggerService } from "./interfaces/ILogger.service";
import { parseAppointmentTime } from "../utils/time.util";

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
        appointmentData: CreateAppointmentDTO
    ): Promise<AppointmentResponseDTO> {
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
                        } catch (_err) {
                            this._logger.error("Error converting IDs for search", { patientId, doctorId: appointmentData.doctorId });
                            throw new AppError(MESSAGES.INVALID_ID_FORMAT, HttpStatus.BAD_REQUEST);
                        }


                        const searchDate = new Date(appointmentData.appointmentDate);
                        if (isNaN(searchDate.getTime())) {
                            this._logger.error("Invalid appointment date provided", { date: appointmentData.appointmentDate });
                            throw new AppError("Invalid appointment date", HttpStatus.BAD_REQUEST);
                        }



                        const startDate = new Date(searchDate);
                        startDate.setHours(startDate.getHours() - APPOINTMENT_LOCKS.DUPLICATE_DETECTION_HOURS);
                        const endDate = new Date(searchDate);
                        endDate.setHours(endDate.getHours() + APPOINTMENT_LOCKS.DUPLICATE_DETECTION_HOURS);

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
                            const now = new Date();


                            if (existingAppointment.checkoutLockUntil && existingAppointment.checkoutLockUntil > now) {
                                this._logger.warn("Prevented duplicate checkout session - active lock found", {
                                    patientId,
                                    slotId: appointmentData.slotId,
                                    lockUntil: existingAppointment.checkoutLockUntil
                                });
                                throw new AppError(MESSAGES.PAYMENT_SESSION_ACTIVE, HttpStatus.CONFLICT);
                            }

                            this._logger.info("Found existing PENDING appointment. reusing.", {
                                appointmentId: existingAppointment._id.toString(),
                                previousStatus: existingAppointment.status
                            });


                            const adminCommission = (consultationFees * PAYMENT_COMMISSION.ADMIN_PERCENT) / 100;
                            const doctorEarnings = (consultationFees * PAYMENT_COMMISSION.DOCTOR_PERCENT) / 100;

                            const lockTime = new Date(now.getTime() + (APPOINTMENT_LOCKS.CHECKOUT_LOCK_SECONDS * 1000));

                            const updated = await this._appointmentRepository.updateById(existingAppointment._id.toString(), {
                                appointmentType: appointmentData.appointmentType,
                                consultationFees,
                                adminCommission,
                                doctorEarnings,
                                reason: appointmentData.reason || existingAppointment.reason,
                                appointmentTime: appointmentData.appointmentTime,
                                appointmentDate: new Date(appointmentData.appointmentDate),
                                checkoutLockUntil: lockTime
                            }, session);

                            const populatedAppointment = await this._appointmentRepository.findByIdPopulated(updated!._id.toString(), session);
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
                checkoutLockUntil: new Date(Date.now() + (APPOINTMENT_LOCKS.CHECKOUT_LOCK_SECONDS * 1000)),
            };


            if (appointmentData.slotId) {
                const startTime = parseAppointmentTime(appointmentData.appointmentTime);
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

            const appointment = await this._appointmentRepository.create(appointmentToCreate as unknown as Partial<IAppointmentDocument>, session);

            if (this._notificationService) {
                await this._notificationService.notify(doctor.userId.toString(), {
                    title: "New Appointment Request",
                    message: `You have a new appointment request from ${patient.name}.`,
                    type: NOTIFICATION_TYPES.INFO,
                    appointmentId: appointment._id.toString()
                });
            }

            const populatedAppointment = await this._appointmentRepository.findByIdPopulated(appointment._id.toString(), session);
            return AppointmentMapper.toResponseDTO(populatedAppointment);
        });
    }

    async listAppointments(
        userId: string,
        userRole: string,
        filters: import("../dtos/admin.dtos/admin.dto").AppointmentFilterDTO
    ): Promise<{
        appointments: AppointmentResponseDTO[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        counts?: { upcoming: number; completed: number; cancelled: number };
    }> {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const repoFilters: Record<string, unknown> = {
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

        let counts;
        if (userRole === ROLES.PATIENT) {
            counts = await this._appointmentRepository.getStatusCounts({ patientId: userId });
        } else if (userRole === ROLES.DOCTOR && repoFilters.doctorId) {
            counts = await this._appointmentRepository.getStatusCounts({ doctorId: repoFilters.doctorId.toString() });
        }

        return {
            appointments: result.appointments.map(AppointmentMapper.toResponseDTO),
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
            counts
        };
    }


    async getPatientHistory(patientId: string): Promise<AppointmentResponseDTO[]> {
        const result = await this.listAppointments(patientId, ROLES.PATIENT, {
            page: 1,
            limit: 1000,
        });
        return result.appointments;
    }

    async getAppointmentById(
        appointmentId: string,
        userId: string,
        userRole: string
    ): Promise<AppointmentResponseDTO> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);

        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const getIdString = (value: unknown): string | null => {
            if (!value) return null;
            if (typeof value === "string") return value;
            if (value instanceof Types.ObjectId) return value.toString();
            if (typeof value === "object" && value !== null) {
                const v = value as { _id?: unknown, id?: unknown };
                if (v._id) return String(v._id);
                if (v.id) return String(v.id);
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
    ): Promise<AppointmentResponseDTO> {
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

            const getIdString = (value: unknown): string | null => {
                if (!value) return null;
                if (typeof value === "string") return value;
                if (value instanceof Types.ObjectId) return value.toString();
                if (typeof value === "object" && value !== null) {
                    const v = value as { _id?: unknown, id?: unknown };
                    if (v._id) return String(v._id);
                    if (v.id) return String(v.id);
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
                cancelledBy: userRole === ROLES.PATIENT ? ROLES.PATIENT : userRole === ROLES.ADMIN ? ROLES.ADMIN : ROLES.DOCTOR,
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

                    if (doctor) {
                        const currentBalance = await this._walletService.getWalletBalance(doctor.userId.toString());
                        if (currentBalance < appointment.doctorEarnings) {
                            throw new AppError("Insufficient wallet balance to process refund. Please top up your wallet or contact support.", HttpStatus.BAD_REQUEST);
                        }
                        await this._walletService.deductMoney(doctor.userId.toString(), appointment.doctorEarnings, `Cancellation: appointment #${appointment.customId || appointment.id} cancelled by ${userRole}`, appointment._id.toString(), "Consultation Reversal", session);

                    }

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
                const startTime = parseAppointmentTime(appointment.appointmentTime);
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
                        message: `Your appointment #${customId} has been cancelled by the ${userRole}. Reason: ${cancellationReason}`,
                        type: "info",
                        appointmentId: appointment._id.toString()
                    });
                }
            }

            if (!updatedAppointment) {
                throw new AppError("Failed to update appointment", HttpStatus.INTERNAL_ERROR);
            }

            const populatedAppointment = await this._appointmentRepository.findByIdPopulated(appointmentId, session);
            return AppointmentMapper.toResponseDTO(populatedAppointment);
        });
    }

    async rescheduleAppointment(
        appointmentId: string,
        userId: string,
        userRole: string,
        rescheduleData: RescheduleAppointmentDTO
    ): Promise<AppointmentResponseDTO> {
        this._logger.info("rescheduleAppointment started", { appointmentId, userId, userRole });

        return runInTransaction(async (session) => {
            const appointment = await this._appointmentRepository.findById(appointmentId, session);

            if (!appointment) {
                throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
            }

            if ((appointment.rescheduleCount ?? 0) >= APPOINTMENT_RULES.MAX_RESCHEDULE_COUNT) {
                throw new AppError(MESSAGES.APPOINTMENT_MAX_RESCHEDULE, HttpStatus.BAD_REQUEST);
            }

            let isDoctor = false;
            if (userRole === ROLES.DOCTOR) {
                const doctor = await this._doctorRepository.findByUserId(userId);
                isDoctor = doctor?._id.toString() === appointment.doctorId.toString();
            }

            const isPatient = appointment.patientId.toString() === userId;
            if (!isPatient && !isDoctor && userRole !== ROLES.ADMIN) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }

            const allowedStatuses: AppointmentStatus[] = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.UPCOMING, APPOINTMENT_STATUS.RESCHEDULE_REQUESTED];
            if (!allowedStatuses.includes(appointment.status)) {
                throw new AppError(MESSAGES.APPOINTMENT_CANNOT_MODIFY, HttpStatus.BAD_REQUEST);
            }

            if (rescheduleData.slotId) {
                const schedule = await this._scheduleRepository.findByDoctorId(appointment.doctorId.toString(), session);
                if (schedule) {
                    const slot = schedule.weeklySchedule
                        .flatMap(day => day.slots)
                        .find(s => s.customId === rescheduleData.slotId);

                    if (slot && slot.booked && slot.customId !== appointment.slotId) {
                        throw new AppError(MESSAGES.APPOINTMENT_SLOT_NOT_AVAILABLE, HttpStatus.BAD_REQUEST);
                    }
                }
            }

            if (isDoctor) {
                // Removed immediate release of old slot. It will be released in acceptReschedule.
                /* 
                if (appointment.slotId) {
                    const oldStartTime = parseAppointmentTime(appointment.appointmentTime);
                    await this._scheduleRepository.updateSlotBookedStatus(
                        appointment.doctorId.toString(),
                        appointment.slotId,
                        false,
                        new Date(appointment.appointmentDate),
                        oldStartTime,
                        session
                    );
                }
                */

                if (rescheduleData.slotId) {
                    const newStartTime = parseAppointmentTime(rescheduleData.appointmentTime);
                    await this._scheduleRepository.updateSlotBookedStatus(
                        appointment.doctorId.toString(),
                        rescheduleData.slotId,
                        true,
                        new Date(rescheduleData.appointmentDate),
                        newStartTime,
                        session
                    );
                }

                await this._appointmentRepository.updateById(appointmentId, {
                    status: APPOINTMENT_STATUS.RESCHEDULE_REQUESTED,
                    rescheduleRequest: {
                        appointmentDate: new Date(rescheduleData.appointmentDate),
                        appointmentTime: rescheduleData.appointmentTime,
                        slotId: rescheduleData.slotId || null,
                    },
                    rescheduleRejectReason: null,
                }, session);

                if (this._notificationService) {
                    await this._notificationService.notify(appointment.patientId.toString(), {
                        title: "Appointment Reschedule Requested",
                        message: `The doctor has requested to reschedule your appointment to ${rescheduleData.appointmentTime} on ${new Date(rescheduleData.appointmentDate).toDateString()}.`,
                        type: NOTIFICATION_TYPES.INFO,
                        appointmentId: appointmentId
                    });
                }

                const populated = await this._appointmentRepository.findByIdPopulated(appointmentId, session);
                return AppointmentMapper.toResponseDTO(populated);

            } else {
                if (appointment.slotId) {
                    const oldStartTime = parseAppointmentTime(appointment.appointmentTime);
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
                    const newStartTime = parseAppointmentTime(rescheduleData.appointmentTime);
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

                await this._appointmentRepository.updateById(appointmentId, {
                    appointmentDate: new Date(rescheduleData.appointmentDate),
                    appointmentTime: rescheduleData.appointmentTime,
                    slotId: rescheduleData.slotId || null,
                    status: APPOINTMENT_STATUS.PENDING,
                    rescheduleCount: (appointment.rescheduleCount || 0) + 1,
                    rescheduleRequest: null,
                }, session);

                const populated = await this._appointmentRepository.findByIdPopulated(appointmentId, session);
                return AppointmentMapper.toResponseDTO(populated);
            }
        });
    }

    async acceptReschedule(appointmentId: string, userId: string): Promise<void> {
        return runInTransaction(async (session) => {
            const appointment = await this._appointmentRepository.findById(appointmentId, session);
            if (!appointment) throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);

            if (appointment.patientId.toString() !== userId) {
                throw new AppError("Unauthorized", HttpStatus.FORBIDDEN);
            }

            if (appointment.status !== APPOINTMENT_STATUS.RESCHEDULE_REQUESTED || !appointment.rescheduleRequest) {
                throw new AppError("No active reschedule request found", HttpStatus.BAD_REQUEST);
            }

            const { appointmentDate, appointmentTime, slotId } = appointment.rescheduleRequest;


            if (appointment.slotId) {
                const oldStartTime = parseAppointmentTime(appointment.appointmentTime);
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    appointment.slotId,
                    false,
                    new Date(appointment.appointmentDate),
                    oldStartTime,
                    session
                );
                this._logger.info(`Released old slot ${appointment.slotId} as reschedule to ${slotId} was accepted.`);
            }

            await this._appointmentRepository.updateById(appointmentId, {
                appointmentDate,
                appointmentTime,
                slotId,
                status: APPOINTMENT_STATUS.CONFIRMED,
                rescheduleRequest: null,
                rescheduleCount: (appointment.rescheduleCount || 0) + 1,
            }, session);

            if (this._notificationService) {
                const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
                if (doctor) {
                    await this._notificationService.notify(doctor.userId.toString(), {
                        title: "Reschedule Accepted",
                        message: `Patient has accepted the reschedule for appointment #${appointment.customId || appointmentId}.`,
                        type: NOTIFICATION_TYPES.SUCCESS,
                        appointmentId
                    });
                }
            }
        });
    }

    async rejectReschedule(appointmentId: string, userId: string, reason: string): Promise<void> {
        return runInTransaction(async (session) => {
            const appointment = await this._appointmentRepository.findById(appointmentId, session);
            if (!appointment) throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);

            if (appointment.patientId.toString() !== userId) {
                throw new AppError("Unauthorized", HttpStatus.FORBIDDEN);
            }

            if (appointment.status !== APPOINTMENT_STATUS.RESCHEDULE_REQUESTED || !appointment.rescheduleRequest) {
                throw new AppError("No active reschedule request found", HttpStatus.BAD_REQUEST);
            }

            const currentRescheduleRequest = appointment.rescheduleRequest;

            if (currentRescheduleRequest.slotId) {
                const startTime = parseAppointmentTime(currentRescheduleRequest.appointmentTime);
                await this._scheduleRepository.updateSlotBookedStatus(
                    appointment.doctorId.toString(),
                    currentRescheduleRequest.slotId,
                    false,
                    new Date(currentRescheduleRequest.appointmentDate),
                    startTime,
                    session
                );
            }

            await this._appointmentRepository.updateById(appointmentId, {
                status: APPOINTMENT_STATUS.PENDING,
                rescheduleRequest: null,
                rescheduleRejectReason: reason,
            }, session);

            if (this._notificationService) {
                const doctor = await this._doctorRepository.findById(appointment.doctorId.toString());
                if (doctor) {
                    await this._notificationService.notify(doctor.userId.toString(), {
                        title: "Reschedule Rejected",
                        message: `Patient has rejected the reschedule for appointment #${appointment.customId || appointmentId}. Reason: ${reason}`,
                        type: "warning",
                        appointmentId
                    });
                }
            }
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
                throw new AppError(MESSAGES.APPOINTMENT_ONLY_PAID_APPROVED, HttpStatus.BAD_REQUEST);
            }

            await this._appointmentRepository.updateById(appointmentId, {
                status: APPOINTMENT_STATUS.CONFIRMED,
            }, session);


            // Removed slot release on approval to prevent other users from booking a confirmed slot.
            /* 
            if (appointment.slotId) {
                const startTime = parseAppointmentTime(appointment.appointmentTime);
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
            */

            if (this._notificationService) {
                const ptId = appointment.patientId.toString();
                await this._notificationService.notify(ptId, {
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
                const startTime = parseAppointmentTime(appointment.appointmentTime);

                const getIdString = (value: unknown): string | null => {
                    if (!value) return null;
                    if (typeof value === "string") return value;
                    if (value instanceof Types.ObjectId) return value.toString();
                    if (typeof value === "object") {
                        const v = value as { _id?: unknown; id?: unknown };
                        if (v._id) return String(v._id);
                        if (v.id && typeof v.id === 'string') return v.id;
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

        const updateData: UpdateQuery<IAppointmentDocument> = {
            status: APPOINTMENT_STATUS.COMPLETED,
            prescriptionUrl: prescriptionUrl || null,
            sessionEndTime: new Date(),
        };

        await this._appointmentRepository.updateById(appointmentId, updateData);

        if (this._chatService) {
            await this._chatService.sendSystemMessage(appointmentId, "The consultation has been completed.");
        }

        if (appointment.slotId) {
            const startTime = parseAppointmentTime(appointment.appointmentTime);
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

            if (this._chatService) {
                const messageContent = appointment.appointmentType === 'chat'
                    ? `Doctor has started the chat consultation.`
                    : `Doctor has started the video consultation.`;

                await this._chatService.sendSystemMessage(appointmentId, messageContent);
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

        const updateData: UpdateQuery<IAppointmentDocument> = {
            sessionStatus: status
        };

        if (status === SESSION_STATUS.ACTIVE) {
            if (!appointment.sessionStartTime) {
                updateData.sessionStartTime = new Date();
                if (this._chatService) {
                    const messageContent = appointment.appointmentType === 'chat'
                        ? `Doctor has started the chat consultation.`
                        : `Doctor has started the video consultation.`;
                    await this._chatService.sendSystemMessage(appointmentId, messageContent);
                }
            }
        } else if (status === SESSION_STATUS.CONTINUED_BY_DOCTOR) {
            updateData.extensionCount = (appointment.extensionCount || 0) + 1;
            if (this._chatService) {
                await this._chatService.sendSystemMessage(appointmentId, "The doctor has extended the consultation session.");
            }
        } else if (status === SESSION_STATUS.ENDED) {
            updateData.sessionEndTime = new Date();
            updateData.status = APPOINTMENT_STATUS.COMPLETED;
            if (this._chatService) {
                await this._chatService.sendSystemMessage(appointmentId, "The consultation has been completed.");
            }
        }

        await this._appointmentRepository.updateById(appointmentId, updateData);

        // Fetch populated data for socket emission
        const populatedAppointment = await this._appointmentRepository.findByIdPopulated(appointmentId);

        const patientIdStr = populatedAppointment && populatedAppointment.patientId && typeof populatedAppointment.patientId === 'object' && '_id' in populatedAppointment.patientId
            ? populatedAppointment.patientId._id.toString()
            : null;

        const doctorUserIdStr = populatedAppointment && populatedAppointment.doctorId && typeof populatedAppointment.doctorId === 'object' && 'userId' in populatedAppointment.doctorId && populatedAppointment.doctorId.userId
            ? (populatedAppointment.doctorId.userId._id ? populatedAppointment.doctorId.userId._id.toString() : populatedAppointment.doctorId.userId.toString())
            : null;

        const statusData = {
            appointmentId,
            status: updateData.sessionStatus,
            extensionCount: updateData.extensionCount || appointment.extensionCount
        };

        if (patientIdStr) socketService.emitToUser(patientIdStr, "session-status-updated", statusData);
        if (doctorUserIdStr) socketService.emitToUser(doctorUserIdStr, "session-status-updated", statusData);
        socketService.emitToRoom(appointmentId, "session-status-updated", statusData);

        if (updateData.sessionStatus === SESSION_STATUS.ENDED) {
            const endData = { appointmentId };
            if (patientIdStr) socketService.emitToUser(patientIdStr, "session-ended", endData);
            if (doctorUserIdStr) socketService.emitToUser(doctorUserIdStr, "session-ended", endData);
            socketService.emitToRoom(appointmentId, "session-ended", endData);
        }
    }

    async enablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        const apptDoctorId = appointment.doctorId && typeof appointment.doctorId === 'object' && '_id' in appointment.doctorId
            ? appointment.doctorId._id.toString()
            : null;
        if (!apptDoctorId) throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);

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
            const patientId = appointment.patientId && typeof appointment.patientId === 'object' && '_id' in appointment.patientId
                ? appointment.patientId._id.toString()
                : null;

            const patient = patientId ? await this._userRepository.findById(patientId) : null;
            const patientName = patient?.name || 'Patient';
            const messageContent = `Hello ${patientName}, you have 24 hours to proceed with your test results. The chat is now open for you.`;

            await this._chatService.sendSystemMessage(appointmentId, messageContent);
        }


        const statusUpdate = {
            appointmentId,
            customId: appointment.customId,
            status: SESSION_STATUS.TEST_NEEDED,
            TEST_NEEDED: true,
            postConsultationChatWindow: {
                isActive: true,
                expiresAt
            }
        };



        const patientIdStr = appointment.patientId && typeof appointment.patientId === 'object' && '_id' in appointment.patientId
            ? appointment.patientId._id.toString()
            : null;

        const doctorUserIdStr = appointment.doctorId && typeof appointment.doctorId === 'object' && 'userId' in appointment.doctorId && appointment.doctorId.userId
            ? (appointment.doctorId.userId._id ? appointment.doctorId.userId._id.toString() : appointment.doctorId.userId.toString())
            : null;

        if (patientIdStr) socketService.emitToUser(patientIdStr, "session-status-updated", statusUpdate);
        if (doctorUserIdStr) socketService.emitToUser(doctorUserIdStr, "session-status-updated", statusUpdate);
    }

    async disablePostConsultationChat(appointmentId: string, doctorUserId: string): Promise<void> {
        const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        const apptDoctorId = appointment.doctorId && typeof appointment.doctorId === 'object' && '_id' in appointment.doctorId
            ? appointment.doctorId._id.toString()
            : null;

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
            const messageContent = 'The doctor has concluded the follow-up chat session.';
            await this._chatService.sendSystemMessage(appointmentId, messageContent);
        }

        const statusUpdate = {
            appointmentId,
            status: SESSION_STATUS.ENDED,
            TEST_NEEDED: false,
            postConsultationChatWindow: {
                isActive: false,
                expiresAt: new Date()
            }
        };

        const patientIdStr = appointment.patientId && typeof appointment.patientId === 'object' && '_id' in appointment.patientId
            ? appointment.patientId._id.toString()
            : null;

        const doctorUserIdStr = appointment.doctorId && typeof appointment.doctorId === 'object' && 'userId' in appointment.doctorId && appointment.doctorId.userId
            ? (appointment.doctorId.userId._id ? appointment.doctorId.userId._id.toString() : appointment.doctorId.userId.toString())
            : null;

        socketService.emitToRoom(appointmentId, "session-status-updated", statusUpdate);
        if (patientIdStr) socketService.emitToUser(patientIdStr, "session-status-updated", statusUpdate);
        if (doctorUserIdStr) socketService.emitToUser(doctorUserIdStr, "session-status-updated", statusUpdate);

        socketService.emitToRoom(appointmentId, "session-ended", { appointmentId });
    }

    async updateDoctorNotes(appointmentId: string, doctorUserId: string, note: string): Promise<void> {
        this._logger.info("Updating doctor notes", { appointmentId, doctorUserId, note });

        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        const doctorId = await this._requireDoctorIdByUserId(doctorUserId);
        if (appointment.doctorId.toString() !== doctorId) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        await this._appointmentRepository.updateById(appointmentId, {
            $push: { doctorNotes: note }
        });
    }
}
