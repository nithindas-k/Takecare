import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IWalletRepository } from "../repositories/interfaces/IWalletRepository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { ILoggerService } from "./interfaces/ILogger.service";
import { INotificationService } from "./notification.service";
import { socketService } from "./socket.service";
import { SESSION_STATUS } from "../utils/sessionStatus.util";
import { APPOINTMENT_STATUS, PAYMENT_STATUS, CANCELLATION_RULES, ROLES } from "../constants/constants";
import { Types, ClientSession } from "mongoose";
import { runInTransaction } from "../utils/transaction.util";
import TransactionModel from "../models/transaction.model";

export class NoShowHandlerService {
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000;
    private readonly NO_SHOW_GRACE_MINUTES = 15;

    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _walletRepository: IWalletRepository,
        private _userRepository: IUserRepository,
        private _doctorRepository: IDoctorRepository,
        private _logger: ILoggerService,
        private _notificationService?: INotificationService
    ) { }

    start(): void {
        if (this.checkInterval) {
            this._logger.warn("NoShowHandlerService already running");
            return;
        }
        this._logger.info("Starting NoShowHandlerService");

        // Run initial check
        this.checkNoShows().catch(err => {
            this._logger.error("Initial no-show check failed", err);
        });

        this.checkInterval = setInterval(() => {
            this.checkNoShows().catch(err => {
                this._logger.error("No-show check error", err);
            });
        }, this.CHECK_INTERVAL_MS);
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this._logger.info("NoShowHandlerService stopped");
        }
    }

    private parseEndTime(appointmentDate: Date, appointmentTime: string): Date | null {
        try {
            const parts = appointmentTime.split("-");
            const endTimeStr = parts[1]?.trim();
            if (!endTimeStr) return null;

            const [hours, minutes] = endTimeStr.split(":").map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;

            const endTime = new Date(appointmentDate);
            endTime.setHours(hours, minutes, 0, 0);
            return endTime;
        } catch {
            return null;
        }
    }

    private async checkNoShows(): Promise<void> {
        try {
            const now = new Date();

            // Find confirmed appointments that are past their end time + grace period
            // and have NOT been handled (sessionStatus not ENDED / COMPLETED)
            const appointments = await this._appointmentRepository.findAll(
                {
                    status: "confirmed",
                    endDate: new Date(
                        now.getTime() - this.NO_SHOW_GRACE_MINUTES * 60 * 1000
                    ),
                },
                0,
                200
            );

            for (const apt of appointments.appointments) {
                // Skip if already ended
                if (
                    apt.sessionStatus === SESSION_STATUS.ENDED ||
                    (apt as unknown as { noShowHandled?: boolean }).noShowHandled
                ) {
                    continue;
                }

                const appointmentDate = new Date(apt.appointmentDate);
                const endTime = this.parseEndTime(appointmentDate, apt.appointmentTime);
                if (!endTime) continue;

                // Add grace period
                const graceDeadline = new Date(
                    endTime.getTime() + this.NO_SHOW_GRACE_MINUTES * 60 * 1000
                );
                if (now < graceDeadline) continue;

                const aptId = apt._id.toString() || apt.id?.toString() || "";
                if (!aptId) continue;

                await this.handleNoShow(aptId, apt.sessionStartTime);
            }
        } catch (error) {
            this._logger.error("Failed in checkNoShows", error);
        }
    }

    private async handleNoShow(appointmentId: string, sessionStartTime: Date | null | undefined): Promise<void> {
        try {
            this._logger.info(`Processing no-show for appointment ${appointmentId}`, {
                sessionStarted: !!sessionStartTime
            });

            await runInTransaction(async (session: ClientSession | undefined) => {
                const appointment = await this._appointmentRepository.findById(appointmentId, session);
                if (!appointment) return;

                // Double-check status
                if (
                    appointment.status === APPOINTMENT_STATUS.CANCELLED ||
                    appointment.status === APPOINTMENT_STATUS.COMPLETED ||
                    appointment.sessionStatus === SESSION_STATUS.ENDED ||
                    (appointment as unknown as { noShowHandled?: boolean }).noShowHandled
                ) {
                    return;
                }

                const getIdStr = (val: unknown): string | null => {
                    if (!val) return null;
                    if (typeof val === "string") return val;
                    if (val instanceof Types.ObjectId) return val.toString();
                    if (typeof val === "object" && val !== null) {
                        const v = val as { _id?: unknown; id?: unknown };
                        if (v._id) return String(v._id);
                        if (v.id) return String(v.id);
                    }
                    return null;
                };

                const patientId = getIdStr(appointment.patientId);
                const doctorId = getIdStr(appointment.doctorId);

                // Determine refund amount
                const totalFee = appointment.consultationFees;
                let refundAmount = 0;
                let refundReason = "";

                if (!sessionStartTime) {
                    // Nobody joined — full refund
                    refundAmount = totalFee;
                    refundReason = `Full refund: No one joined appointment #${appointment.customId || appointmentId}`;
                } else {
                    // Session started but never properly ended (doctor left abruptly)
                    // Give 70% refund (same as patient cancel)
                    refundAmount = Math.round(
                        (totalFee * CANCELLATION_RULES.USER_CANCEL_REFUND_PERCENT) / 100
                    );
                    refundReason = `Partial refund: Session ended abruptly #${appointment.customId || appointmentId}`;
                }

                // Mark appointment as cancelled with no-show reason
                await this._appointmentRepository.updateById(
                    appointmentId,
                    {
                        status: APPOINTMENT_STATUS.CANCELLED,
                        sessionStatus: SESSION_STATUS.ENDED,
                        cancelledBy: ROLES.ADMIN,
                        cancellationReason: sessionStartTime
                            ? "Session did not complete — automatic refund issued."
                            : "No participant joined the session — automatic refund issued.",
                        cancelledAt: new Date(),
                        sessionEndTime: new Date(),
                        paymentStatus: PAYMENT_STATUS.REFUNDED,
                    },
                    session
                );

                // Refund the patient
                if (patientId && appointment.paymentStatus === PAYMENT_STATUS.PAID && refundAmount > 0) {
                    const patient = await this._userRepository.findById(patientId);
                    if (patient) {
                        await this._walletRepository.updateBalance(patient._id.toString(), refundAmount, session);
                        await TransactionModel.create(
                            [
                                {
                                    userId: new Types.ObjectId(patient._id.toString()),
                                    appointmentId: new Types.ObjectId(appointmentId),
                                    amount: refundAmount,
                                    type: "Refund",
                                    description: refundReason,
                                    status: "completed",
                                },
                            ],
                            { session }
                        );

                        // Notify patient
                        if (this._notificationService) {
                            await this._notificationService.notify(patient._id.toString(), {
                                title: "Refund Processed",
                                message: `₹${refundAmount} has been refunded to your wallet. ${refundReason}`,
                                type: "info",
                                appointmentId,
                            });
                        }
                    }
                }

                // Claw back doctor earnings if session never started
                if (!sessionStartTime && doctorId && appointment.paymentStatus === PAYMENT_STATUS.PAID) {
                    const doctor = await this._doctorRepository.findById(doctorId);
                    if (doctor) {
                        const doctorUserId = doctor.userId?.toString();
                        if (doctorUserId) {
                            const currentBalance = (await this._walletRepository.findByUserId(doctorUserId, session))?.balance || 0;
                            const deductAmount = Math.min(currentBalance, appointment.doctorEarnings);

                            if (deductAmount > 0) {
                                await this._walletRepository.updateBalance(doctorUserId, -deductAmount, session);
                                await TransactionModel.create(
                                    [
                                        {
                                            userId: new Types.ObjectId(doctorUserId),
                                            appointmentId: new Types.ObjectId(appointmentId),
                                            amount: -deductAmount,
                                            type: "Consultation Reversal",
                                            description: `No-show reversal: appointment #${appointment.customId || appointmentId}`,
                                            status: "completed",
                                        },
                                    ],
                                    { session }
                                );
                            }

                            if (this._notificationService) {
                                await this._notificationService.notify(doctorUserId, {
                                    title: "Session Auto-Cancelled",
                                    message: `Appointment #${appointment.customId || appointmentId} was auto-cancelled because no participant joined. Your wallet has been adjusted.`,
                                    type: "warning",
                                    appointmentId,
                                });
                            }
                        }
                    }
                }

                // Emit session-ended to both users via socket
                const patientIdStr = patientId;
                let doctorUserIdStr: string | null = null;

                if (doctorId) {
                    const doctor = await this._doctorRepository.findById(doctorId);
                    doctorUserIdStr = doctor?.userId?.toString() || null;
                }

                const endPayload = { appointmentId };
                if (patientIdStr) socketService.emitToUser(patientIdStr, "session-ended", endPayload);
                if (doctorUserIdStr) socketService.emitToUser(doctorUserIdStr, "session-ended", endPayload);
                socketService.emitToRoom(appointmentId, "session-ended", endPayload);

                this._logger.info(`No-show handled for appointment ${appointmentId}`, {
                    refundAmount,
                    patientId: patientIdStr,
                });
            });
        } catch (error) {
            this._logger.error(`Failed to handle no-show for appointment ${appointmentId}`, error);
        }
    }
}
