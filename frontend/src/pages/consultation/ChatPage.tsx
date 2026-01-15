import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Smile, MoreVertical,
    ChevronLeft, Check, CheckCheck,
    Info, Search, Plus, Camera, Paperclip, Mic, Trash2, Pause, Play,
    Menu, ArrowLeft, Lock, MessagesSquare, X, Download, ExternalLink, XCircle, Clock, ClipboardList,
    StickyNote, BookOpen
} from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import EmojiPicker from 'emoji-picker-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';
import { Skeleton } from '../../components/ui/skeleton';
import { useSocket } from '../../context/SocketContext';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/user/userSlice';
import { chatService } from '../../services/chatService';
import type { IMessage } from '../../services/chatService';
import { appointmentService } from '../../services/appointmentService';
import { toast } from 'sonner';
import { API_BASE_URL, SESSION_STATUS } from '../../utils/constants';
import type { SessionStatus } from '../../utils/constants';
import type { Area } from 'react-easy-crop';

interface Patient {
    _id: string;
    name: string;
    customId: string;
    gender: string;
    dob: string;
    bloodGroup: string;
    profileImage: string;
}

interface Doctor {
    _id: string;
    userId?: {
        name: string;
        profileImage: string;
    };
    profileImage: string;
    specialty?: string;
}

