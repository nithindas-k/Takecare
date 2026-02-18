import { useState, useEffect, useRef } from 'react';

interface AudioLevelResult {
    level: number;       // 0–1 normalized volume
    isSpeaking: boolean; // true when level crosses threshold
}

/**
 * Analyses an audio track from a MediaStream to provide real-time
 * speaking detection and a normalised volume level.
 *
 * Uses the Web Audio AnalyserNode with a moderate polling rate (60 ms)
 * to keep CPU usage low while remaining responsive.
 */
export function useAudioLevel(
    stream: MediaStream | undefined | null,
    isActive: boolean
): AudioLevelResult {
    const [level, setLevel] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Teardown helper
        const cleanup = () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (sourceRef.current) {
                try { sourceRef.current.disconnect(); } catch { /* noop */ }
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => { /* noop */ });
            }
            audioCtxRef.current = null;
            analyserRef.current = null;
            sourceRef.current = null;
            intervalRef.current = null;
            silenceTimerRef.current = null;
            setLevel(0);
            setIsSpeaking(false);
        };

        if (!isActive || !stream) {
            cleanup();
            return;
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack || !audioTrack.enabled) {
            cleanup();
            return;
        }

        // Create audio context + analyser
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Poll at ~60 ms (≈16 fps) — low CPU but smooth enough for ring animations
        intervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);

            // Average volume across frequency bins
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(avg / 100, 1); // 0–1

            setLevel(normalized);

            if (normalized > 0.08) {
                setIsSpeaking(true);
                // Reset silence timer
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => setIsSpeaking(false), 350);
            }
        }, 60);

        return cleanup;
    }, [stream, isActive]);

    return { level, isSpeaking };
}
