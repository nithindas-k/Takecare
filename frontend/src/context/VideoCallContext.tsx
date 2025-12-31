import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../redux/user/userSlice';
import { toast } from 'sonner';

interface VideoCallContextType {
    callAccepted: boolean;
    callEnded: boolean;
    stream: MediaStream | undefined;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    call: any;
    me: string;
    callUser: (id: string) => void;
    answerCall: () => void;
    leaveCall: () => void;
    myVideo: React.RefObject<HTMLVideoElement | null>;
    userVideo: React.RefObject<HTMLVideoElement | null>;
    isMuted: boolean;
    isCamOff: boolean;
    toggleMute: () => void;
    toggleCam: () => void;
    incomingCall: any;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const useVideoCall = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCall must be used within a VideoCallProvider');
    }
    return context;
};

// STUN servers are essential for WebRTC to work over the internet
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stream, setStream] = useState<MediaStream>();
    const [call, setCall] = useState<any>({});
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<RTCPeerConnection | null>(null);

    const { socket } = useSocket();
    const user = useSelector(selectCurrentUser);
    const me = user?.id || (user as any)?._id;

    // Ensure we join the socket room so we can be called
    useEffect(() => {
        if (socket && me) {
            console.log("VideoCallContext: Joining socket room", me);
            socket.emit("join", me);
        }
    }, [socket, me]);

    // Initialize Media Stream
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            })
            .catch((err) => {
                console.error("Failed to get media stream:", err);
                toast.error("Could not access camera/microphone");
            });
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('call-user', ({ from, name: callerName, signal }) => {
            console.log("Incoming call from:", callerName);
            setIncomingCall({ isReceivingCall: true, from, name: callerName, signal });
        });

        socket.on('call-accepted', async (signal) => {
            setCallAccepted(true);
            try {
                if (connectionRef.current) {
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                }
            } catch (error) {
                console.error("Error setting remote description:", error);
            }
        });

        socket.on('ice-candidate', async (candidate) => {
            try {
                if (connectionRef.current && candidate) {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error("Error adding ice candidate:", error);
            }
        });

        socket.on('call-ended', () => {
            setCallEnded(true);
            setCallAccepted(false);
            setIncomingCall(null);
            if (connectionRef.current) {
                connectionRef.current.close();
            }
            connectionRef.current = null;
            toast.info("Call ended");
            // Reload to clear state/connection cleanly
            window.location.reload();
        });

        return () => {
            socket.off('call-user');
            socket.off('call-accepted');
            socket.off('ice-candidate');
            socket.off('call-ended');
        };
    }, [socket]);

    const createPeerConnection = useCallback((targetId: string) => {
        const peer = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        // Handle remote stream
        peer.ontrack = (event) => {
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit("ice-candidate", {
                    to: targetId,
                    candidate: event.candidate
                });
            }
        };

        connectionRef.current = peer;
        return peer;
    }, [stream, socket]);

    const callUser = async (id: string) => {
        console.log("Attempting to call user:", id);

        if (!socket) {
            console.error("Cannot call: Socket is not initialized");
            toast.error("Connection lost. Please refresh.");
            return;
        }

        const peer = createPeerConnection(id);

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        console.log("Emitting call-user signal to:", id);
        socket.emit("call-user", {
            userToCall: id,
            signalData: offer,
            from: me,
            name: user?.name
        });
    };

    const answerCall = async () => {
        setCallAccepted(true);
        const peer = createPeerConnection(incomingCall.from);

        await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket?.emit("answer-call", {
            signal: answer,
            to: incomingCall.from
        });
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        const targetId = incomingCall?.from || call?.userToCall;
        if (targetId) {
            socket?.emit("end-call", { to: targetId });
        }
        // Force cleanup handled by component or context unmount
        // window.location.href = '/dashboard';
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleCam = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsCamOff(!isCamOff);
        }
    };

    return (
        <VideoCallContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callEnded,
            me,
            callUser,
            leaveCall,
            answerCall,
            isMuted,
            isCamOff,
            toggleMute,
            toggleCam,
            incomingCall
        }}>
            {children}
        </VideoCallContext.Provider>
    );
};
