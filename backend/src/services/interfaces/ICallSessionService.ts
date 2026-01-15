import { ICallSession } from "../../models/call-session.model";

export interface ICallSessionService {
    startCall(appointmentId: string, doctorId: string, patientId: string): Promise<ICallSession>;
    endCall(sessionId: string): Promise<void>;
    updateSocketConnection(sessionId: string, userId: string, socketId: string, role: 'doctor' | 'patient'): Promise<void>;
    handleReconnection(sessionId: string): Promise<ICallSession>;
    checkCanRejoin(appointmentId: string): Promise<{ canRejoin: boolean; session: ICallSession | null }>;
    rejoinCall(appointmentId: string, userId: string): Promise<ICallSession>;
    getActiveCallByAppointment(appointmentId: string): Promise<ICallSession | null>;
    cleanupExpiredSessions(): Promise<number>;
}
