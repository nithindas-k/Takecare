import { useState, useEffect, useCallback } from 'react';
import callService, { type RejoinStatus } from '../services/callService';
import { toast } from 'sonner';

export const useCallRejoin = (appointmentId: string | undefined) => {
    const [rejoinStatus, setRejoinStatus] = useState<RejoinStatus>({
        canRejoin: false,
        session: null
    });
    const [isCheckingRejoin, setIsCheckingRejoin] = useState(false);
    const [isRejoining, setIsRejoining] = useState(false);

    const checkCanRejoin = useCallback(async () => {
        if (!appointmentId) return;

        setIsCheckingRejoin(true);
        try {
            const response = await callService.getCallStatus(appointmentId);
            setRejoinStatus(response.data);

            if (response.data.canRejoin) {
                console.log('Can rejoin call:', response.data.session);
            }
        } catch (error) {
            console.error('Error checking rejoin status:', error);
            setRejoinStatus({ canRejoin: false, session: null });
        } finally {
            setIsCheckingRejoin(false);
        }
    }, [appointmentId]);

    const rejoinCall = useCallback(async () => {
        if (!appointmentId || !rejoinStatus.canRejoin) {
            toast.error('Cannot rejoin call');
            return null;
        }

        setIsRejoining(true);
        try {
            const response = await callService.rejoinCall(appointmentId);
            toast.success('Rejoined call successfully!');
            setRejoinStatus({ canRejoin: false, session: null });
            return response.data;
        } catch (error: any) {
            console.error('Error rejoining call:', error);
            toast.error(error.response?.data?.message || 'Failed to rejoin call');
            return null;
        } finally {
            setIsRejoining(false);
        }
    }, [appointmentId, rejoinStatus.canRejoin]);

    const calculateExpiresIn = useCallback(() => {
        if (!rejoinStatus.session?.canRejoinUntil) return 0;

        const expiryTime = new Date(rejoinStatus.session.canRejoinUntil).getTime();
        const now = new Date().getTime();
        const diffMs = expiryTime - now;
        const diffMinutes = Math.ceil(diffMs / 60000);

        return Math.max(0, diffMinutes);
    }, [rejoinStatus.session?.canRejoinUntil]);

    // Check rejoin status on mount
    useEffect(() => {
        checkCanRejoin();
    }, [checkCanRejoin]);

    // Auto-refresh rejoin status every 10 seconds if can rejoin
    useEffect(() => {
        if (!rejoinStatus.canRejoin) return;

        const interval = setInterval(() => {
            checkCanRejoin();
        }, 10000);

        return () => clearInterval(interval);
    }, [rejoinStatus.canRejoin, checkCanRejoin]);

    return {
        canRejoin: rejoinStatus.canRejoin,
        callSession: rejoinStatus.session,
        isCheckingRejoin,
        isRejoining,
        expiresInMinutes: calculateExpiresIn(),
        rejoinCall,
        checkCanRejoin,
    };
};
