import { useState, useEffect, useRef } from 'react';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface NetworkStats {
    quality: NetworkQuality;
    rtt: number | null;
    packetLoss: number | null;
    jitter: number | null;
}

/**
 * Polls WebRTC stats to derive network quality.
 * Returns quality level, RTT (ms), packet loss (%), and jitter (ms).
 */
export function useNetworkQuality(
    peerConnection: React.RefObject<RTCPeerConnection | null>,
    isActive: boolean
): NetworkStats {
    const [stats, setStats] = useState<NetworkStats>({
        quality: 'unknown',
        rtt: null,
        packetLoss: null,
        jitter: null,
    });

    const prevPacketsReceived = useRef(0);
    const prevPacketsLost = useRef(0);

    useEffect(() => {
        if (!isActive) {
            setStats({ quality: 'unknown', rtt: null, packetLoss: null, jitter: null });
            prevPacketsReceived.current = 0;
            prevPacketsLost.current = 0;
            return;
        }

        const interval = setInterval(async () => {
            const pc = peerConnection.current;
            if (!pc || pc.connectionState === 'closed') return;

            try {
                const report = await pc.getStats();
                let rtt: number | null = null;
                let jitter: number | null = null;
                let packetsReceived = 0;
                let packetsLost = 0;

                report.forEach((entry) => {
                    // Get RTT from the active candidate pair
                    if (entry.type === 'candidate-pair' && entry.state === 'succeeded') {
                        if (entry.currentRoundTripTime != null) {
                            rtt = Math.round(entry.currentRoundTripTime * 1000); // seconds → ms
                        }
                    }

                    // Get jitter + packets from inbound video RTP
                    if (entry.type === 'inbound-rtp' && entry.kind === 'video') {
                        if (entry.jitter != null) {
                            jitter = Math.round(entry.jitter * 1000); // seconds → ms
                        }
                        packetsReceived = entry.packetsReceived ?? 0;
                        packetsLost = entry.packetsLost ?? 0;
                    }
                });

                // Calculate incremental packet loss %
                const deltaReceived = packetsReceived - prevPacketsReceived.current;
                const deltaLost = packetsLost - prevPacketsLost.current;
                const deltaTotal = deltaReceived + deltaLost;
                const packetLossRate = deltaTotal > 0 ? (deltaLost / deltaTotal) * 100 : 0;

                prevPacketsReceived.current = packetsReceived;
                prevPacketsLost.current = packetsLost;

                // Derive quality
                let quality: NetworkQuality = 'excellent';
                if (rtt !== null) {
                    if (rtt > 300 || packetLossRate > 5) quality = 'poor';
                    else if (rtt > 150 || packetLossRate > 2) quality = 'fair';
                    else if (rtt > 80 || packetLossRate > 0.5) quality = 'good';
                }

                setStats({
                    quality,
                    rtt,
                    packetLoss: Math.round(packetLossRate * 10) / 10,
                    jitter,
                });
            } catch {
                // peer connection may be closing — ignore
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [peerConnection, isActive]);

    return stats;
}
