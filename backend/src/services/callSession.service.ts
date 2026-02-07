import { ICallSessionService } from "./interfaces/ICallSessionService";
import { ICallSessionRepository } from "../repositories/interfaces/ICallSession.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { ICallSession } from "../models/call-session.model";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";
import { ILoggerService } from "./interfaces/ILogger.service";
import { runInTransaction } from "../utils/transaction.util";
import { Types } from "mongoose";

export class CallSessionService implements ICallSessionService {
    constructor(
        private _callSessionRepository: ICallSessionRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _logger: ILoggerService
    ) { }

    async startCall(appointmentId: string, doctorId: string, patientId: string): Promise<ICallSession> {
        this._logger.info("Starting call session", { appointmentId, doctorId, patientId });

        return await runInTransaction(async (session) => {

            const existingCall = await this._callSessionRepository.findActiveByAppointmentId(appointmentId, session);
            if (existingCall) {
                this._logger.info("Active call already exists", { sessionId: existingCall._id });
                return existingCall;
            }

            const callSession = await this._callSessionRepository.create({
                appointmentId: new Types.ObjectId(appointmentId),
                callStatus: 'INITIATING',
                participants: {
                    doctorId: new Types.ObjectId(doctorId),
                    patientId: new Types.ObjectId(patientId),
                },
                startedAt: new Date(),
                lastActiveAt: new Date(),
                reconnectionAttempts: 0,

            }, session);

            const rejoinExpiry = new Date();
            rejoinExpiry.setMinutes(rejoinExpiry.getMinutes() + 5);

            await this._appointmentRepository.updateById(appointmentId, {
                activeCall: {
                    sessionId: callSession._id,
                    status: 'ACTIVE',
                    canRejoinUntil: rejoinExpiry,
                },
            }, session);

            this._logger.info("Call session created", { sessionId: callSession._id });
            return callSession;
        });
    }

    async endCall(sessionId: string): Promise<void> {
        this._logger.info("Ending call session", { sessionId });

        return await runInTransaction(async (session) => {
            const callSession = await this._callSessionRepository.findById(sessionId, session);
            if (!callSession) {
                throw new AppError("Call session not found", HttpStatus.NOT_FOUND);
            }

            await this._callSessionRepository.updateCallStatus(sessionId, 'ENDED', session);

            await this._appointmentRepository.updateById(callSession.appointmentId.toString(), {
                activeCall: {
                    sessionId: callSession._id,
                    status: 'ENDED',
                    canRejoinUntil: null,
                },
                sessionEndTime: new Date(),
            }, session);

            this._logger.info("Call session ended", { sessionId });
        });
    }

    async updateSocketConnection(
        sessionId: string,
        userId: string,
        socketId: string,
        role: 'doctor' | 'patient'
    ): Promise<void> {
        this._logger.info("Updating socket connection", { sessionId, userId, role });

        await this._callSessionRepository.updateSocketId(sessionId, userId, socketId, role);
    }

    async handleReconnection(sessionId: string): Promise<ICallSession> {
        this._logger.info("Handling reconnection", { sessionId });

        return await runInTransaction(async (session) => {
            const callSession = await this._callSessionRepository.findById(sessionId, session);
            if (!callSession) {
                throw new AppError("Call session not found", HttpStatus.NOT_FOUND);
            }

            const updated = await this._callSessionRepository.incrementReconnectionAttempts(sessionId, session);

            if (!updated) {
                throw new AppError("Failed to update reconnection attempts", HttpStatus.INTERNAL_ERROR);
            }

            const rejoinExpiry = new Date();
            rejoinExpiry.setSeconds(rejoinExpiry.getSeconds() + 30);

            await this._callSessionRepository.setRejoinExpiry(sessionId, rejoinExpiry, session);
            const reconnecting = await this._callSessionRepository.updateCallStatus(sessionId, 'RECONNECTING', session);

            if (!reconnecting) {
                throw new AppError("Failed to update call status", HttpStatus.INTERNAL_ERROR);
            }

            this._logger.info("Reconnection initiated", {
                sessionId,
                attempts: updated.reconnectionAttempts,
                expiresAt: rejoinExpiry
            });

            return reconnecting;
        });
    }

    async checkCanRejoin(appointmentId: string): Promise<{ canRejoin: boolean; session: ICallSession | null }> {
        this._logger.info("Checking rejoin capability", { appointmentId });

        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            return { canRejoin: false, session: null };
        }

        if (!appointment.activeCall?.sessionId) {
            return { canRejoin: false, session: null };
        }

        const callSession = await this._callSessionRepository.findById(appointment.activeCall.sessionId.toString());
        if (!callSession) {
            return { canRejoin: false, session: null };
        }


        if (callSession.callStatus === 'ACTIVE' || callSession.callStatus === 'INITIATING') {
            return { canRejoin: true, session: callSession };
        }


        if (callSession.canRejoinUntil && new Date(callSession.canRejoinUntil) > new Date()) {
            return { canRejoin: true, session: callSession };
        }

        return { canRejoin: false, session: null };
    }

    async rejoinCall(appointmentId: string, userId: string): Promise<ICallSession> {
        this._logger.info("Rejoining call", { appointmentId, userId });

        return await runInTransaction(async (session) => {
            const { canRejoin, session: callSession } = await this.checkCanRejoin(appointmentId);

            if (!canRejoin || !callSession) {
                throw new AppError("Cannot rejoin call. Session expired or not found.", HttpStatus.BAD_REQUEST);
            }

            const updated = await this._callSessionRepository.updateCallStatus(
                callSession._id.toString(),
                'ACTIVE',
                session
            );

            if (!updated) {
                throw new AppError("Failed to rejoin call", HttpStatus.INTERNAL_ERROR);
            }

            await this._callSessionRepository.updateById(callSession._id.toString(), {
                reconnectionAttempts: 0,
                canRejoinUntil: null,
            }, session);

            this._logger.info("Successfully rejoined call", { sessionId: callSession._id });
            return updated;
        });
    }

    async getActiveCallByAppointment(appointmentId: string): Promise<ICallSession | null> {
        return await this._callSessionRepository.findActiveByAppointmentId(appointmentId);
    }

    async cleanupExpiredSessions(): Promise<number> {
        this._logger.info("Cleaning up expired sessions");
        const count = await this._callSessionRepository.cleanupExpiredSessions();
        this._logger.info(`Cleaned up ${count} expired sessions`);
        return count;
    }
}
