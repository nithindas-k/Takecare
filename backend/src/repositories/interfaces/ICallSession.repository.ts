import { ClientSession } from "mongoose";
import { ICallSession } from "../../models/call-session.model";
import { IBaseRepository } from "./IBase.repository";

export interface ICallSessionRepository extends IBaseRepository<ICallSession> {
    findByAppointmentId(appointmentId: string, session?: ClientSession): Promise<ICallSession | null>;
    findActiveByAppointmentId(appointmentId: string, session?: ClientSession): Promise<ICallSession | null>;
    findActiveByParticipant(userId: string, session?: ClientSession): Promise<ICallSession[]>;
    updateSocketId(sessionId: string, userId: string, socketId: string, role: 'doctor' | 'patient', session?: ClientSession): Promise<ICallSession | null>;
    updateCallStatus(sessionId: string, status: 'INITIATING' | 'ACTIVE' | 'RECONNECTING' | 'ENDED', session?: ClientSession): Promise<ICallSession | null>;
    incrementReconnectionAttempts(sessionId: string, session?: ClientSession): Promise<ICallSession | null>;
    setRejoinExpiry(sessionId: string, expiryDate: Date, session?: ClientSession): Promise<ICallSession | null>;
    cleanupExpiredSessions(session?: ClientSession): Promise<number>;
}
