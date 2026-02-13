/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff,
    Video, VideoOff,
    PhoneOff,
    User, ChevronLeft,
    Maximize, Minimize,
    MoreVertical,
    Lock, ClipboardList, Clock, StickyNote, Plus, BookOpen, X
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
        stream
    } = useVideoCall();
    const user = useSelector(selectCurrentUser) as any;
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

    // Call Rejoin Hook
    const {
        canRejoin,
        isRejoining,
        rejoinCall: handleRejoinCall
    } = useCallRejoin(id);

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
                        console.log("I am Doctor, calling Patient:", patientId);


                        if (!apt.sessionStartTime && apt.status !== 'completed' && apt.sessionStatus !== 'ENDED') {
                            try {
                                await appointmentService.updateSessionStatus(id, "ACTIVE");

                                // Start the persistent call session
                                const doctorIdStr = getSafeId(apt.doctor) || getSafeId(apt.doctorId);
                                const patientIdStr = getSafeId(apt.patient) || getSafeId(apt.patientId);

                                if (doctorIdStr && patientIdStr) {
                                    await callService.startCall(id, doctorIdStr, patientIdStr);
                                    toast.success("Call session verified");
                                }
                            } catch (e) {
                                console.warn("Failed to auto-start session (might already be active)", e);
                            }
                        }
                    } else {
                        // Patient logic
                        setTargetUserId(doctorUserId);
                        console.log("I am Patient, calling Doctor (User ID):", doctorUserId);
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

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
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
                        className="w-full h-full object-cover"
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
                <DialogContent className="sm:max-w-[400px] bg-[#1C1F24] border-gray-800 p-0 overflow-hidden gap-0">
                    <div className="flex flex-col items-center justify-center p-8 bg-[#1C1F24]">
                        <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                            <Video size={32} className="text-emerald-500" />
                        </div>
                        <DialogHeader className="mb-2 space-y-2">
                            <DialogTitle className="text-center text-xl text-white font-semibold">Incoming Call</DialogTitle>
                            <DialogDescription className="text-center text-gray-400 text-base">
                                <span className="font-medium text-white">{incomingCall?.name || 'Someone'}</span> is requesting a video consultation.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-gray-800 border-t border-gray-800">
                        <button
                            onClick={() => {
                                leaveCall();
                                navigate(-1);
                            }}
                            className="flex items-center justify-center p-4 hover:bg-gray-800/50 transition-colors text-red-500 font-medium bg-[#1C1F24]"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => answerCall()}
                            className="flex items-center justify-center p-4 hover:bg-gray-800/50 transition-colors text-emerald-500 font-bold bg-[#1C1F24]"
                        >
                            Accept
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gradient Overlay for better readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10"></div>

            {/* Top Header */}
            <AnimatePresence>
                {(showControls || !callAccepted) && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 md:py-6"
                    >
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => {
                                    leaveCall();
                                    navigate(-1);
                                }}
                                className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1C1F24]/80 backdrop-blur-lg flex items-center justify-center text-white hover:bg-[#2A2F32] transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex flex-col items-center">
                                <h2 className="text-white font-medium text-base md:text-lg mb-1">
                                    {user?.role === 'doctor' ? 'Patient' : 'Doctor'}
                                </h2>
                                {callAccepted && !callEnded ? (
                                    <div className="flex items-center gap-2 text-[#8696A0] text-sm">
                                        <div className="w-2 h-2 rounded-full bg-[#25D366]"></div>
                                        <span>{formatDuration(callDuration)}</span>
                                    </div>
                                ) : (
                                    <span className="text-[#8696A0] text-sm">
                                        {incomingCall?.isReceivingCall ? 'Ringing...' : 'Connecting...'}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {isDoctor && sessionStatus === SESSION_STATUS.ENDED && (
                                    <div className="flex items-center gap-2">
                                        {!isPostConsultationWindowOpen ? (
                                            <Button
                                                onClick={handleEnablePostChat}
                                                size="sm"
                                                className="hidden md:flex items-center gap-2 rounded-xl px-4 h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] tracking-widest"
                                            >
                                                <ClipboardList className="h-4 w-4" />
                                                Request Test Result
                                            </Button>
                                        ) : (
                                            <div className="hidden md:flex items-center gap-2 px-4 h-9 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                                                <Clock className="h-3.5 w-3.5" /> Follow-up Open
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isDoctor && sessionStatus !== SESSION_STATUS.ENDED && (
                                    <Button
                                        onClick={() => setEndSessionDialogOpen(true)}
                                        className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all"
                                    >
                                        Wind Up
                                    </Button>
                                )}
                                <button className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1C1F24]/80 backdrop-blur-lg flex items-center justify-center text-white hover:bg-[#2A2F32] transition-colors">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>
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
                                <input
                                    type="text"
                                    placeholder={
                                        noteCategory === 'medicine' ? "Medicine Name (e.g. Paracetamol)" :
                                            noteCategory === 'lab_test' ? "Test Name (e.g. Blood Test)" :
                                                noteCategory === 'diagnosis' ? "Diagnosis Title" : "Symptom / Title"
                                    }
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    className="w-full bg-[#0B1014] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold tracking-widest transition-all"
                                />

                                {noteCategory === 'medicine' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Dosage"
                                            value={noteDosage}
                                            onChange={(e) => setNoteDosage(e.target.value)}
                                            className="bg-[#0B1014] border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Freq"
                                            value={noteFrequency}
                                            onChange={(e) => setNoteFrequency(e.target.value)}
                                            className="bg-[#0B1014] border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dur"
                                            value={noteDuration}
                                            onChange={(e) => setNoteDuration(e.target.value)}
                                            className="bg-[#0B1014] border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-bold transition-all"
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        placeholder={
                                            noteCategory === 'lab_test' ? "Reason for test / Details" :
                                                "Observations / Description"
                                        }
                                        value={noteDescription}
                                        onChange={(e) => setNoteDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0B1014] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-[#00A1B0]/50 outline-none font-medium leading-relaxed resize-none transition-all"
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

            {/* Local Video - Floating Picture in Picture OR Lobby View */}
            <motion.div
                drag={!!(callAccepted && !callEnded)}
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    top: callAccepted && !callEnded ? (isMobile ? 80 : 32) : "50%",
                    right: callAccepted && !callEnded ? (isMobile ? 16 : 32) : "50%",
                    x: callAccepted && !callEnded ? 0 : "50%",
                    y: callAccepted && !callEnded ? 0 : "-50%",
                    width: callAccepted && !callEnded ? (isMobile ? "110px" : "220px") : (isMobile ? "100%" : "100%"), // Larger PIP on desktop
                    height: callAccepted && !callEnded ? (isMobile ? "160px" : "320px") : (isMobile ? "100%" : "100%"),
                    maxWidth: callAccepted && !callEnded ? "300px" : "800px",
                    maxHeight: callAccepted && !callEnded ? "400px" : "600px",
                    borderRadius: callAccepted && !callEnded ? "1.5rem" : "2rem",
                    boxShadow: callAccepted && !callEnded ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "none",
                }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
                className={`absolute z-40 overflow-hidden bg-[#1C1F24] transition-all
                   ${callAccepted && !callEnded
                        ? 'cursor-move border border-white/10 shadow-xl rounded-xl'
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

                    {/* Lobby Controls Overlay */}
                    {!callAccepted && !callEnded && (
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-6">

                            {/* Title */}
                            <div className="text-center">
                                <h3 className="text-white text-2xl font-bold mb-1">
                                    {user?.role === 'doctor' ? 'Patient Consultation' : 'Doctor Consultation'}
                                </h3>
                                <p className="text-[#8696A0] text-sm">Check your audio and video before joining</p>
                            </div>

                            {/* Mic/Cam Toggles */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleMute}
                                    className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-[#DC3545] text-white' : 'bg-[#2A2F32] text-white hover:bg-[#32383c]'}`}
                                >
                                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <button
                                    onClick={toggleCam}
                                    className={`p-4 rounded-full transition-colors ${isCamOff ? 'bg-[#DC3545] text-white' : 'bg-[#2A2F32] text-white hover:bg-[#32383c]'}`}
                                >
                                    {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
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
                                        className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-lg"
                                    >
                                        {isRejoining ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Rejoining...
                                            </div>
                                        ) : !stream ? (
                                            "Awaiting Camera..."
                                        ) : (
                                            "Rejoin Session"
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => targetUserId && callUser(targetUserId)}
                                        disabled={!targetUserId || !stream}
                                        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-lg"
                                    >
                                        {!targetUserId ? 'Loading...' : !stream ? 'Awaiting Camera...' : 'Start Consultation'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* PIP Muted Indicator (Only in Call) */}
                {isMuted && callAccepted && !callEnded && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#DC3545] flex items-center justify-center">
                        <MicOff className="text-white" size={11} />
                    </div>
                )}
            </motion.div>

            {/* Bottom Control Bar - Only for Active Calls */}
            <AnimatePresence>
                {callAccepted && !callEnded && (
                    <motion.div
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        className="absolute bottom-0 left-0 right-0 z-50"
                    >
                        {/* Main Controls - Responsive */}
                        <div className="bg-gradient-to-t from-[#0B1014] via-[#0B1014]/90 to-transparent pt-16 pb-8 px-6">
                            <div className="flex items-center justify-center gap-4 md:gap-8 max-w-screen-md mx-auto">

                                {/* Camera Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleCam}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 ${isCamOff
                                        ? 'bg-[#DC3545] text-white'
                                        : 'bg-[#2A2F32] group-hover:bg-[#3A3F42] text-white'
                                        }`}>
                                        {isCamOff ? (
                                            <VideoOff size={isMobile ? 20 : 24} />
                                        ) : (
                                            <Video size={isMobile ? 20 : 24} />
                                        )}
                                    </div>
                                    <span className="text-[#8696A0] text-[10px] md:text-xs font-medium">Camera</span>
                                </motion.button>

                                {/* Microphone Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleMute}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-200 border border-white/5 ${isMuted
                                        ? 'bg-[#DC3545] text-white'
                                        : 'bg-[#2A2F32] group-hover:bg-[#3A3F42] text-white'
                                        }`}>
                                        {isMuted ? (
                                            <MicOff size={isMobile ? 20 : 24} />
                                        ) : (
                                            <Mic size={isMobile ? 20 : 24} />
                                        )}
                                    </div>
                                    <span className="text-[#8696A0] text-[10px] md:text-xs font-medium">Mic</span>
                                </motion.button>

                                {/* End Call - Larger */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (isDoctor && sessionStatus !== SESSION_STATUS.ENDED) {
                                            setEndSessionDialogOpen(true);
                                        } else {
                                            leaveCall();
                                            navigate(-1);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 mx-2 md:mx-4"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-[#DC3545] hover:bg-[#C82333] flex items-center justify-center shadow-lg transition-all">
                                        <PhoneOff size={isMobile ? 28 : 32} className="text-white transform rotate-0" />
                                    </div>
                                    <span className="text-[#DC3545] text-[10px] md:text-xs font-bold uppercase mt-1">End Call</span>
                                </motion.button>

                                {/* Fullscreen Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleFullscreen}
                                    className="hidden md:flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#2A2F32] flex items-center justify-center border border-white/5 group-hover:bg-[#3A3F42] transition-all">
                                        {isFullscreen ? (
                                            <Minimize size={20} className="text-white" />
                                        ) : (
                                            <Maximize size={20} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-[#8696A0] text-xs font-medium">Screen</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Time Over Modal for Patient */}
            <AnimatePresence>
                {isTimeOver && !isDoctor && sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR && sessionStatus !== SESSION_STATUS.ENDED && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-sm bg-[#1C1F24] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="h-6 w-6 text-amber-500" />
                                </div>
                                <h2 className="text-lg font-semibold text-white mb-2">Session Time Over</h2>
                                <p className="text-sm text-gray-400 mb-6">
                                    Your appointment time is over. Please wait for the doctor's response.
                                </p>

                                <div className="flex items-center gap-2 mb-6 px-3 py-1.5 bg-gray-800/50 rounded-full">
                                    <span className="block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-xs font-medium text-gray-300">Waiting for Doctor...</span>
                                </div>

                                <Button
                                    onClick={() => {
                                        leaveCall();
                                        navigate(-1);
                                    }}
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Back to Dashboard
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Improved Doctor Session Controls (Modal Style) when time is over */}
            <AnimatePresence>
                {isTimeOver && isDoctor && sessionStatus === SESSION_STATUS.WAITING_FOR_DOCTOR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-md bg-[#1C1F24] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="h-10 w-10 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
                                        <Clock className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Session Completed</h2>
                                        <p className="text-sm text-gray-400">The appointment time has ended. The patient is waiting for you to extend or end the session.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => updateSessionStatus(SESSION_STATUS.CONTINUED_BY_DOCTOR)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        Extend Session
                                    </Button>
                                    <Button
                                        onClick={() => updateSessionStatus(SESSION_STATUS.ENDED)}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        End Session
                                    </Button>
                                </div>

                                {extensionCount > 0 && (
                                    <p className="mt-4 text-center text-xs text-gray-500">
                                        Previously extended {extensionCount} times
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* End Session Confirmation Dialog for Doctor */}
            <Dialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-[#1C1F24] border-gray-800 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-white">End Consultation?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            This will end the video call for everyone. You can still access notes and prescriptions later.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-3 sm:justify-end mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setEndSessionDialogOpen(false)}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                updateSessionStatus(SESSION_STATUS.ENDED);
                                setEndSessionDialogOpen(false);
                            }}
                            variant="destructive"
                        >
                            End Consultation
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
