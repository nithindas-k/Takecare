import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { SESSION_STATUS, SessionStatus } from "../utils/sessionStatus.util";
import { SessionState, SessionTimerCheckResult } from "../types/session.types";
import { socketService } from "./socket.service";
import { ILoggerService } from "./interfaces/ILogger.service";
import { IAppointmentDocument } from "../types/appointment.type";
import { IUserDocument } from "../types/user.type";

export class SessionTimerService {
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private readonly CHECK_INTERVAL_MS = 30000;

    constructor(
        private _appointmentRepository: IAppointmentRepository,
        private _logger: ILoggerService
    ) { }

    start(): void {
        if (this.checkInterval) {
            this._logger.warn("SessionTimerService already running");
            return;
        }

        this._logger.info("Starting SessionTimerService");
        this.checkInterval = setInterval(() => {
            this.checkExpiredSessions().catch(err => {
                this._logger.error("Error checking expired sessions", err);
            });
        }, this.CHECK_INTERVAL_MS);

        this.checkExpiredSessions().catch(err => {
            this._logger.error("Initial session check failed", err);
        });
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this._logger.info("SessionTimerService stopped");
        }
    }

    private async checkExpiredSessions(): Promise<void> {
        try {
            const activeAppointments = await this._appointmentRepository.findAll({
                status: 'confirmed',
                sessionStatus: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.CONTINUED_BY_DOCTOR] }
            }, 0, 1000);

            const now = new Date();
            const results: SessionTimerCheckResult[] = [];

            for (const appointment of activeAppointments.appointments) {
                const result = await this.checkSingleSession(appointment as unknown as IAppointmentDocument, now);
                if (result.statusChanged) {
                    results.push(result);
                    await this.emitSessionUpdate(result);
                }
            }

            if (results.length > 0) {
                this._logger.info(`Processed ${results.length} expired sessions`);
            }
        } catch (error) {
            this._logger.error("Failed to check expired sessions", error);
        }
    }

    private async checkSingleSession(appointment: IAppointmentDocument, now: Date): Promise<SessionTimerCheckResult> {
        const previousStatus = appointment.sessionStatus as SessionStatus;
        let newStatus = previousStatus;
        let statusChanged = false;

        if (!appointment.sessionStartTime || !appointment.appointmentTime) {
            return {
                appointmentId: appointment._id.toString(),
                previousStatus,
                newStatus,
                statusChanged: false,
                sessionState: this.buildSessionState(appointment, now)
            };
        }

        const sessionEnd = this.calculateSessionEndTime(appointment);
        const isExpired = now > sessionEnd;

        if (isExpired && previousStatus === SESSION_STATUS.ACTIVE) {
            newStatus = SESSION_STATUS.WAITING_FOR_DOCTOR;
            statusChanged = true;

            await this._appointmentRepository.updateById(appointment._id.toString(), {
                sessionStatus: newStatus
            });

            this._logger.info(`Session expired for appointment ${appointment._id}`, {
                previousStatus,
                newStatus,
                sessionEnd: sessionEnd.toISOString()
            });
        }

        return {
            appointmentId: appointment._id.toString(),
            previousStatus,
            newStatus,
            statusChanged,
            sessionState: this.buildSessionState(appointment, now, newStatus)
        };
    }

    private calculateSessionEndTime(appointment: IAppointmentDocument): Date {
        const appointmentDate = new Date(appointment.appointmentDate);
        const timeStr = appointment.appointmentTime;

        if (!timeStr) {
            return new Date(0);
        }

        const parts = timeStr.split('-');
        const endTimeStr = parts[1]?.trim();

        if (!endTimeStr) {
            return new Date(0);
        }

        const [hours, minutes] = endTimeStr.split(':').map(Number);
        const sessionEnd = new Date(appointmentDate);
        sessionEnd.setHours(hours, minutes, 0, 0);

        return sessionEnd;
    }

    private buildSessionState(appointment: IAppointmentDocument, now: Date, overrideStatus?: SessionStatus): SessionState {
        const status = overrideStatus || (appointment.sessionStatus as SessionStatus);
        const sessionEnd = this.calculateSessionEndTime(appointment);
        const timeRemaining = sessionEnd.getTime() - now.getTime();
        const isExpired = timeRemaining <= 0;

        return {
            status,
            timeRemaining: isExpired ? 0 : timeRemaining,
            canExtend: status === SESSION_STATUS.WAITING_FOR_DOCTOR,
            isExpired,
            extensionCount: appointment.extensionCount || 0,
            sessionStartTime: appointment.sessionStartTime?.toISOString() || null,
            sessionEndTime: sessionEnd.toISOString(),
            testNeeded: appointment.TEST_NEEDED || false
        };
    }

    private async emitSessionUpdate(result: SessionTimerCheckResult): Promise<void> {
        const { appointmentId, sessionState } = result;

        try {
            const appointment = await this._appointmentRepository.findByIdPopulated(appointmentId);
            if (!appointment) return;

            const updateData = {
                appointmentId,
                status: sessionState.status,
                extensionCount: sessionState.extensionCount,
                sessionState,
                timestamp: new Date().toISOString()
            };

            const patientId = typeof appointment.patientId === 'object' ? appointment.patientId._id.toString() : String(appointment.patientId || '');
            const doctorUserId = typeof appointment.doctorId === 'object' && appointment.doctorId !== null ? (appointment.doctorId.userId as IUserDocument)._id?.toString() || appointment.doctorId.userId.toString() : undefined;

            if (patientId) {
                socketService.emitToUser(patientId, "session-status-updated", updateData);
            }
            if (doctorUserId) {
                socketService.emitToUser(doctorUserId, "session-status-updated", updateData);
            }

            socketService.emitToRoom(appointmentId, "session-status-updated", updateData);

            this._logger.info(`Emitted session update for ${appointmentId}`, {
                status: sessionState.status,
                patientId,
                doctorUserId
            });
        } catch (error) {
            this._logger.error(`Failed to emit session update for ${appointmentId}`, error);
        }
    }

    async getSessionState(appointmentId: string): Promise<SessionState | null> {
        try {
            const appointment = await this._appointmentRepository.findById(appointmentId);
            if (!appointment) return null;

            return this.buildSessionState(appointment, new Date());
        } catch (error) {
            this._logger.error(`Failed to get session state for ${appointmentId}`, error);
            return null;
        }
    }
}
