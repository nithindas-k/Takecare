import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface ReconnectionState {
    isReconnecting: boolean;
    attempts: number;
    maxAttempts: number;
}

export const useCallReconnection = (
    peerConnection: RTCPeerConnection | null,
    onReconnectSuccess?: () => void,
    onReconnectFailed?: () => void
) => {
    const [reconnectionState, setReconnectionState] = useState<ReconnectionState>({
        isReconnecting: false,
        attempts: 0,
        maxAttempts: 6, // 30 seconds (5s intervals)
    });

    const reconnectIntervalRef = useRef<NodeJS.Timeout>(undefined);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);

    const startReconnection = useCallback(() => {
        if (reconnectionState.isReconnecting) return;

        console.log('Starting reconnection process...');
        setReconnectionState(prev => ({
            ...prev,
            isReconnecting: true,
            attempts: 0
        }));

        let currentAttempt = 0;

        reconnectIntervalRef.current = setInterval(() => {
            currentAttempt++;
            setReconnectionState(prev => ({
                ...prev,
                attempts: currentAttempt
            }));

            console.log(`Reconnection attempt ${currentAttempt}/${reconnectionState.maxAttempts}`);

            if (currentAttempt >= reconnectionState.maxAttempts) {
                stopReconnection();
                toast.error('Unable to reconnect. Please rejoin the call.');
                onReconnectFailed?.();
            }
        }, 5000); // Every 5 seconds

        // Total timeout: 30 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
            stopReconnection();
            toast.error('Connection timeout. Please rejoin the call.');
            onReconnectFailed?.();
        }, 30000);
    }, [reconnectionState.isReconnecting, reconnectionState.maxAttempts, onReconnectFailed]);

    const stopReconnection = useCallback(() => {
        if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        setReconnectionState(prev => ({
            ...prev,
            isReconnecting: false,
            attempts: 0
        }));
    }, []);

    const handleReconnectSuccess = useCallback(() => {
        console.log('Reconnection successful!');
        stopReconnection();
        toast.success('Connection restored!');
        onReconnectSuccess?.();
    }, [stopReconnection, onReconnectSuccess]);

    // Monitor peer connection state
    useEffect(() => {
        if (!peerConnection) return;

        const handleConnectionStateChange = () => {
            const state = peerConnection.iceConnectionState;
            console.log('ICE Connection State:', state);

            switch (state) {
                case 'disconnected':
                case 'failed':
                    if (!reconnectionState.isReconnecting) {
                        toast.warning('Connection lost. Attempting to reconnect...');
                        startReconnection();
                    }
                    break;
                case 'connected':
                case 'completed':
                    if (reconnectionState.isReconnecting) {
                        handleReconnectSuccess();
                    }
                    break;
                case 'closed':
                    stopReconnection();
                    break;
            }
        };

        peerConnection.addEventListener('iceconnectionstatechange', handleConnectionStateChange);

        return () => {
            peerConnection.removeEventListener('iceconnectionstatechange', handleConnectionStateChange);
            stopReconnection();
        };
    }, [peerConnection, reconnectionState.isReconnecting, startReconnection, stopReconnection, handleReconnectSuccess]);

    return {
        reconnectionState,
        startReconnection,
        stopReconnection,
    };
};
