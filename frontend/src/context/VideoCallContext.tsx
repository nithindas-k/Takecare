/* eslint-disable @typescript-eslint/no-explicit-any */
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
    callUser: (id: string, isRejoin?: boolean) => void;
    answerCall: (incomingData?: any) => void;
    leaveCall: () => void;
    myVideo: React.RefObject<HTMLVideoElement | null>;
    userVideo: React.RefObject<HTMLVideoElement | null>;
    isMuted: boolean;
    isCamOff: boolean;
    toggleMute: () => void;
    toggleCam: () => void;
    incomingCall: any;
    connectionState: RTCIceConnectionState;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);


export const useVideoCall = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCall must be used within a VideoCallProvider');
    }
    return context;
};


const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Adding open-relay servers for better connectivity in restricted environments
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stream, setStream] = useState<MediaStream>();
    const [call] = useState<any>({});
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [targetUserId, setTargetUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [connectionState, setConnectionState] = useState<RTCIceConnectionState>('new');

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<RTCPeerConnection | null>(null);
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

    const { socket } = useSocket();
    const user = useSelector(selectCurrentUser);
    const me = user?.id || (user as any)?._id;


    useEffect(() => {
        if (socket && me) {
            console.log("VideoCallContext: Joining socket room", me);
            socket.emit("join", me);
        }
    }, [socket, me]);

    useEffect(() => {
        let currentStream: MediaStream | null = null;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((s) => {
                currentStream = s;
                setStream(s);
                if (myVideo.current) {
                    myVideo.current.srcObject = s;
                }
            })
            .catch((err) => {
                console.error("Failed to get media stream:", err);
                toast.error("Could not access camera/microphone");
            });

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const createPeerConnection = useCallback((targetId: string) => {
        // CLEANUP: Close existing connection if it exists
        if (connectionRef.current) {
            console.log("Closing existing peer connection before creating new one");
            connectionRef.current.close();
            connectionRef.current = null;
        }

        const peer = new RTCPeerConnection(ICE_SERVERS);

        if (stream) {
            console.log("Adding tracks to peer connection from stream:", stream.id);
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        } else {
            console.warn("createPeerConnection: stream is not available yet!");
        }


        peer.ontrack = (event) => {
            console.log("Received remote track:", event.streams[0].id);
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("ICE Connection State Change:", peer.iceConnectionState);
            setConnectionState(peer.iceConnectionState);
        };


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

    const processIceQueue = useCallback(async () => {
        if (!connectionRef.current || !connectionRef.current.remoteDescription) return;

        console.log(`Processing ${iceCandidatesQueue.current.length} queued ICE candidates`);
        while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) {
                try {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding queued ice candidate:", e);
                }
            }
        }
    }, []);

    const callUser = async (id: string, isRejoin: boolean = false) => {
        console.log(`Attempting to call user: ${id}${isRejoin ? ' (REJOIN)' : ''}`);
        setCallEnded(false);
        setCallAccepted(false);

        if (!socket) {
            console.error("Cannot call: Socket is not initialized");
            toast.error("Connection lost. Please refresh.");
            return;
        }

        const peer = createPeerConnection(id);
        setTargetUserId(id);

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        console.log("Emitting call-user signal to:", id);
        socket.emit("call-user", {
            userToCall: id,
            signalData: offer,
            from: me,
            name: user?.name,
            isRejoin
        });
    };

    const answerCall = useCallback(async (incomingData?: any) => {
        setCallEnded(false);
        setCallAccepted(true);
        // Ensure we don't use React events as call data
        const isEvent = incomingData && (incomingData.nativeEvent || incomingData.target);
        const callToAnswer = (incomingData && !isEvent) ? incomingData : incomingCall;

        if (!callToAnswer) {
            console.error("answerCall: No call data available");
            return;
        }

        setIncomingCall(null);
        setTargetUserId(callToAnswer.from);

        const peer = createPeerConnection(callToAnswer.from);

        await peer.setRemoteDescription(new RTCSessionDescription(callToAnswer.signal));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket?.emit("answer-call", {
            signal: answer,
            to: callToAnswer.from
        });

        // Now that remote description is set, process any queued candidates
        processIceQueue();
    }, [incomingCall, createPeerConnection, socket, processIceQueue]);

    const leaveCall = () => {
        setCallEnded(true);
        console.log("leaveCall: Call ended triggered");

        if (connectionRef.current) {
            console.log("leaveCall: Closing peer connection");
            connectionRef.current.close();
            connectionRef.current = null;
        }

        const tId = incomingCall?.from || targetUserId;
        console.log("leaveCall: Emitting end-call to:", tId);

        if (tId) {
            socket?.emit("end-call", { to: tId });
        }
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

    useEffect(() => {
        if (!socket) return;

        socket.on('call-user', ({ from, name: callerName, signal, isRejoin }) => {
            console.log("Incoming call from:", callerName, "isRejoin:", isRejoin);
            const callData = { isReceivingCall: true, from, name: callerName, signal, isRejoin };
            setIncomingCall(callData);
        });

        socket.on('call-accepted', async (signal) => {
            console.log("Call accepted, setting remote description");
            setCallAccepted(true);
            try {
                if (connectionRef.current) {
                    await connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                    // Process any candidates that arrived while we were waiting for the answer
                    processIceQueue();
                }
            } catch (error) {
                console.error("Error setting remote description:", error);
            }
        });

        socket.on('ice-candidate', async (candidate) => {
            if (!candidate) return;

            if (connectionRef.current && connectionRef.current.remoteDescription) {
                try {
                    await connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error("Error adding ice candidate:", error);
                }
            } else {
                console.log("Queuing ICE candidate (PC or RemoteDesc not ready)");
                iceCandidatesQueue.current.push(candidate);
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
        });

        return () => {
            socket.off('call-user');
            socket.off('call-accepted');
            socket.off('ice-candidate');
            socket.off('call-ended');
        };
    }, [socket, answerCall]);

    // Better Rejoin Auto-Answer Logic: Wait for BOTH call data AND stream to be ready
    useEffect(() => {
        if (incomingCall?.isRejoin && stream && socket) {
            console.log("Auto-answering rejoin call (Stream & Socket ready)...");
            answerCall(incomingCall);
        }
    }, [incomingCall, stream, socket, answerCall]);

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
            incomingCall,
            connectionState
        }}>
            {children}
        </VideoCallContext.Provider>
    );
};
