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

const VideoCallContent: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [targetUserId, setTargetUserId] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showControls, setShowControls] = React.useState(true);
    const [callDuration, setCallDuration] = React.useState(0);

    const {
        myVideo,
        userVideo,
        callAccepted,
        callEnded,
        stream,
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

                            <button className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#1C1F24]/80 backdrop-blur-lg flex items-center justify-center text-white hover:bg-[#2A2F32] transition-colors">
                                <FaEllipsisV size={16} />
                            </button>
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
                                        leaveCall();
                                        navigate(-1);
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