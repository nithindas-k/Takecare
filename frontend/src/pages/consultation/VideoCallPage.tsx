import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaMicrophone, FaMicrophoneSlash,
    FaVideo, FaVideoSlash,
    FaPhoneSlash,
    FaUser, FaChevronLeft,
    FaExpand, FaCompress,
    FaEllipsisV
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCallProvider, useVideoCall } from '../../context/VideoCallContext';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/user/userSlice';
import { appointmentService } from '../../services/appointmentService';
import { Button } from '../../components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
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
import { Lock, ClipboardList, Clock } from 'lucide-react';

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
        incomingCall
    } = useVideoCall();
    const user = useSelector(selectCurrentUser) as any;
    const { socket } = useSocket();
    const isDoctor = user?.role === 'doctor';

    const [targetUserId, setTargetUserId] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showControls, setShowControls] = React.useState(true);
    const [callDuration, setCallDuration] = React.useState(0);
    const [appointment, setAppointment] = React.useState<any>(null);

    const [sessionStatus, setSessionStatus] = React.useState<string>("idle");
    const [isTimeOver, setIsTimeOver] = React.useState(false);
    const [extensionCount, setExtensionCount] = React.useState(0);
    const [endSessionDialogOpen, setEndSessionDialogOpen] = React.useState(false);

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
                        }
                    };
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to enable chat");
        }
    };

    const updateSessionStatus = async (status: "ACTIVE" | "WAITING_FOR_DOCTOR" | "CONTINUED_BY_DOCTOR" | "ENDED") => {
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
    };

    // Call duration timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (callAccepted && !callEnded) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callAccepted, callEnded]);

    // Auto-hide controls after inactivity
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

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch appointment details
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

                        // Automatically set to ACTIVE if doctor starts first time and session is not ended
                        if (!apt.sessionStartTime && apt.status !== 'completed' && apt.sessionStatus !== 'ENDED') {
                            try {
                                await appointmentService.updateSessionStatus(id, "ACTIVE");
                            } catch (e) {
                                console.warn("Failed to auto-start session (might already be active)", e);
                            }
                        }
                    } else {
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
            if (sessionStatus === "CONTINUED_BY_DOCTOR" || sessionStatus === "ENDED" || extensionCount > 0) {
                if (isTimeOver) setIsTimeOver(false);
                return;
            }

            const now = new Date();
            const timeStr = appointment.appointmentTime;
            if (!timeStr) return;

            const [_, endTimeStr] = timeStr.split('-');
            if (!endTimeStr) return;

            const [hours, minutes] = endTimeStr.trim().split(':');
            const sessionEnd = new Date(appointment.appointmentDate);
            sessionEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (now > sessionEnd) {
                if (!isTimeOver) {
                    setIsTimeOver(true);
                    if (sessionStatus !== "WAITING_FOR_DOCTOR" && !isDoctor) {
                        updateSessionStatus("WAITING_FOR_DOCTOR");
                    }
                }
            } else {
                if (isTimeOver) setIsTimeOver(false);
            }
        };

        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [appointment, sessionStatus, isDoctor, isTimeOver, extensionCount]);

    useEffect(() => {
        if (!socket || !id) return;

        // Join the appointment-specific room
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
                            postConsultationChatWindow: data.postConsultationChatWindow
                        };
                    });
                }
                if (data.status === "ACTIVE" || data.status === "CONTINUED_BY_DOCTOR") {
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
    }, [socket, appointment?._id, id, isDoctor, navigate, leaveCall]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className="h-screen w-screen bg-[#0B1014] overflow-hidden font-sans flex flex-col relative">

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
                    <div className="w-full h-full flex items-center justify-center p-4">
                        {!incomingCall?.isReceivingCall && (
                            <Card className="w-full max-w-md bg-[#1C1F24] border-[#2A2F32] text-white backdrop-blur-sm">
                                <CardHeader className="text-center">
                                    <div className="mx-auto w-20 h-20 rounded-full bg-[#2A2F32] flex items-center justify-center mb-4">
                                        <FaUser className="text-[#8696A0]" size={32} />
                                    </div>
                                    <CardTitle className="text-xl md:text-2xl">
                                        {user?.role === 'doctor' ? 'Patient Consultation' : 'Doctor Consultation'}
                                    </CardTitle>
                                    <CardDescription className="text-[#8696A0]">
                                        Ready to start the video session?
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="flex justify-center pb-8">
                                    <Button
                                        onClick={() => targetUserId && callUser(targetUserId)}
                                        disabled={!targetUserId}
                                        className="w-full max-w-xs bg-[#00A1B0] hover:bg-[#008f9d] text-white font-semibold py-6 rounded-xl text-lg transition-all"
                                    >
                                        {targetUserId ? 'Start Consultation' : 'Loading...'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Incoming Call Dialog */}
            <Dialog open={!!(incomingCall?.isReceivingCall && !callAccepted)} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md bg-[#1C1F24] border-[#2A2F32] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Incoming Call</DialogTitle>
                        <DialogDescription className="text-center text-[#8696A0]">
                            {incomingCall?.name || 'Someone'} is requesting a video consultation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                        <div className="w-24 h-24 rounded-full bg-[#2A2F32] flex items-center justify-center animate-pulse">
                            <FaVideo size={32} className="text-[#00A1B0]" />
                        </div>
                    </div>
                    <DialogFooter className="flex-row justify-center gap-4 sm:justify-center">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                leaveCall();
                                navigate(-1);
                            }}
                            className="px-8 py-6 rounded-xl"
                        >
                            Decline
                        </Button>
                        <Button
                            onClick={answerCall}
                            className="px-8 py-6 rounded-xl bg-[#25D366] hover:bg-[#1fae53] text-white border-none"
                        >
                            Accept Video
                        </Button>
                    </DialogFooter>
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
                                <FaChevronLeft size={18} />
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
                                {isDoctor && sessionStatus === "ENDED" && (
                                    <div className="flex items-center gap-2">
                                        {!isPostConsultationWindowOpen ? (
                                            <Button
                                                onClick={handleEnablePostChat}
                                                size="sm"
                                                className="hidden md:flex items-center gap-2 rounded-xl px-4 h-9 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20"
                                            >
                                                <ClipboardList className="h-4 w-4" />
                                                Request Test Result
                                            </Button>
                                        ) : (
                                            <div className="hidden md:flex items-center gap-2 px-4 h-9 bg-amber-50/10 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                <Clock className="h-3.5 w-3.5" /> Follow-up Open
                                            </div>
                                        )}
                                    </div>
                                )}
                                {isDoctor && sessionStatus !== "ENDED" && (
                                    <Button
                                        onClick={() => setEndSessionDialogOpen(true)}
                                        className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Wind Up
                                    </Button>
                                )}
                                <button className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1C1F24]/80 backdrop-blur-lg flex items-center justify-center text-white hover:bg-[#2A2F32] transition-colors">
                                    <FaEllipsisV size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Local Video - Floating Picture in Picture */}
            <motion.div
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-20 right-4 md:top-24 md:right-6 w-24 h-32 md:w-32 md:h-44 lg:w-36 lg:h-48 bg-[#1C1F24] rounded-2xl overflow-hidden z-40 cursor-move border-2 border-[#2A2F32] shadow-2xl"
            >
                <video
                    playsInline
                    ref={myVideo}
                    autoPlay
                    muted
                    className={`w-full h-full object-cover ${isCamOff ? 'hidden' : 'block'}`}
                />
                {isCamOff && (
                    <div className="w-full h-full flex items-center justify-center bg-[#1C1F24]">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#2A2F32] flex items-center justify-center">
                            <FaUser className="text-[#8696A0]" size={20} />
                        </div>
                    </div>
                )}
                {isMuted && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#DC3545] flex items-center justify-center">
                        <FaMicrophoneSlash className="text-white" size={11} />
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
                        {/* Main Controls */}
                        <div className="bg-gradient-to-t from-[#0B1014] to-transparent pt-12 pb-8 px-4">
                            <div className="flex items-center justify-center gap-6 md:gap-8">

                                {/* Camera Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleCam}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors ${isCamOff
                                        ? 'bg-[#DC3545]'
                                        : 'bg-[#2A2F32]'
                                        }`}>
                                        {isCamOff ? (
                                            <FaVideoSlash size={22} className="text-white" />
                                        ) : (
                                            <FaVideo size={22} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-white text-xs">Camera</span>
                                </motion.button>

                                {/* Microphone Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleMute}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-colors ${isMuted
                                        ? 'bg-[#DC3545]'
                                        : 'bg-[#2A2F32]'
                                        }`}>
                                        {isMuted ? (
                                            <FaMicrophoneSlash size={22} className="text-white" />
                                        ) : (
                                            <FaMicrophone size={22} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-white text-xs">Mic</span>
                                </motion.button>

                                {/* End Call */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (isDoctor && sessionStatus !== "ENDED") {
                                            setEndSessionDialogOpen(true);
                                        } else {
                                            leaveCall();
                                            navigate(-1);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-[#DC3545] flex items-center justify-center shadow-lg">
                                        <FaPhoneSlash size={26} className="text-white transform rotate-135" />
                                    </div>
                                    <span className="text-white text-xs">End</span>
                                </motion.button>

                                {/* Fullscreen Toggle */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleFullscreen}
                                    className="hidden md:flex flex-col items-center gap-2"
                                >
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#2A2F32] flex items-center justify-center">
                                        {isFullscreen ? (
                                            <FaCompress size={20} className="text-white" />
                                        ) : (
                                            <FaExpand size={20} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-white text-xs">Fullscreen</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Time Over Modal for Patient */}
            <AnimatePresence>
                {isTimeOver && !isDoctor && sessionStatus !== "CONTINUED_BY_DOCTOR" && sessionStatus !== "ENDED" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#1C1F24] border border-[#2A2F32] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Session Time Over</h2>
                            <p className="text-[#8696A0] font-bold leading-relaxed mb-8 text-xs uppercase tracking-tight">
                                Your appointment time is over. Please wait for the doctor's response.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-[#2A2F32] rounded-xl">
                                    <div className="w-2 h-2 bg-[#00A1B0] rounded-full animate-ping"></div>
                                    <p className="text-[10px] font-black text-[#8696A0] uppercase tracking-widest">
                                        Waiting for Doctor...
                                    </p>
                                </div>
                                <Button
                                    onClick={() => {
                                        leaveCall();
                                        navigate(-1);
                                    }}
                                    className="w-full bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-2xl h-14 font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Back to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Improved Doctor Session Controls (Modal Style) when time is over */}
            <AnimatePresence>
                {isTimeOver && isDoctor && sessionStatus === "WAITING_FOR_DOCTOR" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-[#1C1F24] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#2A2F32]"
                        >
                            <div className="flex items-center gap-4 mb-6 text-white">
                                <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <FaEllipsisV className="h-7 w-7 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight uppercase">Session Completed</h2>
                                    <p className="text-xs text-[#8696A0] font-bold uppercase tracking-tight">Manage appointment status</p>
                                </div>
                            </div>

                            <p className="text-[#8696A0] font-medium leading-relaxed mb-8 text-sm bg-[#0B1014] p-4 rounded-2xl border border-[#2A2F32]">
                                The appointment time has ended. You can choose to continue the session or wind it up. Patient is currently locked out.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={() => updateSessionStatus("CONTINUED_BY_DOCTOR")}
                                    className="bg-green-500 hover:bg-green-600 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-green-500/20"
                                >
                                    ✅ Continue
                                </Button>
                                <Button
                                    onClick={() => updateSessionStatus("ENDED")}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                                >
                                    ❌ Wind Up
                                </Button>
                            </div>

                            {extensionCount > 0 && (
                                <p className="mt-6 text-center text-[10px] text-[#00A1B0] font-black uppercase tracking-tighter">
                                    Previously Extended {extensionCount} Times
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* End Session Confirmation Dialog for Doctor */}
            <Dialog open={endSessionDialogOpen} onOpenChange={setEndSessionDialogOpen}>
                <DialogContent className="sm:max-w-md bg-[#1C1F24] border-[#2A2F32] text-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            🎥 End Video Consultation
                        </DialogTitle>
                        <DialogDescription className="text-[#8696A0] mt-1">
                            Are you sure you want to end this session?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-[#2A2F32]/50 p-4 rounded-xl border border-[#2A2F32]">
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Ending the session will close the video call for both you and the patient. You can still manage prescriptions and tests from the appointment details page.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setEndSessionDialogOpen(false)}
                            className="flex-1 h-12 rounded-xl text-[#8696A0] hover:text-white hover:bg-[#2A2F32]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                updateSessionStatus("ENDED");
                                setEndSessionDialogOpen(false);
                            }}
                            className="flex-1 h-12 rounded-xl text-white font-bold transition-all shadow-lg bg-red-500 hover:bg-red-600 shadow-red-500/20"
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