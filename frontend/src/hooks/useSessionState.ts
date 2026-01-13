import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { SESSION_STATUS, isSessionActive, isSessionLocked, canExtendSession } from '../utils/constants';
import type { SessionStatus } from '../utils/constants';
import type { SessionUIState } from '../types/session.types';

interface UseSessionStateProps {
    appointmentId: string | undefined;
    appointment: any;
    isDoctor: boolean;
}

interface UseSessionStateReturn extends SessionUIState {
    sessionStatus: SessionStatus;
    isTimeOver: boolean;
    extensionCount: number;
    isPostConsultationWindowOpen: boolean;
    updateSessionStatus: (status: SessionStatus) => Promise<void>;
}

export const useSessionState = ({
    appointmentId,
    appointment,
    isDoctor
}: UseSessionStateProps): UseSessionStateReturn => {
    const { socket } = useSocket();
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SESSION_STATUS.ACTIVE);
    const [isTimeOver, setIsTimeOver] = useState(false);
    const [extensionCount, setExtensionCount] = useState(0);

    const isPostConsultationWindowOpen = useMemo(() => {
        if (!appointment?.postConsultationChatWindow) return false;
        const { isActive, expiresAt } = appointment.postConsultationChatWindow;
        if (!isActive || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
    }, [appointment]);

    useEffect(() => {
        if (appointment?.sessionStatus) {
            setSessionStatus(appointment.sessionStatus);
            setExtensionCount(appointment.extensionCount || 0);
        }
    }, [appointment]);

    useEffect(() => {
        if (!socket || !appointmentId) return;

        const handleSessionStatusUpdate = (data: any) => {
            const matchId = appointment?._id || appointmentId;
            const matchCustomId = appointment?.customId;

            const isMatch =
                data.appointmentId === matchId ||
                String(data.appointmentId) === String(matchId) ||
                (data.customId && matchCustomId && data.customId === matchCustomId) ||
                (data.customId && data.customId === appointmentId) ||
                (data.appointmentId === appointmentId);

            if (isMatch) {
                setSessionStatus(data.status || data.sessionState?.status);
                if (data.extensionCount !== undefined) {
                    setExtensionCount(data.extensionCount);
                }
                if (data.status === SESSION_STATUS.ACTIVE || data.status === SESSION_STATUS.CONTINUED_BY_DOCTOR) {
                    setIsTimeOver(false);
                }
            }
        };

        const handleSessionEnded = (data: any) => {
            if (data.appointmentId === (appointment?._id || appointmentId)) {
                setSessionStatus(SESSION_STATUS.ENDED);
                setIsTimeOver(false);
            }
        };

        socket.on('session-status-updated', handleSessionStatusUpdate);
        socket.on('session-ended', handleSessionEnded);

        return () => {
            socket.off('session-status-updated', handleSessionStatusUpdate);
            socket.off('session-ended', handleSessionEnded);
        };
    }, [socket, appointmentId, appointment]);

    const updateSessionStatus = useCallback(async (status: SessionStatus) => {
        if (!appointmentId) return;
        try {
            const { appointmentService } = await import('../services/appointmentService');
            await appointmentService.updateSessionStatus(appointmentId, status);
        } catch (error) {
            console.error('Failed to update session status', error);
        }
    }, [appointmentId]);

    const canSendMessage = useMemo(() => {
        if (isPostConsultationWindowOpen) return true;
        if (appointment?.TEST_NEEDED) return true;
        if (sessionStatus === SESSION_STATUS.TEST_NEEDED) return true;
        return isSessionActive(sessionStatus);
    }, [sessionStatus, isPostConsultationWindowOpen, appointment]);

    const canExtend = useMemo(() => {
        return isDoctor && canExtendSession(sessionStatus);
    }, [isDoctor, sessionStatus]);

    const isLocked = useMemo(() => {
        if (isPostConsultationWindowOpen) return false;
        if (appointment?.TEST_NEEDED) return false;
        if (sessionStatus === SESSION_STATUS.TEST_NEEDED) return false;
        return isSessionLocked(sessionStatus);
    }, [sessionStatus, isPostConsultationWindowOpen, appointment]);

    const showWaitingModal = useMemo(() => {
        return !isDoctor &&
            isTimeOver &&
            !isPostConsultationWindowOpen &&
            sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR &&
            sessionStatus !== SESSION_STATUS.ENDED;
    }, [isDoctor, isTimeOver, isPostConsultationWindowOpen, sessionStatus]);

    const showExtensionModal = useMemo(() => {
        return isDoctor &&
            isTimeOver &&
            sessionStatus === SESSION_STATUS.WAITING_FOR_DOCTOR;
    }, [isDoctor, isTimeOver, sessionStatus]);

    const showTimeWarning = useMemo(() => {
        return isTimeOver &&
            sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR &&
            sessionStatus !== SESSION_STATUS.ENDED &&
            !isPostConsultationWindowOpen;
    }, [isTimeOver, sessionStatus, isPostConsultationWindowOpen]);

    const lockedMessage = useMemo(() => {
        if (!isLocked) return undefined;

        if (sessionStatus === SESSION_STATUS.ENDED) {
            return 'This consultation has ended. No further messages can be sent.';
        }

        if (sessionStatus === SESSION_STATUS.WAITING_FOR_DOCTOR) {
            return isDoctor
                ? 'Session time expired. Please extend or end the session.'
                : 'Waiting for doctor to extend or end the session...';
        }

        return 'This session is currently locked.';
    }, [isLocked, sessionStatus, isDoctor]);

    return {
        sessionStatus,
        isTimeOver,
        extensionCount,
        isPostConsultationWindowOpen,
        updateSessionStatus,
        canSendMessage,
        canExtend,
        isLocked,
        showWaitingModal,
        showExtensionModal,
        showTimeWarning,
        lockedMessage
    };
};
