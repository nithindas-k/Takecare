import type { SessionStatus } from '../utils/constants';

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

export interface SessionUIState {
    canSendMessage: boolean;
    canExtend: boolean;
    isLocked: boolean;
    showWaitingModal: boolean;
    showExtensionModal: boolean;
    showTimeWarning: boolean;
    lockedMessage?: string;
}
