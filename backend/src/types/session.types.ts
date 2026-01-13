import { SessionStatus } from '../utils/sessionStatus.util';

export interface SessionState {
    status: SessionStatus;
    timeRemaining: number | null;
    canExtend: boolean;
    isExpired: boolean;
    extensionCount: number;
    sessionStartTime: string | null;
    sessionEndTime: string | null;
    testNeeded?: boolean;
}

export interface PostConsultationWindow {
    isActive: boolean;
    expiresAt: string | null;
    enabledAt?: string | null;
    enabledBy?: string;
}

export interface SessionUpdateData {
    appointmentId: string;
    sessionState: SessionState;
    postConsultationWindow?: PostConsultationWindow;
    timestamp: string;
}

export interface SessionTimerCheckResult {
    appointmentId: string;
    previousStatus: SessionStatus;
    newStatus: SessionStatus;
    statusChanged: boolean;
    sessionState: SessionState;
}