interface IDoctorNote {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

interface Appointment {
    _id: string;
    patientId?: Patient;
    doctorId?: Doctor;
    appointmentDate?: string | Date;
    appointmentTime?: string;
    status: string;
    TEST_NEEDED?: boolean;
    postConsultationChatWindow?: {
        isActive: boolean;
        expiresAt: string;
    };
    doctorNotes?: IDoctorNote[];
    patient?: any;
    customId?: string;
    sessionStatus?: SessionStatus;
    conversationId?: string;
}

interface Conversation {
    appointmentId: string;
    conversationId: string;
    realAppointmentId?: string;
    patient?: any;
    doctor?: any;
    lastMessage?: {
        content: string;
        createdAt: string;
        senderModel?: string;
    };
    isOnline?: boolean;
    unreadCount: number;
}

interface ActiveChat {
    id: string;
    name: string;
    specialty: string;
    avatar: string;
    online: boolean;
    unread: number;
}

interface Message {
    id: string | number;
    sender: 'user' | 'other';
    text: string;
    time: string;
    status: 'sent' | 'delivered' | 'read' | 'sending' | 'failed';
    type: 'text' | 'file' | 'image' | 'system' | 'audio';
    fileName?: string;
    fileSize?: string;
    isDeleted?: boolean;
    isEdited?: boolean;
}




const isAudioUrl = (url: string) => {
    return /\.(mp3|wav|ogg|webm)$/i.test(url) || url.includes('voice-note-');
};

const CustomAudioPlayer = ({ src, isUser }: { src: string, isUser: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateDuration = () => {
            if (audio.duration && !isNaN(audio.duration)) {
                setDuration(audio.duration);
            }
        };

        const updateTime = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', onEnded);

        if (audio.readyState >= 1) {
            updateDuration();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };


    const bars = React.useMemo(() => Array.from({ length: 28 }, () => Math.floor(Math.random() * 8) + 2), []);

    return (
        <div className={`flex items-center gap-3 min-w-[240px] p-2 rounded-2xl transition-all select-none ${isUser
            ? ''
            : 'bg-white border border-slate-100 shadow-sm'
            }`}>
            <button
                onClick={togglePlay}
                className={`flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all active:scale-95 ${isUser
                    ? 'bg-white text-[#00A1B0] hover:bg-white/90'
                    : 'bg-[#00A1B0] text-white hover:bg-[#008f9c] hover:shadow-md hover:shadow-[#00A1B0]/20'
                    }`}
            >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-1" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                {/* Visualizer & Progress Track */}
                <div
                    className="h-6 flex items-center gap-0.5 cursor-pointer relative group"
                    onClick={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        const percent = Math.min(1, Math.max(0, (e.clientX - bounds.left) / bounds.width));
                        if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
                            audioRef.current.currentTime = percent * audioRef.current.duration;
                        }
                    }}
                >
                    {bars.map((height, i) => {
                        const barPercent = (i / bars.length) * 100;
                        const isActive = barPercent <= progress;
                        return (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-all duration-300 ${isActive
                                    ? (isUser ? 'bg-white' : 'bg-[#00A1B0]')
                                    : (isUser ? 'bg-white/30' : 'bg-slate-200')
                                    }`}
                                style={{
                                    height: `${isPlaying ? Math.max(3, height + Math.random() * 4) : height}px`,
                                    opacity: isActive ? 1 : 0.6
                                }}
                            />
                        );
                    })}

                    {/* Invisible slider for smoother seek interaction */}
                    <div className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" />
                </div>

                <div className={`flex justify-between text-[10px] font-bold tracking-wider uppercase ${isUser ? 'text-white/80' : 'text-slate-400'}`}>
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            <audio ref={audioRef} src={src} preload="metadata" />
        </div>
    );
};

const ChatPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isDoctor = location.pathname.startsWith('/doctor');
    const [isSidebarOpen, setIsSidebarOpen] = useState(id === 'default' || window.innerWidth >= 768);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image Cropping 
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(4 / 3);
    const [selectedAspect, setSelectedAspect] = useState('4:3');

    // Edit/Delete 
    const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deleteConfirmMessageId, setDeleteConfirmMessageId] = useState<string | number | null>(null);
    const [showWindUpConfirm, setShowWindUpConfirm] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const attachmentOptions = [
        { id: 'image', label: 'Image', icon: <Camera className="h-5 w-5" />, color: 'bg-rose-500' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBackToWebsite = () => {

        navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard');

    };

    const { socket } = useSocket();
    const user = useSelector(selectCurrentUser);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConversationsLoading, setIsConversationsLoading] = useState(true);

    const [activeChat, setActiveChat] = useState<ActiveChat>({
        id: '0',
        name: 'Loading...',
        specialty: '...',
        avatar: 'default',
        online: false,
        unread: 0
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);

    const [noteTitle, setNoteTitle] = useState("");
    const [noteDescription, setNoteDescription] = useState("");
    const [noteCategory, setNoteCategory] = useState<'observation' | 'diagnosis' | 'medicine' | 'lab_test'>("observation");
    const [noteDosage, setNoteDosage] = useState("");
    const [noteFrequency, setNoteFrequency] = useState("");
    const [noteDuration, setNoteDuration] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);

    const handleSaveNote = async () => {
        const appointmentId = currentAppointmentId || id;
        if (!appointmentId || !noteTitle.trim()) {
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

            const res = await appointmentService.updateDoctorNotes(appointmentId, newNote);
            if (res.success) {
                toast.success(`${noteCategory.replace('_', ' ')} saved successfully`);
                setAppointment((prev: any) => ({
                    ...prev,
                    doctorNotes: [...(prev?.doctorNotes || []), newNote]
                }));

                setNoteTitle("");
                setNoteDescription("");
                setNoteDosage("");
                setNoteFrequency("");
                setNoteDuration("");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to save note");
        } finally {
            setIsSavingNote(false);
        }
    };

    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingTimeoutRef = useRef<number | undefined>(undefined);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Recording 
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingTimeRef = useRef(0);
    const [audioLevels, setAudioLevels] = useState<number[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<number | undefined>(undefined);


    const currentRoomRef = useRef<string>("");

    // Session Control 
    const [sessionStatus, setSessionStatus] = useState<SessionStatus | "idle">("idle");
    const [isTimeOver, setIsTimeOver] = useState(false);
    const [extensionCount, setExtensionCount] = useState(0);

    const isPostConsultationWindowOpen = React.useMemo(() => {
        if (!appointment?.postConsultationChatWindow) return false;
        const { isActive, expiresAt } = appointment.postConsultationChatWindow;
        if (!isActive || !expiresAt) return false;
        return new Date(expiresAt) > new Date();
    }, [appointment]);

    const canStartSession = React.useMemo(() => {
        if (!appointment?.appointmentDate) return false;

        const now = new Date();
        const appDate = new Date(appointment.appointmentDate);


        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const appDateStart = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());


        return appDateStart <= todayStart;
    }, [appointment]);

    const handleDisableChat = async () => {
        const appointmentId = currentAppointmentId || id;
        if (!appointmentId) return;
        try {
            const res = await appointmentService.disablePostConsultationChat(appointmentId);
            if (res.success) {
                toast.success("Chat window closed manually.");

                setSessionStatus(SESSION_STATUS.ENDED);
                setAppointment((prev) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        postConsultationChatWindow: {
                            isActive: false,
                            expiresAt: prev.postConsultationChatWindow?.expiresAt || ""
                        }
                    };
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to close chat";
            toast.error(errorMessage);
        }
    };

    const updateSessionStatus = React.useCallback(async (status: SessionStatus) => {
        const appointmentId = currentAppointmentId || id;
        if (!appointmentId) return;
        try {
            await appointmentService.updateSessionStatus(appointmentId, status);
        } catch (error) {
            console.error("Failed to update session status", error);
            toast.error("Failed to update session status");
        }
    }, [currentAppointmentId, id]);



    useEffect(() => {
        if (!appointment || appointment.status === 'completed' || sessionStatus === SESSION_STATUS.ENDED) return;

        const checkTime = () => {

            if (sessionStatus === SESSION_STATUS.CONTINUED_BY_DOCTOR || sessionStatus === SESSION_STATUS.TEST_NEEDED || appointment?.TEST_NEEDED || extensionCount > 0 || isPostConsultationWindowOpen) {
                if (isTimeOver) setIsTimeOver(false);
                return;
            }

            const now = new Date();
            const timeStr = appointment.appointmentTime;
            if (!timeStr) return;

            const parts = timeStr.split('-');
            const endTimeStr = parts[1];
            if (!endTimeStr) return;

            const [hours, minutes] = endTimeStr.trim().split(':');
            const sessionEnd = new Date(appointment.appointmentDate || new Date());
            sessionEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (now > sessionEnd) {
                if (!isTimeOver && !isPostConsultationWindowOpen) {
                    setIsTimeOver(true);

                    if (sessionStatus !== SESSION_STATUS.WAITING_FOR_DOCTOR && !isDoctor) {
                        updateSessionStatus(SESSION_STATUS.WAITING_FOR_DOCTOR);
                    }
                }
            } else {
                if (isTimeOver) setIsTimeOver(false);
            }
        };

        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [appointment, sessionStatus, isDoctor, isTimeOver, extensionCount, updateSessionStatus, isPostConsultationWindowOpen]);

    useEffect(() => {
        if (!socket) return;

        const onSessionStatusUpdated = (data: any) => {
            console.log("[SOCKET] Session status updated:", data);


            const matchId = appointment?._id || id;
            const matchCustomId = appointment?.customId;

            const isMatch =
                data.appointmentId === matchId ||
                String(data.appointmentId) === String(matchId) ||
                (data.customId && matchCustomId && data.customId === matchCustomId) ||
                (data.customId && data.customId === id) ||
                (data.appointmentId === id);

            if (isMatch) {


                setSessionStatus(data.status);
                if (data.extensionCount !== undefined) setExtensionCount(data.extensionCount);


                if (data.postConsultationChatWindow) {
                    setAppointment((prev) => {
                        if (!prev) return null;
                        const updated = {
                            ...prev,
                            postConsultationChatWindow: data.postConsultationChatWindow,
                            TEST_NEEDED: data.TEST_NEEDED
                        };
                        console.log("[CHAT_PAGE] Updated appointment postConsultationChatWindow:", updated.postConsultationChatWindow);


                        return { ...updated };
                    });

                    if (data.postConsultationChatWindow.isActive) {
                        toast.success("Consultation Chat Unlocked for 24 Hours");
                        setIsTimeOver(false);


                        const appointmentId = currentAppointmentId || id;
                        if (appointmentId) {
                            chatService.getAppointment(appointmentId).then((res) => {
                                if (res.data) setAppointment(res.data);
                            }).catch(err => console.error("Failed to refresh appointment:", err));
                        }
                    } else if (data.postConsultationChatWindow.isActive === false) {
                        toast.info("Consultation Chat has been closed");
                    }
                }

                if (data.status === SESSION_STATUS.ACTIVE || data.status === SESSION_STATUS.ACTIVE) {
                    setIsTimeOver(false);
                }

                if (data.status === "ENDED") {
                    setIsOtherTyping(false);
                    setConversations(prev => prev.map(c => c.appointmentId === data.appointmentId ? { ...c, unreadCount: 0 } : c));
                }
            } else {
                console.warn("[SOCKET] Session update received for different appointment:", data.appointmentId, "Expected:", matchId);
            }

            setConversations((prev: Conversation[]) => prev.map(conv => {
                if (conv.appointmentId === data.appointmentId) {
                    return { ...conv, status: data.status };
                }
                return conv;
            }));
        };
        const onSessionEnded = (data: any) => {
            if (data.appointmentId === (appointment?._id || id)) {
                console.log("[SOCKET] Session ended for:", data.appointmentId);
                toast.info("Session has been ended.");
                setSessionStatus(SESSION_STATUS.ENDED);
                setIsOtherTyping(false);
            }
        };

        socket.on("session-status-updated", onSessionStatusUpdated);
        socket.on("session-ended", onSessionEnded);

        return () => {
            socket.off("session-status-updated", onSessionStatusUpdated);
            socket.off("session-ended", onSessionEnded);
        };
    }, [socket, appointment, id, isDoctor, navigate]);

    const getAvatarUrl = (profileImage: string | null | undefined, name: string) => {
        if (profileImage) {
            if (profileImage.startsWith('http')) return profileImage;
            return `${API_BASE_URL}/${profileImage.replace(/\\/g, '/')}`;
        }
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    };

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user) return;
            setIsConversationsLoading(true);
            try {
                const response = await chatService.getConversations();
                setConversations(response.data || []);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            } finally {
                setIsConversationsLoading(false);
            }
        };
        fetchConversations();
    }, [user]);


    // 4. Socket Synchronization - Dedicated Effect
    useEffect(() => {
        if (!socket || !currentConversationId || !user) return;

        console.log("[SOCKET] Setting up listeners for:", currentConversationId);
        const convId = currentConversationId;
        const myUserId = String(user.id || (user as any)._id || "");

        const performJoin = () => {
            socket.emit('join-chat', convId);
            socket.emit('mark-read', { id: convId, userId: myUserId });
        };

        const handleNewMessage = (newMessage: IMessage) => {
            // Strict check: only accept messages for THIS conversation
            const msgConvId = String(newMessage.conversationId || "");
            const msgAppId = String(newMessage.appointmentId || "");

            // Allow if conversationId matches, OR if it matches the current route ID (legacy fallback)
            const isRelevant = msgConvId === convId || msgAppId === id;

            if (!isRelevant) return;

            const isFromMe = (newMessage.senderModel === 'User' && !isDoctor) || (newMessage.senderModel === 'Doctor' && isDoctor);
            const senderType = isFromMe ? 'user' : 'other';

            const uiMsg: Message = {
                id: newMessage._id || newMessage.id || Date.now(),
                sender: senderType,
                text: newMessage.content,
                time: new Date(newMessage.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: newMessage.read ? 'read' : 'delivered',
                type: newMessage.type as any,
                isDeleted: newMessage.isDeleted,
                isEdited: newMessage.isEdited,
            };

            setMessages(prev => {
                const mId = String(uiMsg.id);
                // 1. Check if this exact ID already exists (Deduplication)
                if (prev.some(m => String(m.id) === mId)) return prev;

                // 2. Check if we have a temporary message that matches this content/sender (Optimistic replacement)
                // Only replace if the new message is from 'user' (me)
                if (senderType === 'user') {
                    const tempIdx = prev.findIndex(m =>
                        String(m.id).startsWith('temp-') &&
                        m.text === newMessage.content &&
                        m.sender === 'user'
                    );

                    if (tempIdx !== -1) {
                        const updated = [...prev];
                        updated[tempIdx] = uiMsg; // Swap temp for real
                        return updated;
                    }
                }

                // 3. Append new message
                return [...prev, uiMsg];
            });
        };

        const handleSocketEdit = (updated: IMessage) => {
            if (String(updated.conversationId) === convId) {
                setMessages(prev => prev.map(m => String(m.id) === String(updated._id || updated.id) ? { ...m, text: updated.content, isEdited: true } : m));
            }
        };

        const handleSocketDelete = ({ messageId, conversationId }: { messageId: string, conversationId: string }) => {
            if (conversationId === convId) {
                setMessages(prev => prev.map(m => String(m.id) === String(messageId) ? { ...m, isDeleted: true } : m));
            }
        };

        const onTyping = ({ id: typingId, userId: typingUserId, isTyping }: { id: string, userId: string, isTyping: boolean }) => {
            if (typingId === convId && String(typingUserId) !== myUserId) {
                setIsOtherTyping(isTyping);
            }
        };

        const onRead = ({ id: readId }: { id: string }) => {
            if (readId === convId) {
                setMessages(prev => prev.map(msg => ({ ...msg, status: 'read' as const })));
            }
        };

        socket.on('receive-message', handleNewMessage);
        socket.on('edit-message', handleSocketEdit);
        socket.on('delete-message', handleSocketDelete);
        socket.on('user-typing', onTyping);
        socket.on('messages-read', onRead);

        performJoin();
        socket.on('connect', performJoin);

        return () => {
            console.log("[SOCKET] Cleaning up listeners for:", currentConversationId);
            socket.off('connect', performJoin);
            socket.off('receive-message', handleNewMessage);
            socket.off('edit-message', handleSocketEdit);
            socket.off('delete-message', handleSocketDelete);
            socket.off('user-typing', onTyping);
            socket.off('messages-read', onRead);
            socket.emit('leave-chat', convId);
        };
    }, [socket, currentConversationId, user, isDoctor]); // Removed 'id' from dependency to prevent unnecessary re-runs

    useEffect(() => {
        const initChatContext = async () => {
            if (!id || id === 'default' || !user) {
                setIsLoading(false);
                if (id === 'default') {
                    setActiveChat({
                        id: '0',
                        name: 'Select a consultation',
                        specialty: 'No active session',
                        avatar: 'default',
                        online: false,
                        unread: 0
                    });
                }
                return;
            }

            setIsLoading(true);
            try {
                // 1. Resolve Conversation and Context
                const convData = await chatService.getConversation(id);
                if (!convData) throw new Error("Conversation not found");

                const convId = convData._id || convData.id;
                setCurrentConversationId(convId);

                // Set lock status and session info
                setSessionStatus(convData.sessionStatus || (convData.isLocked ? SESSION_STATUS.ENDED : SESSION_STATUS.ACTIVE));
                if (convData.activeAppointmentId) {
                    setCurrentAppointmentId(convData.activeAppointmentId);
                    const appResponse = await chatService.getAppointment(convData.activeAppointmentId);
                    setAppointment(appResponse.data);
                }

                // 2. Identify Other Participant
                const myUserId = String(user.id || (user as any)._id || "");
                const isPMe = !isDoctor;

                const otherParty = isPMe ? convData.doctor : convData.patient;
                const otherName = isPMe
                    ? (otherParty?.userId?.name || otherParty?.name || 'Doctor')
                    : (otherParty?.name || 'Patient');
                const otherAvatarRaw = isPMe
                    ? otherParty?.userId?.profileImage || otherParty?.profileImage
                    : otherParty?.profileImage;

                setActiveChat({
                    id: otherParty?._id || otherParty?.id || "",
                    name: otherName,
                    specialty: otherParty?.specialty || 'General',
                    avatar: getAvatarUrl(otherAvatarRaw, otherName),
                    online: true,
                    unread: 0
                });

                // 3. Load History
                const history = await chatService.getMessages(convId);
                const uiMessages: Message[] = history.map((m: any) => ({
                    id: m._id || m.id,
                    sender: (m.senderModel === 'User' && !isDoctor) || (m.senderModel === 'Doctor' && isDoctor) ? 'user' : 'other',
                    text: m.content,
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: m.read ? 'read' : 'delivered',
                    type: m.type as any,
                    fileName: m.fileName,
                    isDeleted: m.isDeleted,
                    isEdited: m.isEdited,
                }));
                setMessages(uiMessages);

            } catch (error) {
                console.error("Failed to load chat", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) initChatContext();
    }, [id, user, isDoctor]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    const onEmojiClick = (emojiData: EmojiClickData) => {
        setInputValue((prev) => prev + emojiData.emoji);
    };

    const handleTyping = () => {
        const roomId = currentConversationId || id;
        if (!socket || !roomId || !user) return;
        socket.emit('typing', { id: roomId, userId: user.id || (user as any)._id });
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = window.setTimeout(() => {
            if (socket && roomId && user) {
                socket.emit('stop-typing', { id: roomId, userId: user.id || (user as any)._id });
            }
        }, 2000);
    };

    const handleSendMessage = async () => {
        const targetId = currentConversationId || id;
        if (!inputValue.trim() || !targetId || !socket) return;

        const currentVal = inputValue;
        setInputValue("");
        setShowEmojiPicker(false);

        const tempId = `temp-${Date.now()}`;
        const newMessage: Message = {
            id: tempId,
            sender: 'user',
            text: currentVal,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            type: 'text',
        };

        setMessages(prev => [...prev, newMessage]);

        const socketData = {
            id: tempId,
            conversationId: currentConversationId,
            appointmentId: appointment?._id || (currentConversationId ? null : id),
            content: currentVal,
            senderId: user?.id || (user as any)?._id,
            senderModel: isDoctor ? 'Doctor' : 'User',
            type: 'text',
            createdAt: new Date().toISOString(),
            status: 'sent'
        };

        socket.emit('send-message', socketData);

        try {
            const savedMessage = await chatService.sendMessage(targetId, currentVal, 'text');
            const permanentId = (savedMessage as any)._id || savedMessage.id;

            setMessages(prev => prev.map(m =>
                String(m.id) === tempId ? { ...m, id: permanentId } : m
            ));
        } catch (error) {
            console.error("Failed to persist message", error);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
            toast.error("Failed to send message");
        }
    };

    const handleDeleteMessage = async (messageId: string | number) => {
        const idStr = String(messageId);
        if (idStr.startsWith('temp-')) {
            toast.error("Please wait for the message to be sent before deleting");
            return;
        }

        console.log(`[CHAT_PAGE] Attempting to delete message: ${idStr}`);
        try {
            await chatService.deleteMessage(idStr);
            setMessages(prev => prev.map(m =>
                String(m.id) === idStr ? { ...m, isDeleted: true } : m
            ));

            if (socket) {
                const targetId = currentConversationId || id;
                socket.emit('delete-message', { messageId: idStr, conversationId: targetId });
            }

            toast.success("Message deleted");
        } catch (error) {
            console.error("Failed to delete message", error);
            toast.error("Failed to delete message. Please try again.");
        } finally {
            setDeleteConfirmMessageId(null);
        }
    };

    const handleEditMessage = (msg: Message) => {
        const idStr = String(msg.id);
        if (idStr.startsWith('temp-')) {
            toast.error("Please wait for the message to be sent before editing");
            return;
        }
        setEditingMessageId(msg.id);
        setEditingContent(msg.text);
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId || !editingContent.trim()) return;

        const idStr = String(editingMessageId);
        const originalMessage = messages.find(m => m.id === editingMessageId);
        const originalContent = originalMessage?.text || "";

        console.log(`[CHAT_PAGE] Attempting to save edit for message: ${idStr}`);

        setMessages(prev => prev.map(m =>
            String(m.id) === idStr ? { ...m, text: editingContent, isEdited: true } : m
        ));

        setEditingMessageId(null);
        setEditingContent("");

        try {
            await chatService.editMessage(idStr, editingContent);
            if (socket) {
                const targetId = currentConversationId || id;
                socket.emit('edit-message', {
                    _id: idStr,
                    conversationId: targetId,
                    content: editingContent,
                    senderModel: isDoctor ? 'Doctor' : 'User'
                });
            }
        } catch (error) {
            console.error("Failed to edit message", error);
            toast.error("Failed to save changes. Please try again.");
            setMessages(prev => prev.map(m =>
                String(m.id) === idStr ? { ...m, text: originalContent, isEdited: originalMessage?.isEdited || false } : m
            ));
        }
    };

    const handleDownload = async (url: string, fileName: string) => {
        try {
            const toastId = toast.loading(`Preparing download...`);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.dismiss(toastId);
        } catch (error) {
            console.error("Download failed", error);
            window.open(url, '_blank');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        } else {
            toast.error("Only image files are allowed");
        }
    };

    const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        if (!imageToCrop || !croppedAreaPixels || !id) return;

        setIsUploading(true);
        let imageUrl = '';
        try {
            const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
            if (!croppedImageBlob) throw new Error("Cropping failed");


            const targetId = currentConversationId || id;
            const croppedFile = new File([croppedImageBlob], `cropped-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            imageUrl = await chatService.uploadAttachment(targetId, croppedFile);

            const socketData = {
                id: `temp-${Date.now()}`,
                conversationId: currentConversationId,
                appointmentId: appointment?._id || (currentConversationId ? null : id),
                content: imageUrl,
                senderId: user?.id || (user as any)?._id,
                senderModel: isDoctor ? 'Doctor' : 'User',
                type: 'image' as const,
                createdAt: new Date().toISOString(),
                status: 'sending' as const
            };
            if (socket) socket.emit('send-message', socketData);

            const uiMsg: Message = {
                id: socketData.id,
                sender: 'user',
                text: socketData.content,
                time: new Date(socketData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sending' as const,
                type: 'image',
            };
            setMessages((prev) => [...prev, uiMsg]);

            const savedMessage = await chatService.sendMessage(targetId, imageUrl, 'image');

            const permanentId = (savedMessage as any)._id || savedMessage.id;
            const tempId = socketData.id;

            setMessages(prev => prev.map(m =>
                String(m.id) === tempId ? { ...m, id: permanentId, status: 'sent' } : m
            ));

            setIsCropping(false);
            setImageToCrop(null);
            toast.success("Image sent");
        } catch (error) {
            console.error("Upload failed", error);

            setMessages((prev) => prev.map(m => (String(m.id).startsWith('temp-') && m.text === imageUrl) ? { ...m, status: 'failed' as const } : m));
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const formatMessageText = (text: string, isUser: boolean) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                        className={`underline break-all ${isUser ? 'text-white' : 'text-blue-600'} font-bold`}>
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    const handleSendAttachment = (option: any) => {
        if (option.id === 'image') {
            if (fileInputRef.current) {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current.click();
            }
        }
        setShowAttachmentMenu(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;

            const updateLevels = () => {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                setAudioLevels(prev => [...prev.slice(-30), avg / 2]);
                animationFrameRef.current = requestAnimationFrame(updateLevels);
            };
            updateLevels();

            mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorder.onstop = async () => {
                console.log("[VOICE] Recording stopped. Chunks:", audioChunksRef.current.length);
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                const finalTime = recordingTimeRef.current;

                console.log(`[VOICE] Final duration: ${finalTime}s, Blob size: ${audioBlob.size} bytes`);

                if (audioChunksRef.current.length > 0 && finalTime > 0) {
                    try {
                        const extension = (mediaRecorder.mimeType || 'audio/webm').split('/')[1].split(';')[0] || 'webm';
                        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.${extension}`, { type: audioBlob.type });

                        console.log("[VOICE] Uploading file:", audioFile.name, audioFile.type);
                        const audioUrl = await chatService.uploadAttachment(id!, audioFile);
                        console.log("[VOICE] Upload successful:", audioUrl);

                        const tempId = `temp-voice-${Date.now()}`;
                        const uiMsg: Message = {
                            id: tempId,
                            sender: 'user',
                            text: audioUrl,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            status: 'sending',
                            type: 'audio',
                        };
                        setMessages(prev => [...prev, uiMsg]);

                        const savedMsg = await chatService.sendMessage(id!, audioUrl, 'file', audioFile.name);


                        const permId = (savedMsg as any)._id || savedMsg.id;
                        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: permId, status: 'sent' } : m));

                        toast.success("Voice note sent");
                    } catch (error) {
                        console.error("[VOICE] Failed to send voice note:", error);
                        toast.error("Failed to send voice note");
                    }
                } else {
                    console.warn("[VOICE] Recording discarded: too short or no data");
                }
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimeRef.current = 0;
            timerIntervalRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    const next = prev + 1;
                    recordingTimeRef.current = next;
                    return next;
                });
            }, 1000) as unknown as number;
        } catch (err) {
            console.error("Recording error:", err);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setAudioLevels([]);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerIntervalRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000) as any;
            const updateLevels = () => {
                if (analyzerRef.current) {
                    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
                    analyzerRef.current.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                    setAudioLevels(prev => [...prev.slice(-30), avg / 2]);
                    animationFrameRef.current = requestAnimationFrame(updateLevels);
                }
            };
            updateLevels();
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            audioChunksRef.current = [];
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setAudioLevels([]);
        }
    };

    return (
        <div className="flex h-screen w-full font-sans bg-white text-slate-900 overflow-hidden">
            {/* Image Cropper Modal - Ultra Professional Responsive Design */}
            <Dialog open={isCropping} onOpenChange={(open) => !isUploading && setIsCropping(open)}>
                <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-4xl bg-gradient-to-br from-white via-white to-slate-50 border-slate-200 shadow-2xl p-0 overflow-hidden rounded-2xl md:rounded-3xl max-h-[95vh] flex flex-col">
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex-1">
                            <DialogTitle className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <Camera className="h-5 w-5 text-[#00A1B0]" />
                                <span>Edit Image</span>
                            </DialogTitle>
                            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Crop, zoom & adjust your photo</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1 bg-[#00A1B0]/10 px-3 py-1.5 rounded-lg">
                                <div className="h-2 w-2 bg-[#00A1B0] rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#00A1B0]">Live Preview</span>
                            </div>
                        </div>
                    </div>

                    {/* Cropper Area */}
                    <div className="relative flex-1 min-h-[300px] md:min-h-[400px] bg-slate-900 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,161,176,0.1)_0%,transparent_70%)] opacity-50"></div>
                        {imageToCrop && (
                            <Cropper
                                image={imageToCrop}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                showGrid={true}
                                objectFit="contain"
                                classes={{
                                    containerClassName: "h-full w-full",
                                    mediaClassName: "max-h-full"
                                }}
                            />
                        )}
                    </div>

                    {/* Controls Panel */}
                    <div className="p-4 md:p-5 space-y-3 md:space-y-4 bg-white border-t border-slate-100">
                        {/* Aspect Ratio Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Aspect Ratio</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: '1:1', value: 1, icon: '□' },
                                    { label: '4:3', value: 4 / 3, icon: '▭' },
                                    { label: '16:9', value: 16 / 9, icon: '▬' },
                                    { label: 'Free', value: 0, icon: '⊡' }
                                ].map((ratio) => (
                                    <button
                                        key={ratio.label}
                                        onClick={() => { setAspectRatio(ratio.value || 1); setSelectedAspect(ratio.label); }}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all active:scale-95 ${selectedAspect === ratio.label
                                            ? 'border-[#00A1B0] bg-[#00A1B0]/10 text-[#00A1B0]'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        <span className="text-2xl">{ratio.icon}</span>
                                        <span className="text-xs font-bold">{ratio.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Zoom Control */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Zoom</label>
                                <span className="text-sm font-bold text-[#00A1B0] bg-[#00A1B0]/10 px-3 py-1 rounded-lg">{zoom.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                                >
                                    <span className="text-lg font-bold">−</span>
                                </button>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#00A1B0] transition-all"
                                    style={{
                                        background: `linear-gradient(to right, #00A1B0 0%, #00A1B0 ${((zoom - 1) / 2) * 100}%, #e2e8f0 ${((zoom - 1) / 2) * 100}%, #e2e8f0 100%)`
                                    }}
                                />
                                <button
                                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Rotation</label>
                                <span className="text-sm font-bold text-[#00A1B0] bg-[#00A1B0]/10 px-3 py-1 rounded-lg">{rotation}°</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setRotation((rotation - 90) % 360)}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                                >
                                    <span className="text-sm font-bold">↺ 90°</span>
                                </button>
                                <button
                                    onClick={() => setRotation(0)}
                                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                                >
                                    <span className="text-sm font-bold">Reset</span>
                                </button>
                                <button
                                    onClick={() => setRotation((rotation + 90) % 360)}
                                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                                >
                                    <span className="text-sm font-bold">↻ 90°</span>
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => { setIsCropping(false); setImageToCrop(null); setRotation(0); setZoom(1); }}
                                disabled={isUploading}
                                className="w-full sm:flex-1 h-12 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCropSave}
                                disabled={isUploading}
                                className="w-full sm:flex-[2] h-12 rounded-xl bg-gradient-to-r from-[#00A1B0] to-[#008f9c] hover:from-[#008f9c] hover:to-[#007d88] text-white font-bold text-sm shadow-lg shadow-[#00A1B0]/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Apply & Send</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Sidebar */}
            <aside className={`
                ${isSidebarOpen ? 'w-full md:w-80' : 'w-0'} 
                fixed md:relative z-40 h-full bg-slate-50 border-r border-slate-100 transition-all duration-300 ease-in-out flex flex-col
                ${!isSidebarOpen && 'md:w-0 overflow-hidden'}
            `}>
                <div className="p-6 pb-4 border-b border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
                            <button
                                onClick={handleBackToWebsite}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-[#00A1B0] hover:text-[#008f9c] transition-colors mt-1 uppercase tracking-wider"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back
                            </button>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full md:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </div>

                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar no-scrollbar" data-lenis-prevent>
                    {isConversationsLoading ? (
                        <div className="flex flex-col gap-4 p-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full shrink-0 bg-slate-200/50 backdrop-blur-sm" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-2/3 bg-slate-200/50" />
                                        <Skeleton className="h-2 w-full bg-slate-100/50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                            <Search className="h-10 w-10 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No conversations</p>
                        </div>
                    ) : (
                        conversations.map((conv: any) => {

                            const isPMeInList = !isDoctor;

                            const otherPartyInList = isPMeInList ? conv.doctor : conv.patient;


                            const nameInList = isPMeInList
                                ? (otherPartyInList?.userId?.name || otherPartyInList?.name || 'Doctor')
                                : (otherPartyInList?.name || otherPartyInList?.userId?.name || 'Patient');


                            const avatarInList = getAvatarUrl(
                                isPMeInList
                                    ? (otherPartyInList?.userId?.profileImage || otherPartyInList?.profileImage)
                                    : (otherPartyInList?.profileImage || otherPartyInList?.userId?.profileImage),
                                nameInList
                            );
                            const isActiveInList = id === conv.conversationId || id === conv.appointmentId;

                            return (
                                <div
                                    key={conv.conversationId || conv.appointmentId}
                                    onClick={() => {
                                        const navId = conv.conversationId || conv.appointmentId;
                                        navigate(isDoctor ? `/doctor/chat/${navId}` : `/patient/chat/${navId}`);
                                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border 
                                        ${isActiveInList ? 'bg-white border-[#00A1B0]/30 shadow-md' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="relative">
                                        <img src={avatarInList} alt="" className="h-12 w-12 rounded-full object-cover bg-slate-100" />
                                        {conv.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-bold truncate">{nameInList}</h3>
                                            {conv.lastMessage?.createdAt && <span className="text-[10px] text-slate-400">{new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate italic">{conv.lastMessage?.content || 'No messages'}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-[#fafafa] h-full ${id === 'default' ? 'chat-doodle-bg' : ''}`}>
                {id !== 'default' && (
                    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 min-h-[73px]">
                        {isLoading ? (
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full bg-slate-200/50" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 bg-slate-200/50" />
                                    <Skeleton className="h-3 w-20 bg-slate-100/50" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 md:gap-4 flex-1">
                                    {/* Back to Appointments (Mobile Only) */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleBackToWebsite}
                                        className="md:hidden text-slate-400 hover:text-slate-900"
                                        title="Exit Chat"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>

                                    {/* Toggle Sidebar / Chat List */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="md:hidden text-slate-400 hover:text-slate-900"
                                        title="View Chat List"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>

                                    {/* Desktop Toggle Sidebar */}
                                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-full md:flex hidden text-slate-400 hover:text-slate-900">
                                        <ChevronLeft className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
                                    </Button>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={activeChat.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-slate-100" />
                                            {activeChat.online && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 leading-none">{activeChat.name}</h2>
                                            <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{activeChat.online ? 'Online' : 'Offline'} • {activeChat.specialty}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isDoctor && sessionStatus === SESSION_STATUS.ENDED && (
                                        <div className="flex items-center gap-2">
                                            {isPostConsultationWindowOpen && (
                                                <div className="hidden md:flex items-center gap-2 px-4 h-9 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                                    <Clock className="h-3.5 w-3.5" /> Follow-up Open
                                                </div>
                                            )}
                                            <div className="hidden md:flex items-center px-4 h-9 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                Session Ended
                                            </div>
                                        </div>
                                    )}
                                    {isDoctor && sessionStatus !== SESSION_STATUS.ENDED && (
                                        <>
                                            {(sessionStatus === SESSION_STATUS.ACTIVE || sessionStatus === SESSION_STATUS.CONTINUED_BY_DOCTOR) ? (
                                                <Button
                                                    onClick={() => updateSessionStatus(SESSION_STATUS.ENDED)}
                                                    variant="destructive"
                                                    size="sm"
                                                    className="hidden md:flex items-center gap-2 rounded-xl px-4 h-9 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Wind Up
                                                </Button>
                                            ) : (
                                                !isPostConsultationWindowOpen && (
                                                    canStartSession ? (
                                                        <Button
                                                            onClick={() => updateSessionStatus(SESSION_STATUS.ACTIVE)}
                                                            size="sm"
                                                            className="hidden md:flex items-center gap-2 rounded-xl px-4 h-9 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[#00A1B0]/20"
                                                        >
                                                            <Play className="h-4 w-4" />
                                                            Start Session
                                                        </Button>
                                                    ) : (
                                                        <div className="hidden md:flex items-center gap-2 px-4 h-9 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 cursor-not-allowed" title="You can only start the session on the scheduled date">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            Scheduled: {appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Future'}
                                                        </div>
                                                    )
                                                )
                                            )}
                                            {isDoctor && isPostConsultationWindowOpen && (
                                                <Button
                                                    onClick={handleDisableChat}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-black uppercase text-[9px] tracking-widest border border-red-200 rounded-full px-4 shadow-sm transition-all active:scale-95"
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Close Session
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><Search className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                </div>
                            </>
                        )}
                    </header>
                )}

                {id === 'default' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                        <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                            <MessagesSquare className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">Select a conversation</h3>
                        <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">Choose a chat from the sidebar to start messaging with your doctor or patient.</p>
                    </div>
                ) : (
                    <>
                        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar chat-doodle-bg scroll-smooth touch-auto relative no-scrollbar" style={{ touchAction: 'auto' }} data-lenis-prevent>
                            <div className="max-w-3xl mx-auto flex flex-col gap-4">
                                {isLoading ? (
                                    <div className="space-y-6">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex flex-col gap-2 max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                                                    <Skeleton className={`h-11 ${i % 2 === 0 ? 'w-48 bg-[#00A1B0]/10 rounded-tr-sm' : 'w-64 bg-white/80 rounded-tl-sm'} rounded-2xl backdrop-blur-[2px]`} />
                                                    <Skeleton className="h-2 w-12 bg-slate-200/40" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div className={`group relative ${msg.type === 'image' ? 'p-0' : `px-3 md:px-4 py-2.5 rounded-2xl text-sm leading-relaxed`} ${msg.type === 'image'
                                                    ? ''
                                                    : msg.sender === 'user'
                                                        ? 'bg-gradient-to-br from-[#00A1B0] to-[#008f9c] text-white shadow-md shadow-[#00A1B0]/20 rounded-tr-sm'
                                                        : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100 shadow-sm'
                                                    } ${msg.isDeleted ? 'opacity-60 bg-slate-100 text-slate-400 border-dashed' : ''}`}>

                                                    {/* Message Actions - Show on Hover */}
                                                    {(msg.sender === 'user' && !msg.isDeleted) && (
                                                        <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-lg border border-slate-100 rounded-full px-2 py-1 z-10">
                                                            {/* Hide Edit for images */}
                                                            {msg.type !== 'image' && (
                                                                <button
                                                                    onClick={() => handleEditMessage(msg)}
                                                                    className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-[#00A1B0] transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 rotate-45" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => setDeleteConfirmMessageId(msg.id)}
                                                                className="p-1.5 hover:bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {msg.isDeleted ? (
                                                        <div className="flex items-center gap-2 italic">
                                                            <Info className="h-3.5 w-3.5" />
                                                            <span>This message was deleted</span>
                                                        </div>
                                                    ) : String(editingMessageId) === String(msg.id) ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <textarea
                                                                value={editingContent}
                                                                onChange={(e) => setEditingContent(e.target.value)}
                                                                className="w-full bg-white/10 text-white border border-white/20 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/40 min-h-[60px] resize-none"
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setEditingMessageId(null)}
                                                                    className="px-2 py-1 text-[10px] font-bold uppercase hover:bg-white/10 rounded"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    className="px-2 py-1 text-[10px] font-bold uppercase bg-white text-[#00A1B0] rounded shadow-sm"
                                                                >
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : msg.type === 'image' ? (
                                                        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-lg">
                                                            <img
                                                                src={msg.text}
                                                                alt="Shared image"
                                                                className="max-h-[300px] md:max-h-[400px] w-auto object-cover cursor-pointer hover:opacity-95 transition-all duration-300"
                                                                onClick={() => setPreviewImage(msg.text)}
                                                                loading="lazy"
                                                            />
                                                            {/* Image Lightbox Controls */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                            <button
                                                                onClick={() => setPreviewImage(msg.text)}
                                                                className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white active:scale-95"
                                                            >
                                                                <Search className="h-4 w-4 text-slate-700" />
                                                            </button>
                                                        </div>
                                                    ) : (msg.type === 'audio' || (msg.type === 'file' && (isAudioUrl(msg.text) || isAudioUrl(msg.fileName || "")))) ? (
                                                        <CustomAudioPlayer src={msg.text} isUser={msg.sender === 'user'} />
                                                    ) : (
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="whitespace-pre-wrap font-medium">{formatMessageText(msg.text, msg.sender === 'user')}</p>
                                                            {msg.isEdited && (
                                                                <span className={`text-[9px] uppercase font-bold tracking-tighter self-end opacity-50 ${msg.sender === 'user' ? 'text-white' : 'text-slate-400'}`}>
                                                                    Edited
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 px-1">
                                                    <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                                                    {msg.sender === 'user' && !msg.isDeleted && (msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-[#00A1B0]" /> : <Check className="h-3 w-3 text-slate-300" />)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                                {isOtherTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </main>

                        <footer className="p-4 bg-white border-t border-slate-100 relative">
                            {((sessionStatus === SESSION_STATUS.ENDED || (sessionStatus !== "ACTIVE" && sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR && sessionStatus !== "TEST_NEEDED" && !appointment?.TEST_NEEDED)) && !isPostConsultationWindowOpen) ? (
                                <div className="max-w-3xl mx-auto py-2">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-3 text-slate-500">
                                        <Lock className="h-5 w-5 text-[#00A1B0]" />
                                        <p className="font-bold text-sm tracking-tight text-center">
                                            {sessionStatus === SESSION_STATUS.ENDED
                                                ? (isDoctor ? "You have ended this session. No further messages can be sent." : "The doctor has ended the session. This chat is now read-only.")
                                                : (isDoctor ? "Please click 'Start Session' in the header to begin interaction." : "Waiting for the doctor to start the session. You can view previous history until then.")
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isPostConsultationWindowOpen && (sessionStatus === SESSION_STATUS.ENDED || sessionStatus === SESSION_STATUS.TEST_NEEDED || appointment?.TEST_NEEDED) && (
                                        <div className="max-w-3xl mx-auto mb-4">
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                                                        <ClipboardList className="h-5 w-5 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">
                                                            {(sessionStatus === SESSION_STATUS.TEST_NEEDED || appointment?.TEST_NEEDED) ? "Tests Needed - Chat Open" : "Follow-up Window Active"}
                                                        </p>
                                                        <p className="text-[12px] font-bold text-amber-600/80 leading-tight">
                                                            {(sessionStatus === SESSION_STATUS.TEST_NEEDED || appointment?.TEST_NEEDED) ? "Please upload your test results or discuss with the doctor" : "Chat is open for submitting test results & discussion"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-amber-100 shrink-0">
                                                    <Clock className="h-3 w-3 text-amber-500" />
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter">Expires in 24h</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-24 left-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-100 bg-white">
                                                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                                            </div>
                                        )}
                                        {showAttachmentMenu && (
                                            <motion.div
                                                ref={attachmentMenuRef}
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute bottom-24 left-6 z-50 bg-[#1e2124] text-white rounded-2xl shadow-2xl p-2 min-w-[180px] border border-white/10"
                                            >
                                                {attachmentOptions.map((opt) => (
                                                    <button key={opt.id} onClick={() => handleSendAttachment(opt)} className="flex items-center gap-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left">
                                                        <div className={`p-2 rounded-lg ${opt.color} text-white`}>{opt.icon}</div>
                                                        <span className="text-sm font-bold">{opt.label}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="max-w-3xl mx-auto flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`rounded-full transition-colors ${showEmojiPicker ? 'text-[#00A1B0] bg-slate-50' : 'text-slate-400'}`} disabled={isLoading || isRecording || (isTimeOver && !isDoctor && !isPostConsultationWindowOpen)}>
                                                <Smile className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`rounded-full transition-colors ${showAttachmentMenu ? 'text-[#00A1B0] bg-slate-50' : 'text-slate-400'}`} disabled={isLoading || isRecording || (isTimeOver && !isDoctor && !isPostConsultationWindowOpen)}>
                                                <Paperclip className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        <div className="flex-1 relative">
                                            {isRecording ? (
                                                <div className="flex items-center justify-between h-11 px-4 bg-slate-50 border-none rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5 min-w-[45px]">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                            <span className="text-xs font-bold text-slate-700">{formatTime(recordingTime)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 h-4">
                                                            {audioLevels.map((lvl, i) => (
                                                                <div key={i} className="w-0.5 bg-[#00A1B0] rounded-full transition-all duration-75" style={{ height: `${Math.max(2, lvl)}px` }} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={cancelRecording} className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-full">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={isPaused ? resumeRecording : pauseRecording} className="h-8 w-8 text-slate-400 hover:text-[#00A1B0] rounded-full">
                                                            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={stopRecording} className="h-8 w-8 bg-[#00A1B0] text-white hover:bg-[#008f9c] rounded-full shadow-lg shadow-[#00A1B0]/20" disabled={isTimeOver && !isDoctor}>
                                                            <Send className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Input
                                                        placeholder={isTimeOver && !isDoctor && !isPostConsultationWindowOpen ? "Session time over" : "Type a message..."}
                                                        className="pr-12 h-11 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#00A1B0]/20 shadow-none"
                                                        value={inputValue}
                                                        onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        disabled={isLoading || (isTimeOver && !isDoctor && !isPostConsultationWindowOpen)}
                                                    />
                                                    <input type="file" hidden ref={fileInputRef} accept="image/*,application/pdf,.doc,.docx" onChange={handleFileUpload} />
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                                        {!inputValue.trim() ? (
                                                            <Button variant="ghost" size="icon" onClick={startRecording} className="text-slate-400 hover:text-[#00A1B0] hover:bg-transparent" disabled={isLoading || (isTimeOver && !isDoctor && !isPostConsultationWindowOpen)}>
                                                                <Mic className="h-5 w-5" />
                                                            </Button>
                                                        ) : (
                                                            <Button size="icon" onClick={handleSendMessage} className="bg-[#00A1B0] hover:bg-[#008f9c] h-8 w-8 rounded-lg shadow-lg shadow-[#00A1B0]/20 transition-all active:scale-95" disabled={isLoading || (isTimeOver && !isDoctor && !isPostConsultationWindowOpen)}>
                                                                <Send className="h-4 w-4 text-white" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </footer>
                    </>
                )
                }

                {/* Preview Image UI (Instead of main container content) */}
                <AnimatePresence>
                    {previewImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-[60] bg-[#111] flex flex-col"
                        >
                            {/* Preview Header */}
                            <div className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setPreviewImage(null)}
                                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm font-black uppercase tracking-widest">Image Preview</span>
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-tighter">Shared via TakeCare Chat</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => window.open(previewImage, '_blank')}
                                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(previewImage!, `TakeCare-Image-${Date.now()}.jpg`)}
                                        className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                                        title="Download Locally"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Image Workspace */}
                            <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
                                <motion.img
                                    drag
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    src={previewImage}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg cursor-grab active:cursor-grabbing"
                                />
                            </div>

                            {/* Footer / Info Bar */}
                            <div className="p-4 bg-black/20 backdrop-blur-sm flex justify-center border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">TakeCare Secure Image Viewer</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >

            {/* Right Sidebar */}
            {
                id !== 'default' && isDoctor && (
                    <aside className="w-80 bg-slate-50/50 border-l border-slate-100 hidden lg:flex flex-col overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {isLoading ? (
                            <div className="space-y-6">
                                <Card className="shadow-none border-slate-100 bg-white/80 backdrop-blur-sm">
                                    <CardHeader className="p-4 flex flex-col items-center text-center space-y-3">
                                        <Skeleton className="h-20 w-20 rounded-full bg-slate-200/50" />
                                        <div className="space-y-2 w-full flex flex-col items-center">
                                            <Skeleton className="h-4 w-3/4 bg-slate-200/50" />
                                            <Skeleton className="h-3 w-1/2 bg-slate-100/50" />
                                            <Skeleton className="h-3 w-2/3 bg-slate-100/30" />
                                        </div>
                                    </CardHeader>
                                </Card>
                                <div className="space-y-4">
                                    <Skeleton className="h-3 w-24 px-1 bg-slate-200/40" />
                                    <div className="grid grid-cols-1 gap-2">
                                        <Skeleton className="h-16 rounded-2xl w-full bg-white/60" />
                                        <Skeleton className="h-16 rounded-2xl w-full bg-white/60" />
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <Skeleton className="h-3 w-24 px-1 bg-slate-200/40" />
                                    <Skeleton className="h-36 rounded-2xl w-full bg-white/60" />
                                    <Skeleton className="h-12 rounded-xl w-full bg-[#00A1B0]/10" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <Card className="shadow-none border-slate-100 bg-white">
                                    <CardHeader className="p-4 flex flex-col items-center text-center space-y-3">
                                        <div className="h-20 w-20 rounded-full p-1 border-2 border-[#00A1B0]/10">
                                            <img src={activeChat.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-[#00A1B0] tracking-tight">{appointment?.patientId?.name || 'Patient'}</h3>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Patient ID: {appointment?.patientId?.customId}</p>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">APT ID: {appointment?.customId}</p>
                                        </div>
                                    </CardHeader>
                                </Card>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Profile</h4>
                                        <Info className="h-3 w-3 text-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] text-slate-400 font-black uppercase mb-1.5 tracking-tighter">Gender / Age</p>
                                            <p className="text-xs font-bold text-slate-700">{appointment?.patientId?.gender} • {appointment?.patientId?.dob ? new Date().getFullYear() - new Date(appointment.patientId.dob).getFullYear() : 'N/A'} yrs</p>
                                        </div>
                                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-[9px] text-slate-400 font-black uppercase mb-1.5 tracking-tighter">Blood Group</p>
                                            <p className="text-xs font-bold text-slate-700">{appointment?.patientId?.bloodGroup || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="space-y-4 pt-4 border-t border-slate-200/60">
                            <div className="flex items-center gap-2 px-1 mb-2">
                                <div className="h-6 w-6 rounded-lg bg-[#00A1B0]/10 flex items-center justify-center text-[#00A1B0]">
                                    <StickyNote size={14} />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Clinical Observations</h4>
                            </div>

                            {/* New Note Form */}
                            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                {/* Category Selector */}
                                <div className="flex flex-wrap gap-1.5 mb-1">
                                    {(['observation', 'diagnosis', 'medicine', 'lab_test'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setNoteCategory(cat)}
                                            className={`px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all ${noteCategory === cat
                                                ? 'bg-[#00A1B0] text-white shadow-md shadow-[#00A1B0]/10'
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                        >
                                            {cat.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="text"
                                    placeholder={
                                        noteCategory === 'medicine' ? "Medicine Name" :
                                            noteCategory === 'lab_test' ? "Test Name" :
                                                noteCategory === 'diagnosis' ? "Diagnosis Title" : "Symptom / Title"
                                    }
                                    value={noteTitle}
                                    onChange={(e) => setNoteTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00A1B0]/30 outline-none font-bold tracking-wider transition-all"
                                />

                                {noteCategory === 'medicine' ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Dosage"
                                            value={noteDosage}
                                            onChange={(e) => setNoteDosage(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00A1B0]/30 outline-none font-bold transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Freq"
                                            value={noteFrequency}
                                            onChange={(e) => setNoteFrequency(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00A1B0]/30 outline-none font-bold transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Dur"
                                            value={noteDuration}
                                            onChange={(e) => setNoteDuration(e.target.value)}
                                            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00A1B0]/30 outline-none font-bold transition-all"
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        placeholder={
                                            noteCategory === 'lab_test' ? "Reason for test / Details" :
                                                "Description / Observations"
                                        }
                                        value={noteDescription}
                                        onChange={(e) => setNoteDescription(e.target.value)}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-[#00A1B0]/30 outline-none font-medium leading-relaxed resize-none transition-all"
                                    />
                                )}
                                <Button
                                    onClick={handleSaveNote}
                                    disabled={
                                        isSavingNote ||
                                        !noteTitle.trim() ||
                                        (noteCategory === 'medicine'
                                            ? (!noteDosage.trim() || !noteFrequency.trim() || !noteDuration.trim())
                                            : !noteDescription.trim())
                                    }
                                    className="w-full h-10 bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-xl font-black uppercase tracking-widest text-[9px] shadow-md shadow-[#00A1B0]/10 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {isSavingNote ? (
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Plus size={14} /> Save {noteCategory.replace('_', ' ')}
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Notes List */}
                            <div className="space-y-3 mt-4">
                                {appointment?.doctorNotes && appointment.doctorNotes.length > 0 ? (
                                    [...appointment.doctorNotes].reverse().map((note: any, idx: number) => (
                                        <motion.div
                                            key={note.id || idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#00A1B0]/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#00A1B0]"></div>
                                                <span className="text-[10px] font-black text-slate-900 tracking-widest leading-none">{note.title}</span>
                                                {note.category && note.category !== 'observation' && (
                                                    <span className="px-1.5 py-0.5 rounded bg-[#00A1B0]/5 text-[7px] font-black text-[#00A1B0] uppercase tracking-tighter border border-[#00A1B0]/10">
                                                        {note.category.replace('_', ' ')}
                                                    </span>
                                                )}
                                                <span className="ml-auto text-[8px] font-bold text-slate-400">
                                                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {note.category === 'medicine' ? (
                                                <div className="flex gap-2">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[8px] font-black text-[#00A1B0] tracking-tighter">
                                                        {note.dosage}
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[8px] font-black text-[#00A1B0] tracking-tighter">
                                                        {note.frequency}
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[8px] font-black text-[#00A1B0] tracking-tighter">
                                                        {note.duration}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {note.description}
                                                </p>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <BookOpen size={20} className="text-slate-400" />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No observations yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>
                )
            }
            {/* Deletion Confirmation Dialog */}
            <Dialog open={!!deleteConfirmMessageId} onOpenChange={() => setDeleteConfirmMessageId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Message</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600">Are you sure you want to delete this message? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteConfirmMessageId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => deleteConfirmMessageId && handleDeleteMessage(deleteConfirmMessageId)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Time Over Modal for Patient */}
            <AnimatePresence>
                {isTimeOver && !isDoctor && !isPostConsultationWindowOpen && sessionStatus !== SESSION_STATUS.CONTINUED_BY_DOCTOR && sessionStatus !== SESSION_STATUS.ENDED && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="h-10 w-10 text-amber-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight uppercase">Session Time Over</h2>
                            <p className="text-slate-500 font-bold leading-relaxed mb-8 text-xs uppercase tracking-tight">
                                Your appointment time is over. Please wait for the doctor's response.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 rounded-xl">
                                    <div className="w-2 h-2 bg-[#00A1B0] rounded-full animate-ping"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Waiting for Doctor...
                                    </p>
                                </div>
                                <Button
                                    onClick={handleBackToWebsite}
                                    className="w-full bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-2xl h-14 font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Exit to Dashboard
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Improved Doctor Session Controls (Modal Style) when time is over */}
            <AnimatePresence>
                {isTimeOver && isDoctor && sessionStatus === SESSION_STATUS.WAITING_FOR_DOCTOR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-14 w-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                    <Clock className="h-7 w-7 text-amber-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Session Time Completed</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Manage the appointment status</p>
                                </div>
                            </div>

                            <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                The appointment time has ended. You can choose to continue the session or wind it up. Patient is currently waiting for your response.
                            </p>

                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={() => updateSessionStatus(SESSION_STATUS.CONTINUED_BY_DOCTOR)}
                                        className="bg-green-500 hover:bg-green-600 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-green-500/20"
                                    >
                                        ✅ Continue
                                    </Button>
                                    <Button
                                        onClick={() => setShowWindUpConfirm(true)}
                                        className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20"
                                    >
                                        ❌ Wind Up
                                    </Button>
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (!appointment?._id) return;
                                        try {
                                            const res = await appointmentService.enablePostConsultationChat(appointment._id);
                                            if (res.success) {
                                                toast.success("Chat enabled for 24 hours. Request sent.");
                                                setIsTimeOver(false);
                                            } else {
                                                toast.error(res.message);
                                            }
                                        } catch (error: any) {
                                            toast.error(error.response?.data?.message || "Failed to trigger tests needed");
                                        }
                                    }}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20"
                                >
                                    📋 Tests Needed
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

            {/* Wind Up Confirmation Dialog */}
            <Dialog open={showWindUpConfirm} onOpenChange={setShowWindUpConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Confirm Wind Up Session
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-slate-600 mb-3">
                            Are you sure you want to <strong className="text-red-600">wind up</strong> this consultation session?
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                            <p className="text-xs text-red-800 font-semibold">⚠️ This action will:</p>
                            <ul className="text-xs text-red-700 space-y-1 ml-4 list-disc">
                                <li>End the current consultation session</li>
                                <li>Disable the chat for both you and the patient</li>
                                <li>Mark the appointment as completed</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowWindUpConfirm(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowWindUpConfirm(false);
                                updateSessionStatus(SESSION_STATUS.ENDED);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                        >
                            Yes, Wind Up
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ChatPage;
