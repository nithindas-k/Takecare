
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff,
    Video, VideoOff,
    PhoneOff,
    User, ChevronLeft,
    Maximize, Minimize,
    Settings, ScreenShare, MoreVertical, SwitchCamera,
    ClipboardList, Clock, StickyNote, Plus, BookOpen, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCallProvider, useVideoCall } from '../../context/VideoCallContext';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/user/userSlice';
import { appointmentService } from '../../services/appointmentService';
import callService from '../../services/callService';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import { useSocket } from '../../context/SocketContext';
import { toast } from 'sonner';
import { SESSION_STATUS } from '../../utils/constants';
import { useCallRejoin } from '../../hooks/useCallRejoin';
import { useAutoSaveNotes } from '../../hooks/useAutoSaveNotes';
import { AutoSaveIndicator } from '../../components/video-call/AutoSaveIndicator';
import { ReconnectingAlert } from '../../components/video-call/ReconnectingAlert';


const VideoCallContent: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        myVideo,
        userVideo,
        callAccepted,
        callEnded,
        callUser,
        answerCall,
        leaveCall,
        isMuted,
        isCamOff,
        toggleMute,
        toggleCam,
        incomingCall,
        connectionState,
        remoteStream,
        stream,
        peerConnection
    } = useVideoCall();
    const user = useSelector(selectCurrentUser) as any;

    useEffect(() => {
        if (userVideo.current && remoteStream) {
            console.log("[VIDEO_CALL] Attaching remoteStream to video element", remoteStream.getTracks().length, "tracks");
            userVideo.current.srcObject = remoteStream;

            userVideo.current.play().catch(e => console.warn("[VIDEO_CALL] Auto-play prevented:", e));
        }
    }, [remoteStream, userVideo]);

    const { socket } = useSocket();
    const isDoctor = user?.role === 'doctor';

    const [targetUserId, setTargetUserId] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showControls, setShowControls] = React.useState(true);
    const [callDuration, setCallDuration] = React.useState(0);
    const [appointment, setAppointment] = React.useState<any>(null);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [sessionStatus, setSessionStatus] = React.useState<string>("idle");
    const [isTimeOver, setIsTimeOver] = React.useState(false);
    const [extensionCount, setExtensionCount] = React.useState(0);
    const [endSessionDialogOpen, setEndSessionDialogOpen] = React.useState(false);

    const {
        canRejoin,
        isRejoining,
        rejoinCall: handleRejoinCall,
        checkCanRejoin
    } = useCallRejoin(id);


    useEffect(() => {
        if (callEnded) {

            const delays = [1000, 3000, 6000];
            const timers = delays.map((delay) =>
                setTimeout(() => {
                    console.log(`[REJOIN] Checking rejoin status (delay: ${delay}ms)`);
                    checkCanRejoin();
                }, delay)
            );
            return () => timers.forEach(clearTimeout);
        }
    }, [callEnded, checkCanRejoin]);

    // Screen share state
    const [isScreenSharing, setIsScreenSharing] = React.useState(false);
    // Track whether the remote user is sharing their screen (for object-fit)
    const [isRemoteScreenShare, setIsRemoteScreenShare] = React.useState(false);
    // Camera facing mode for flip camera
    const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');

    // Cleanup screen share when call ends
    useEffect(() => {
        if (callEnded && isScreenSharing) {
            setIsScreenSharing(false);
            if (stream && myVideo.current) {
                myVideo.current.srcObject = stream;
            }
        }
    }, [callEnded, isScreenSharing, stream, myVideo]);

    // Detect if remote video has landscape aspect ratio (screen share)
    useEffect(() => {
        if (!remoteStream) {
            setIsRemoteScreenShare(false);
            return;
        }
        const videoTrack = remoteStream.getVideoTracks()[0];
        if (!videoTrack) return;

        const checkAspect = () => {
            const settings = videoTrack.getSettings();
            if (settings.width && settings.height) {
                // Screen shares are typically wider than tall
                setIsRemoteScreenShare(settings.width > settings.height * 1.5);
            }
        };

        // Check immediately and re-check periodically (track may change dimensions)
        checkAspect();
        const interval = setInterval(checkAspect, 2000);
        return () => clearInterval(interval);
    }, [remoteStream]);

    // Auto-Save Notes Hook
    const {
        isSaving: isAutoSaving,
        formatLastSaved,
        hasUnsavedChanges,
        addNote: addAutoSavedNote
    } = useAutoSaveNotes(id);

    // Notes Panel State
    const [isNotesOpen, setIsNotesOpen] = React.useState(false);
    const [noteTitle, setNoteTitle] = React.useState("");
    const [noteDescription, setNoteDescription] = React.useState("");
    const [noteCategory, setNoteCategory] = React.useState<'observation' | 'diagnosis' | 'medicine' | 'lab_test'>("observation");
    const [noteDosage, setNoteDosage] = React.useState("");
    const [noteFrequency, setNoteFrequency] = React.useState("");
    const [noteDuration, setNoteDuration] = React.useState("");
    const [isSavingNote, setIsSavingNote] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (incomingCall?.isReceivingCall && !callAccepted) {
            if (!audioRef.current) {
                audioRef.current = new Audio('/VideoCallSound.mp3');
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(err => console.warn("Audio play failed:", err));
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current = null;
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [incomingCall, callAccepted]);

    const handleSaveNote = async () => {
        if (!id || !noteTitle.trim()) {
            toast.error("Please provide at least a title");
            return;
        }

        if (noteCategory === 'medicine') {
            if (!noteDosage.trim() || !noteFrequency.trim() || !noteDuration.trim()) {
                toast.error("Please provide dosage, frequency and duration");
                return;
            }
        } else {
            if (!noteDescription.trim()) {
                toast.error("Please provide a description");
                return;
            }
        }

        try {
            setIsSavingNote(true);
            const newNote = {
                id: Date.now().toString(),
                title: noteTitle,
                description: noteDescription,
                category: noteCategory,
                dosage: noteCategory === 'medicine' ? noteDosage : undefined,
                frequency: noteCategory === 'medicine' ? noteFrequency : undefined,
                duration: noteCategory === 'medicine' ? noteDuration : undefined,
                createdAt: new Date().toISOString()
            };

            addAutoSavedNote(newNote);

            setAppointment((prev: any) => ({
                ...prev,
                doctorNotes: [...(prev?.doctorNotes || []), newNote]
            }));


            setNoteTitle("");
            setNoteDescription("");
            setNoteDosage("");
            setNoteFrequency("");
            setNoteDuration("");

            toast.success(`${noteCategory.replace('_', ' ')} added successfully`);
        } catch (error: any) {
            toast.error(error.message || "Failed to save note");
        } finally {
            setIsSavingNote(false);
        }
    };

    const isPostConsultationWindowOpen = React.useMemo(() => {
        if (!appointment?.postConsultationChatWindow?.isActive) return false;
        const expiresAt = new Date(appointment.postConsultationChatWindow.expiresAt);
        return expiresAt > new Date();
    }, [appointment]);

    const handleEnablePostChat = async () => {
        if (!id) return;
        try {
            const res = await appointmentService.enablePostConsultationChat(id);
            if (res.success) {
                toast.success("Post-consultation chat enabled for 24 hours.");
                setAppointment((prev: any) => {
                    if (!prev) return null;
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 24);
                    return {
                        ...prev,
                        postConsultationChatWindow: {
                            isActive: true,
                            expiresAt: expiresAt.toISOString()
                        },
                        TEST_NEEDED: true
                    };
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to enable chat");
        }
    };

    const updateSessionStatus = useCallback(async (status: "ACTIVE" | "WAITING_FOR_DOCTOR" | "CONTINUED_BY_DOCTOR" | "ENDED") => {
        if (!id) return;
        try {
            await appointmentService.updateSessionStatus(id, status);
        } catch (error: any) {
            console.error("Failed to update session status", error);
            const message = error.response?.data?.message || "Failed to update session status";

            if (message.includes("Session has already ended")) {
                toast.info("Session already ended.");
                leaveCall();
                navigate(-1);
            } else {
                toast.error(message);
            }
        }
    }, [id, leaveCall, navigate]);


    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (callAccepted && !callEnded) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callAccepted, callEnded]);


    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (callAccepted && !callEnded) {
                    setShowControls(false);
                }
            }, 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [callAccepted, callEnded]);


    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!id) return;
            try {
                const response = await appointmentService.getAppointmentById(id);
                if (response.success && response.data) {
                    const apt = response.data;
                    setAppointment(apt);
                    console.log("Full Appointment Object:", apt);
                    const isDoctor = user?.role === 'doctor';

                    const getSafeId = (obj: any): string | null => {
                        if (!obj) return null;
                        if (typeof obj === 'string') return obj;
                        return obj._id || obj.id || null;
                    };

                    const patientId = getSafeId(apt.patient) || getSafeId(apt.patientId);
                    const doctorObj = apt.doctor || apt.doctorId;
                    let doctorUserId = null;
                    if (doctorObj) {
                        doctorUserId = getSafeId(doctorObj.userId) || getSafeId(doctorObj.user) || getSafeId(doctorObj);
                    }

                    if (isDoctor) {
                        setTargetUserId(patientId);
                        console.log("[VIDEO_CALL] I am Doctor, signaling to Patient (User ID):", patientId);

                        if (!apt.sessionStartTime && apt.status !== 'completed' && apt.sessionStatus !== 'ENDED') {
                            try {
                                await appointmentService.updateSessionStatus(id, "ACTIVE");
                                const doctorIdStr = getSafeId(apt.doctor) || getSafeId(apt.doctorId);
                                const patientIdStr = getSafeId(apt.patient) || getSafeId(apt.patientId);
                                if (doctorIdStr && patientIdStr) {
                                    console.log("[VIDEO_CALL] Initializing call session on backend...");
                                    await callService.startCall(id, doctorIdStr, patientIdStr);
                                    toast.success("Call session verified");
                                }
                            } catch (e) {
                                console.warn("[VIDEO_CALL] Failed to auto-start session:", e);
                            }
                        }
                    } else {
                        setTargetUserId(doctorUserId);
                        console.log("[VIDEO_CALL] I am Patient, signaling to Doctor (User ID):", doctorUserId);
                    }
                }
            } catch (error) {
                console.error("Error fetching appointment for call:", error);
            }
        };

        if (user && id) {
            fetchAppointment();
        }
    }, [id, user]);

    useEffect(() => {
        if (!appointment || appointment.status === 'completed' || sessionStatus === 'ENDED') return;

        const checkTime = () => {
            if (sessionStatus === SESSION_STATUS.CONTINUED_BY_DOCTOR || sessionStatus === SESSION_STATUS.ENDED || extensionCount > 0) {
                if (isTimeOver) setIsTimeOver(false);
                return;
            }

            const now = new Date();
            const timeStr = appointment.appointmentTime;
            if (!timeStr) return;

            const [, endTimeStr] = timeStr.split('-');
            if (!endTimeStr) return;

            const [hours, minutes] = endTimeStr.trim().split(':');
            const sessionEnd = new Date(appointment.appointmentDate);
            sessionEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (now > sessionEnd) {
                if (!isTimeOver) {
                    setIsTimeOver(true);
                    if (sessionStatus !== "WAITING_FOR_DOCTOR" && !isDoctor) {
                        updateSessionStatus(SESSION_STATUS.WAITING_FOR_DOCTOR);
                    }
                }
            } else {
                if (isTimeOver) setIsTimeOver(false);
            }
        };

        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [appointment, sessionStatus, isDoctor, isTimeOver, extensionCount, updateSessionStatus]);

    useEffect(() => {
        if (!socket || !id) return;


        socket.emit("join-chat", id);
        console.log(`Joining video call room: ${id}`);

        const onSessionStatusUpdated = (data: any) => {
            if (data.appointmentId === id || data.appointmentId === appointment?._id) {
                setSessionStatus(data.status);
                setExtensionCount(data.extensionCount || 0);
                if (data.postConsultationChatWindow) {
                    setAppointment((prev: any) => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            postConsultationChatWindow: data.postConsultationChatWindow,
                            TEST_NEEDED: data.TEST_NEEDED
                        };
                    });
                }
                if (data.status === SESSION_STATUS.ACTIVE || data.status === "CONTINUED_BY_DOCTOR") {
                    setIsTimeOver(false);
                }
            }
        };

        const onSessionEnded = (data: any) => {
            if (data.appointmentId === id || data.appointmentId === appointment?._id) {
                toast.info("Session has been ended.");
                leaveCall();
                setTimeout(() => {
                    navigate(isDoctor ? `/doctor/appointments/${id}` : `/patient/appointments/${id}`);
                }, 1500);
            }
        };

        socket.on("session-status-updated", onSessionStatusUpdated);
        socket.on("session-ended", onSessionEnded);

        return () => {
            console.log(`Leaving video call room: ${id}`);
            socket.emit("leave-chat", id);
            socket.off("session-status-updated", onSessionStatusUpdated);
            socket.off("session-ended", onSessionEnded);
        };
    }, [socket, appointment?._id, id, isDoctor, navigate, leaveCall, updateSessionStatus]);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn('[FULLSCREEN] Error toggling fullscreen:', err);
        }
    };

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleScreenShare = async () => {
        const pc = peerConnection.current;
        if (!pc) {
            console.warn('[SCREEN_SHARE] No peer connection available');
            toast.error('No active connection for screen sharing');
            return;
        }

        if (isScreenSharing) {
            
            try {
                if (stream) {
                    const camTrack = stream.getVideoTracks()[0];
                    if (camTrack) {
                        const senders = pc.getSenders();
                        const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video') ||
                            senders.find((s: RTCRtpSender) => s.track === null && s !== senders.find(a => a.track?.kind === 'audio'));
                        if (videoSender) {
                            await videoSender.replaceTrack(camTrack);
                            console.log('[SCREEN_SHARE] Restored camera track');
                        }
                        if (myVideo.current) {
                            myVideo.current.srcObject = stream;
                        }
                    }
                }
                setIsScreenSharing(false);
            } catch (err) {
                console.error('[SCREEN_SHARE] Error stopping screen share:', err);
            }
            return;
        }

        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = screenStream.getVideoTracks()[0];

            
            const senders = pc.getSenders();
            console.log('[SCREEN_SHARE] Senders:', senders.map(s => ({ kind: s.track?.kind, enabled: s.track?.enabled })));
            const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
            if (videoSender) {
                await videoSender.replaceTrack(screenTrack);
                console.log('[SCREEN_SHARE] Screen track replaced successfully');
            } else {
                console.warn('[SCREEN_SHARE] No video sender found — cannot share screen');
                screenStream.getTracks().forEach(t => t.stop());
                toast.error('Could not start screen sharing');
                return;
            }

          
            if (myVideo.current) {
                myVideo.current.srcObject = screenStream;
            }

            setIsScreenSharing(true);
            toast.success('Screen sharing started');

            screenTrack.onended = async () => {
                if (stream) {
                    const camTrack = stream.getVideoTracks()[0];
                    if (camTrack && videoSender) {
                        await videoSender.replaceTrack(camTrack);
                    }
                    if (myVideo.current) {
                        myVideo.current.srcObject = stream;
                    }
                }
                setIsScreenSharing(false);
                toast.info('Screen sharing stopped');
            };
        } catch (err: any) {
            if (err.name !== 'NotAllowedError') {
                console.error('[SCREEN_SHARE] Error:', err);
                toast.error('Failed to start screen sharing');
            }
        }
    };

    
    const handleFlipCamera = async () => {
        const newFacing = facingMode === 'user' ? 'environment' : 'user';

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { exact: newFacing } },
                audio: false
            });
            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track on peer connection
            const pc = peerConnection.current;
            if (pc) {
                const senders = pc.getSenders();
                const videoSender = senders.find((s: RTCRtpSender) => s.track?.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(newVideoTrack);
                }
            }

            // Stop old video track
            if (stream) {
                const oldVideoTrack = stream.getVideoTracks()[0];
                if (oldVideoTrack) oldVideoTrack.stop();
                // Replace track in existing stream so references stay valid
                stream.removeTrack(stream.getVideoTracks()[0]);
                stream.addTrack(newVideoTrack);
            }

            // Update local preview
            if (myVideo.current) {
                myVideo.current.srcObject = stream || newStream;
            }

            setFacingMode(newFacing);
            console.log('[FLIP_CAMERA] Switched to', newFacing);
        } catch (err: any) {
            // Device may not support rear camera
            if (err.name === 'OverconstrainedError') {
                toast.error('Rear camera not available on this device');
            } else {
                console.error('[FLIP_CAMERA] Error:', err);
                toast.error('Failed to switch camera');
            }
        }
    };

    return (
        <div className="h-[100dvh] w-screen bg-[#0B1014] overflow-hidden font-sans flex flex-col relative selection:bg-[#00A1B0]/30">


            {/* Reconnecting Alert */}
            {(connectionState === 'disconnected' || connectionState === 'failed' || connectionState === 'checking') && callAccepted && !callEnded && (
                <ReconnectingAlert
                    attempts={1} // We can enhance this later with real tracking
                    maxAttempts={5}
                />
            )}

            {/* Rejoin Call Banner removed to avoid redundancy with the central lobby button */}

            {/* Remote Video - Full Screen Background */}
            <div className="absolute inset-0 bg-[#0B1014]">
                {callAccepted && !callEnded ? (
                    <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        className={`w-full h-full transition-all duration-300 ${isRemoteScreenShare ? 'object-contain bg-black' : 'object-cover'}`}
                    />
                ) : (
                    /* Lobby Background - Simple blurred or dark */
                    <div className="w-full h-full flex items-center justify-center p-4 bg-[#0B1014]">
                        {/* Empty background, waiting for Lobby Overlay */}
                    </div>
                )}
            </div>

            {/* Incoming Call Dialog */}
            <Dialog open={!!(incomingCall?.isReceivingCall)} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md bg-[#111418]/95 backdrop-blur-3xl border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse"></div>
                            <div className="relative h-24 w-24 rounded-[2rem] bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
                                <Video size={40} className="text-emerald-500 animate-bounce" />
                            </div>
                        </div>

                        <div className="space-y-3 mb-10">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1">
                                Secure Encryption Active
                            </Badge>
                            <h2 className="text-3xl font-black text-white tracking-tight">Incoming Session</h2>
                            <p className="text-gray-400 font-medium">
                                <span className="text-[#00A1B0] font-bold">{incomingCall?.name || 'Authorized Patient'}</span> is ready to begin the consultation.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    leaveCall();
                                    navigate(-1);
                                }}
                                className="h-16 rounded-2xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 font-black uppercase tracking-widest text-xs transition-all"
                            >
                                Decline
                            </Button>
                            <Button
                                onClick={() => answerCall()}
                                className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                Accept Call
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gradient Overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10"></div>

            {/* Top Header — Glass Bar */}
            <AnimatePresence>
                {(showControls || !callAccepted) && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="absolute top-0 left-0 right-0 z-50 px-3 md:px-6 py-3 md:py-5"
                    >
                        <Card className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/30 px-4 md:px-6 py-3">
                            <div className="flex items-center justify-between gap-2">
                                {/* Back Button */}
                                <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    leaveCall();
                                                    navigate(-1);
                                                }}
                                                className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-white/70 hover:text-white transition-all duration-200 hover:scale-105"
                                            >
                                                <ChevronLeft size={18} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-[#1a1d22] text-white border-white/10 text-xs">Go Back</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {/* Center — Name + Status */}
                                <div className="flex flex-col items-center gap-1.5 min-w-0">
                                    <Badge variant="secondary" className="bg-[#00A1B0]/10 text-[#00A1B0] border border-[#00A1B0]/20 px-2.5 py-0.5 font-bold uppercase tracking-[0.15em] text-[9px] rounded-lg">
                                        {user?.role === 'doctor' ? 'Patient Session' : 'Doctor Session'}
                                    </Badge>
                                    {callAccepted && !callEnded ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 rounded-lg gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="font-mono text-xs tracking-widest">{formatDuration(callDuration)}</span>
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 px-3 py-1 rounded-lg gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider">
                                                {incomingCall?.isReceivingCall ? 'Ringing…' : 'Connecting…'}
                                            </span>
                                        </Badge>
                                    )}
                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-2">
                                    {isDoctor && sessionStatus === SESSION_STATUS.ENDED && (
                                        <div className="flex items-center gap-2">
                                            {!isPostConsultationWindowOpen ? (
                                                <Button
                                                    onClick={handleEnablePostChat}
                                                    size="sm"
                                                    className="hidden md:flex items-center gap-2 rounded-xl px-4 h-9 bg-amber-500 hover:bg-amber-400 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
                                                >
                                                    <ClipboardList className="h-3.5 w-3.5" />
                                                    Request Test
                                                </Button>
                                            ) : (
                                                <div className="hidden md:flex items-center gap-2 px-3 h-9 bg-amber-500/10 text-amber-400 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-amber-500/20 backdrop-blur-sm">
                                                    <Clock className="h-3.5 w-3.5" /> Follow-up Open
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {isDoctor && sessionStatus !== SESSION_STATUS.ENDED && (
                                        <Button
                                            onClick={() => setEndSessionDialogOpen(true)}
                                            size="sm"
                                            className="h-9 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all backdrop-blur-sm hover:scale-[1.02]"
                                        >
                                            Wind Up
                                        </Button>
                                    )}
                                    <TooltipProvider delayDuration={200}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] text-white/70 hover:text-white transition-all duration-200 hover:scale-105"
                                                >
                                                    <Settings size={18} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="bg-[#1a1d22] text-white border-white/10 text-xs">Settings</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes Toggle Button (Doctor Only) - Positioned below header */}
            {isDoctor && (
                <div className="absolute top-24 left-6 z-50">
                    <button
                        onClick={() => setIsNotesOpen(!isNotesOpen)}
                        className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 ${isNotesOpen
                            ? 'bg-[#00A1B0] text-white'
                            : 'bg-[#1C1F24]/90 text-[#8696A0] hover:text-white hover:bg-[#2A2F32]'
                            }`}
                    >
                        <StickyNote size={18} className={isNotesOpen ? 'animate-bounce' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Notes</span>
                        {appointment?.doctorNotes?.length > 0 && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#00A1B0] shadow-sm">
                                {appointment.doctorNotes.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Notes Panel (Doctor Only) */}
            <AnimatePresence>
                {isDoctor && isNotesOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-[#111418]/95 backdrop-blur-xl border-l border-white/5 z-[60] flex flex-col shadow-2xl"
                    >
                        {/* Panel Header */}
                        <div className="p-6 border-b border-white/5 bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#00A1B0]/20 flex items-center justify-center">
                                        <BookOpen size={20} className="text-[#00A1B0]" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black uppercase tracking-wider text-sm">Patient Observations</h3>
                                        <p className="text-[10px] text-[#8696A0] font-bold uppercase">Structured Notes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Auto-Save Indicator */}
                                    <AutoSaveIndicator
                                        isSaving={isAutoSaving}
                                        lastSavedText={formatLastSaved()}
                                        hasUnsavedChanges={hasUnsavedChanges}
                                    />
                                    <button
                                        onClick={() => setIsNotesOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-[#8696A0] hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notes List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {appointment?.doctorNotes && appointment.doctorNotes.length > 0 ? (
                                [...appointment.doctorNotes].reverse().map((note: any, idx: number) => (
                                    <motion.div
                                        key={note.id || idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00A1B0]/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00A1B0]"></div>
                                            <span className="text-[10px] font-black text-white tracking-widest">{note.title}</span>
                                            {note.category && note.category !== 'observation' && (
                                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[7px] font-black text-[#00A1B0] uppercase tracking-tighter">
                                                    {note.category.replace('_', ' ')}
                                                </span>
                                            )}
                                            <span className="ml-auto text-[8px] font-bold text-[#8696A0]">
                                                {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {note.category === 'medicine' ? (
                                            <div className="flex gap-2">
                                                <div className="bg-white/5 rounded px-2 py-1 text-[8px] font-bold text-[#00A1B0]">
                                                    {note.dosage}
                                                </div>
                                                <div className="bg-white/5 rounded px-2 py-1 text-[8px] font-bold text-[#00A1B0]">
                                                    {note.frequency}
                                                </div>
                                                <div className="bg-white/5 rounded px-2 py-1 text-[8px] font-bold text-[#00A1B0]">
                                                    {note.duration}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[#8696A0] font-medium leading-relaxed group-hover:text-gray-300 transition-colors whitespace-pre-wrap">
                                                {note.description}
                                            </p>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <StickyNote size={32} className="text-[#8696A0]" />
                                    </div>
                                    <p className="text-xs font-black text-[#8696A0] uppercase tracking-widest">No notes added yet</p>
                                    <p className="text-[10px] text-[#8696A0] mt-2 font-bold leading-relaxed lowercase">Add symptoms or observations below to track them during the session.</p>
                                </div>
                            )}
                        </div>

                        {/* Add New Note Input */}
                        <div className="p-6 bg-white/5 border-t border-white/5 space-y-4">
                            {/* Category Selector */}
                            <div className="flex flex-wrap gap-2">
                                {(['observation', 'diagnosis', 'medicine', 'lab_test'] as const).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setNoteCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${noteCategory === cat
                                            ? 'bg-[#00A1B0] text-white'
                                            : 'bg-white/5 text-[#8696A0] hover:bg-white/10'
                                            }`}
                                    >
                                        {cat.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <Input
                                    type="text"
                                    placeholder={
                                        noteCategory === 'medicine' ? "Medicine Name (e.g. Paracetamol)" :
                                            noteCategory === 'lab_test' ? "Test Name (e.g. Blood Test)" :
                                                noteCategory === 'diagnosis' ? "Diagnosis Title" : "Symptom / Title"
                                    }
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    className="w-full bg-[#0B1014] border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold tracking-widest transition-all"
                                />

                                {noteCategory === 'medicine' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            type="text"
                                            placeholder="Dosage"
                                            value={noteDosage}
                                            onChange={(e) => setNoteDosage(e.target.value)}
                                            className="bg-[#0B1014] border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Freq"
                                            value={noteFrequency}
                                            onChange={(e) => setNoteFrequency(e.target.value)}
                                            className="bg-[#0B1014] border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Dur"
                                            value={noteDuration}
                                            onChange={(e) => setNoteDuration(e.target.value)}
                                            className="bg-[#0B1014] border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                    </div>
                                ) : (
                                    <Textarea
                                        placeholder={
                                            noteCategory === 'lab_test' ? "Reason for test / Details" :
                                                "Observations / Description"
                                        }
                                        value={noteDescription}
                                        onChange={(e) => setNoteDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0B1014] border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-medium leading-relaxed resize-none transition-all"
                                    />
                                )}
                            </div>
                            <Button
                                onClick={handleSaveNote}
                                disabled={
                                    isSavingNote ||
                                    !noteTitle.trim() ||
                                    (noteCategory === 'medicine'
                                        ? (!noteDosage.trim() || !noteFrequency.trim() || !noteDuration.trim())
                                        : !noteDescription.trim())
                                }
                                className="w-full h-12 bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-xl font-bold uppercase tracking-wider text-xs disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isSavingNote ? (
                                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Plus size={14} /> SAVE {noteCategory.replace('_', ' ')}
                                    </div>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Local Video — Premium Floating PIP */}
            <motion.div
                drag={!!(callAccepted && !callEnded)}
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    top: callAccepted && !callEnded ? (isMobile ? 90 : 28) : "50%",
                    right: callAccepted && !callEnded ? (isMobile ? 12 : 28) : "50%",
                    x: callAccepted && !callEnded ? 0 : "50%",
                    y: callAccepted && !callEnded ? 0 : "-50%",
                    width: callAccepted && !callEnded ? (isMobile ? "100px" : "200px") : (isMobile ? "100%" : "100%"),
                    height: callAccepted && !callEnded ? (isMobile ? "140px" : "280px") : (isMobile ? "100%" : "100%"),
                    maxWidth: callAccepted && !callEnded ? "280px" : "800px",
                    maxHeight: callAccepted && !callEnded ? "380px" : "600px",
                    borderRadius: callAccepted && !callEnded ? "1rem" : "1.5rem",
                    boxShadow: callAccepted && !callEnded ? "0 20px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 161, 176, 0.15)" : "none",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 26 }}
                className={`absolute z-40 overflow-hidden bg-[#1C1F24] transition-all
                   ${callAccepted && !callEnded
                        ? 'cursor-move border-2 border-white/[0.08] shadow-2xl rounded-xl ring-1 ring-[#00A1B0]/10'
                        : 'flex flex-col items-center justify-center p-0 md:p-0 aspect-video md:aspect-auto border-none shadow-none'
                    }`}
                style={{ position: 'absolute' }}
            >
                {/* Video Element */}
                <div className={`relative w-full h-full ${!callAccepted ? 'rounded-xl overflow-hidden' : ''}`}>
                    <video
                        playsInline
                        ref={myVideo}
                        autoPlay
                        muted
                        className={`w-full h-full object-cover ${isCamOff ? 'hidden' : 'block'}`}
                    />

                    {/* Fallback Avatar */}
                    {isCamOff && (
                        <div className="w-full h-full flex items-center justify-center bg-[#1C1F24]">
                            <div className={`rounded-full bg-[#2A2F32] flex items-center justify-center ${!callAccepted ? 'w-32 h-32' : 'w-12 h-12'}`}>
                                <User className="text-[#8696A0]" size={!callAccepted ? 48 : 20} />
                            </div>
                        </div>
                    )}

                    {/* Lobby Controls Overlay — show before call starts OR after call ended */}
                    {(!callAccepted || callEnded) && (
                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-5">

                            {/* Title */}
                            <div className="text-center">
                                <h3 className="text-white text-xl md:text-2xl font-bold mb-1 tracking-tight">
                                    {callEnded
                                        ? 'Call Disconnected'
                                        : user?.role === 'doctor' ? 'Patient Consultation' : 'Doctor Consultation'
                                    }
                                </h3>
                                <p className="text-gray-400 text-xs md:text-sm font-medium">
                                    {callEnded
                                        ? 'You can rejoin the session or start a new call'
                                        : 'Check your audio and video before joining'
                                    }
                                </p>
                            </div>

                            {/* Mic/Cam Toggles */}
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={toggleMute}
                                    size="icon"
                                    variant="ghost"
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all duration-200 border ${isMuted ? 'bg-red-500/90 border-red-400/30 text-white hover:bg-red-500' : 'bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.12]'}`}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </Button>
                                <Button
                                    onClick={toggleCam}
                                    size="icon"
                                    variant="ghost"
                                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-all duration-200 border ${isCamOff ? 'bg-red-500/90 border-red-400/30 text-white hover:bg-red-500' : 'bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.12]'}`}
                                >
                                    {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </Button>
                            </div>

                            {/* Start/Rejoin Button */}
                            <div className="w-full max-w-xs">
                                {canRejoin ? (
                                    <Button
                                        onClick={async () => {
                                            const session = await handleRejoinCall();
                                            if (session) {
                                                toast.success('Rejoining call...');
                                                if (targetUserId) callUser(targetUserId, true);
                                            }
                                        }}
                                        disabled={isRejoining || !stream}
                                        className="w-full h-13 bg-amber-500 hover:bg-amber-400 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
                                    >
                                        {isRejoining ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Rejoining…
                                            </div>
                                        ) : !stream ? (
                                            "Awaiting Camera…"
                                        ) : (
                                            "Rejoin Session"
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => targetUserId && callUser(targetUserId)}
                                        disabled={!targetUserId || !stream}
                                        className="w-full h-13 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
                                    >
                                        {!targetUserId ? 'Loading…' : !stream ? 'Awaiting Camera…' : callEnded ? 'Reconnect' : 'Start Consultation'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* PIP Muted Indicator */}
                {isMuted && callAccepted && !callEnded && (
                    <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg bg-red-500/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-red-400/20">
                        <MicOff className="text-white" size={12} />
                    </div>
                )}
            </motion.div>

            {/* Bottom Control Bar — Premium Glass */}
            <AnimatePresence>
                {callAccepted && !callEnded && (
                    <motion.div
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                        className="absolute bottom-0 left-0 right-0 z-50"
                    >
                        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-6 md:pb-8 px-4 md:px-6">
                            <Card className="max-w-lg mx-auto bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 px-3 md:px-6 py-3 md:py-4">
                                <TooltipProvider delayDuration={150}>
                                    <div className="flex items-center justify-center gap-2 md:gap-4">

                                        {/* Camera Toggle */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={toggleCam}
                                                    className="group"
                                                >
                                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isCamOff
                                                        ? 'bg-red-500/90 border-red-400/30 text-white shadow-lg shadow-red-500/20'
                                                        : 'bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white'
                                                        }`}>
                                                        {isCamOff ? (
                                                            <VideoOff size={isMobile ? 18 : 20} />
                                                        ) : (
                                                            <Video size={isMobile ? 18 : 20} />
                                                        )}
                                                    </div>
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">{isCamOff ? 'Turn On Camera' : 'Turn Off Camera'}</TooltipContent>
                                        </Tooltip>

                                        {/* Microphone Toggle */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={toggleMute}
                                                    className="group"
                                                >
                                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isMuted
                                                        ? 'bg-red-500/90 border-red-400/30 text-white shadow-lg shadow-red-500/20'
                                                        : 'bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white'
                                                        }`}>
                                                        {isMuted ? (
                                                            <MicOff size={isMobile ? 18 : 20} />
                                                        ) : (
                                                            <Mic size={isMobile ? 18 : 20} />
                                                        )}
                                                    </div>
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">{isMuted ? 'Unmute' : 'Mute'}</TooltipContent>
                                        </Tooltip>

                                        {/* Screen Share */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={handleScreenShare}
                                                    className="group"
                                                >
                                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isScreenSharing
                                                        ? 'bg-primary/90 border-primary/30 text-white shadow-lg shadow-primary/20'
                                                        : 'bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white'
                                                        }`}>
                                                        <ScreenShare size={isMobile ? 18 : 20} />
                                                    </div>
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</TooltipContent>
                                        </Tooltip>

                                        {/* Flip Camera — mobile only */}
                                        {isMobile && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <motion.button
                                                        whileHover={{ scale: 1.08 }}
                                                        whileTap={{ scale: 0.92 }}
                                                        onClick={handleFlipCamera}
                                                        className="group"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 border bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white">
                                                            <SwitchCamera size={18} />
                                                        </div>
                                                    </motion.button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">Flip Camera</TooltipContent>
                                            </Tooltip>
                                        )}

                                        {/* End Call — Destructive */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => {
                                                        if (isDoctor && sessionStatus !== SESSION_STATUS.ENDED) {
                                                            setEndSessionDialogOpen(true);
                                                        } else {
                                                            leaveCall();
                                                            navigate(-1);
                                                        }
                                                    }}
                                                    className="mx-1 md:mx-2"
                                                >
                                                    <div className="w-14 h-12 md:w-[4.5rem] md:h-14 rounded-2xl bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-xl shadow-red-500/30 transition-all duration-200">
                                                        <PhoneOff size={isMobile ? 22 : 24} className="text-white" />
                                                    </div>
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-red-600 text-white border-red-500/30 text-xs font-semibold">End Call</TooltipContent>
                                        </Tooltip>

                                        {/* Fullscreen Toggle */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={toggleFullscreen}
                                                    className="hidden md:block group"
                                                >
                                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white">
                                                        {isFullscreen ? (
                                                            <Minimize size={20} />
                                                        ) : (
                                                            <Maximize size={20} />
                                                        )}
                                                    </div>
                                                </motion.button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
                                        </Tooltip>

                                        {/* More Options Dropdown */}
                                        <DropdownMenu>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DropdownMenuTrigger asChild>
                                                        <motion.button
                                                            whileHover={{ scale: 1.08 }}
                                                            whileTap={{ scale: 0.92 }}
                                                            className="group"
                                                        >
                                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/[0.12] hover:text-white">
                                                                <MoreVertical size={isMobile ? 18 : 20} />
                                                            </div>
                                                        </motion.button>
                                                    </DropdownMenuTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="bg-[#1a1d22] text-white border-white/10 text-xs">More Options</TooltipContent>
                                            </Tooltip>
                                            <DropdownMenuContent side="top" align="end" className="bg-[#1a1d22]/95 backdrop-blur-2xl border-white/10 text-white rounded-xl shadow-2xl min-w-[180px] mb-2">
                                                <DropdownMenuItem onClick={handleFlipCamera} className="gap-2 text-sm cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white">
                                                    <SwitchCamera size={16} />
                                                    Flip Camera
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem onClick={toggleFullscreen} className="gap-2 text-sm cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white">
                                                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                                                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem className="gap-2 text-sm cursor-pointer hover:bg-white/10 rounded-lg focus:bg-white/10 focus:text-white">
                                                    <Settings size={16} />
                                                    Settings
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </div>
                                </TooltipProvider>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Premium Time Over Modal for Patient */}
            <AnimatePresence>
                {isTimeOver && !isDoctor && sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR && sessionStatus !== SESSION_STATUS.ENDED && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <Card className="w-full max-w-md bg-[#111418]/95 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <div className="p-10 flex flex-col items-center text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full animate-pulse"></div>
                                    <div className="relative h-20 w-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center">
                                        <Clock className="h-10 w-10 text-amber-500" />
                                    </div>
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight mb-3">Session Limit Reached</h2>
                                <p className="text-gray-400 font-medium text-base mb-8 max-w-[280px]">
                                    The scheduled consultation time has concluded. Please wait while the doctor finalizes your records.
                                </p>

                                <div className="flex items-center gap-3 mb-10 px-6 py-2.5 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
                                    <span className="block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Awaiting Doctor's Protocol</span>
                                </div>

                                <Button
                                    onClick={() => {
                                        leaveCall();
                                        navigate(-1);
                                    }}
                                    className="w-full h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs border border-white/5 transition-all"
                                >
                                    Exit to Dashboard
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Improved Doctor Session Controls (Modal Style) when time is over */}
            <AnimatePresence>
                {isTimeOver && isDoctor && sessionStatus === SESSION_STATUS.WAITING_FOR_DOCTOR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <Card className="w-full max-w-md bg-[#111418]/95 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
                            <div className="p-8">
                                <div className="flex flex-col items-center text-center mb-10">
                                    <div className="h-16 w-16 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mb-6">
                                        <Clock className="h-8 w-8 text-amber-500" />
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Maximum Time Reached</h2>
                                    <p className="text-gray-400 font-medium max-w-[280px]">The scheduled session time has ended. How would you like to proceed?</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <Button
                                        onClick={() => updateSessionStatus(SESSION_STATUS.CONTINUED_BY_DOCTOR)}
                                        className="h-16 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-[#00A1B0]/20"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Extend Consultation
                                    </Button>
                                    <Button
                                        onClick={() => updateSessionStatus(SESSION_STATUS.ENDED)}
                                        className="h-16 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 border-white/5 font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
                                    >
                                        Conclude Session
                                    </Button>
                                </div>

                                {extensionCount > 0 && (
                                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                        <Badge variant="outline" className="bg-white/5 text-white/30 border-white/5 px-3 py-1 font-black uppercase tracking-widest text-[8px]">
                                            Session previously extended {extensionCount}x
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* End Session Confirmation Dialog for Doctor */}
            <Dialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
                <DialogContent className="sm:max-w-md bg-[#111418]/95 backdrop-blur-xl border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                    <DialogHeader className="mb-8 text-center">
                        <div className="mx-auto h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mb-6">
                            <PhoneOff className="h-8 w-8 text-red-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-white tracking-tight">End Session?</DialogTitle>
                        <DialogDescription className="text-gray-400 font-medium text-base mt-2">
                            This action will terminate the consultation for both parties. Your notes and prescriptions will be safely archived.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setEndSessionDialogOpen(false)}
                            className="h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs px-8"
                        >
                            Return To Call
                        </Button>
                        <Button
                            onClick={() => {
                                updateSessionStatus(SESSION_STATUS.ENDED);
                                setEndSessionDialogOpen(false);
                            }}
                            className="h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs px-10 shadow-xl shadow-red-500/20"
                        >
                            Conclude Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const VideoCallPage: React.FC = () => {
    return (
        <VideoCallProvider>
            <VideoCallContent />
        </VideoCallProvider>
    );
};

export default VideoCallPage;
