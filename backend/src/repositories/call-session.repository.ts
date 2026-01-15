import { ClientSession } from "mongoose";
import CallSessionModel, { ICallSession } from "../models/call-session.model";
import { BaseRepository } from "./base.repository";
import { ICallSessionRepository } from "./interfaces/ICallSession.repository";

export class CallSessionRepository extends BaseRepository<ICallSession> implements ICallSessionRepository {
    constructor() {
        super(CallSessionModel);
    }

    async findByAppointmentId(appointmentId: string, session?: ClientSession): Promise<ICallSession | null> {
        return await this.model
            .findOne({ appointmentId })
            .session(session || null)
            .sort({ createdAt: -1 })
            .exec();
    }

    async findActiveByAppointmentId(appointmentId: string, session?: ClientSession): Promise<ICallSession | null> {
        return await this.model
            .findOne({
                appointmentId,
                callStatus: { $in: ['INITIATING', 'ACTIVE', 'RECONNECTING'] }
            })
            .session(session || null)
            .exec();
    }

    async findActiveByParticipant(userId: string, session?: ClientSession): Promise<ICallSession[]> {
        return await this.model
            .find({
                $or: [
                    { 'participants.doctorId': userId },
                    { 'participants.patientId': userId }
                ],
                callStatus: { $in: ['ACTIVE', 'RECONNECTING'] }
            })
            .session(session || null)
            .populate('appointmentId')
            .exec();
    }

    async updateSocketId(
        sessionId: string,
        userId: string,
        socketId: string,
        role: 'doctor' | 'patient',
        session?: ClientSession
    ): Promise<ICallSession | null> {
        const updateField = role === 'doctor'
            ? 'participants.doctorSocketId'
            : 'participants.patientSocketId';

        return await this.model
            .findByIdAndUpdate(
                sessionId,
                {
                    [updateField]: socketId,
                    lastActiveAt: new Date()
                },
                { new: true, session: session || undefined }
            )
            .exec();
    }

    async updateCallStatus(
        sessionId: string,
        status: 'INITIATING' | 'ACTIVE' | 'RECONNECTING' | 'ENDED',
        session?: ClientSession
    ): Promise<ICallSession | null> {
        const update: any = {
            callStatus: status,
            lastActiveAt: new Date()
        };

        if (status === 'ENDED') {
            update.endedAt = new Date();
        }

        return await this.model
            .findByIdAndUpdate(sessionId, update, { new: true, session: session || undefined })
            .exec();
    }

    async incrementReconnectionAttempts(sessionId: string, session?: ClientSession): Promise<ICallSession | null> {
        return await this.model
            .findByIdAndUpdate(
                sessionId,
                {
                    $inc: { reconnectionAttempts: 1 },
                    lastActiveAt: new Date()
                },
                { new: true, session: session || undefined }
            )
            .exec();
    }

    async setRejoinExpiry(sessionId: string, expiryDate: Date, session?: ClientSession): Promise<ICallSession | null> {
        return await this.model
            .findByIdAndUpdate(
                sessionId,
                {
                    canRejoinUntil: expiryDate,
                    callStatus: 'RECONNECTING'
                },
                { new: true, session: session || undefined }
            )
            .exec();
    }

    async cleanupExpiredSessions(session?: ClientSession): Promise<number> {
        const result = await this.model
            .updateMany(
                {
                    canRejoinUntil: { $lt: new Date() },
                    callStatus: { $ne: 'ENDED' }
                },
                {
                    callStatus: 'ENDED',
                    endedAt: new Date()
                },
                { session: session || undefined }
            )
            .exec();

        return result.modifiedCount;
    }
}
