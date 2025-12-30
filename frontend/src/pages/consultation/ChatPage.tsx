import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Smile, MoreVertical,
    ChevronLeft, Check, CheckCheck,
    Info, Search, Globe, Plus, Camera, Paperclip, Mic, Trash2, Pause, Play
} from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import EmojiPicker from 'emoji-picker-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useSocket } from '../../context/SocketContext';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/user/userSlice';
import { chatService } from '../../services/chatService';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../utils/constants';

interface Message {
    id: string | number;
    sender: 'user' | 'other';
    text: string;
    time: string;
    status: 'sent' | 'delivered' | 'read';
    type: 'text' | 'file' | 'image' | 'system';
    fileName?: string;
    fileSize?: string;
}

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isDoctor = location.pathname.startsWith('/doctor');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const attachmentMenuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const attachmentOptions = [
        { id: 'media', label: 'Photos', icon: <Camera className="h-5 w-5" />, color: 'bg-blue-500' },
        { id: 'cam', label: 'Camera', icon: <Camera className="h-5 w-5" />, color: 'bg-pink-500' },
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
        if (id && id !== 'default') {
            navigate(isDoctor ? `/doctor/appointments/${id}` : `/patient/appointments/${id}`);
        } else {
            navigate(isDoctor ? '/doctor/dashboard' : '/patient/home');
        }
    };

    const { socket } = useSocket();
    const user = useSelector(selectCurrentUser);
    const [appointment, setAppointment] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConversationsLoading, setIsConversationsLoading] = useState(true);

    const [activeChat, setActiveChat] = useState<any>({
        id: '0',
        name: 'Loading...',
        specialty: '...',
        avatar: 'default',
        online: false,
        unread: 0
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [noteText, setNoteText] = useState("");
    const [savedNotes, setSavedNotes] = useState<any[]>([]);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingTimeoutRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevels, setAudioLevels] = useState<number[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<any>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const getAvatarUrl = (profileImage: string | null | undefined, name: string) => {
        if (profileImage) {
            if (profileImage.startsWith('http')) return profileImage;
            return `${API_BASE_URL}/${profileImage.replace(/\\/g, '/')}`;
        }
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    };

    const isPatientMe = React.useMemo(() => {
        const myId = String(user?.id || (user as any)?._id || "");
        if (!myId || !appointment) return false;
        const patientId = appointment.patientId?.id || appointment.patientId?._id || appointment.patientId;
        const patientUserId = appointment.patient?.userId || appointment.patient?.id || appointment.patient?._id;
        return String(patientId) === myId || String(patientUserId) === myId;
    }, [appointment, user]);

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

    useEffect(() => {
        const initChat = async () => {
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
                const appData = await chatService.getAppointment(id);
                const currentAppointment = appData.data;
                setAppointment(currentAppointment);

                const isPatientMe = currentAppointment.patient?.userId === user.id ||
                    currentAppointment.patient?.id === user.id ||
                    currentAppointment.patientId === user.id ||
                    currentAppointment.patientId?._id === user.id ||
                    currentAppointment.patient?._id === user.id ||
                    currentAppointment.patient?.customId === user.customId;

                const otherName = isPatientMe
                    ? (currentAppointment.doctor?.userId?.name || 'Doctor')
                    : (currentAppointment.patient?.name || 'Patient');
                const otherSpecialty = isPatientMe
                    ? (currentAppointment.doctor?.specialty || 'General')
                    : 'Patient';
                const otherAvatarRaw = isPatientMe
                    ? currentAppointment.doctor?.userId?.profileImage
                    : currentAppointment.patient?.profileImage;

                setActiveChat({
                    id: isPatientMe ? (currentAppointment.doctor?.id || currentAppointment.doctorId) : (currentAppointment.patient?.id || currentAppointment.patientId),
                    name: otherName,
                    specialty: otherSpecialty,
                    avatar: getAvatarUrl(otherAvatarRaw, otherName),
                    online: true,
                    unread: 0
                });

                if (isDoctor && !currentAppointment.sessionStartTime) {
                    await chatService.startConsultation(id);
                }

                const history = await chatService.getMessages(id);
                const uiMessages: Message[] = history.map((m: any) => ({
                    id: m._id || m.id,
                    sender: (m.senderModel === 'User' && !isDoctor) || (m.senderModel === 'Doctor' && isDoctor) ? 'user' : 'other',
                    text: m.content,
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: m.read ? 'read' : 'delivered',
                    type: m.type as any,
                }));
                setMessages(uiMessages);

                if (socket) {
                    const mongoId = currentAppointment._id;
                    const customId = currentAppointment.customId || currentAppointment.id;
                    if (mongoId) socket.emit('join-chat', mongoId);
                    if (customId && customId !== mongoId) socket.emit('join-chat', customId);
                }
            } catch (error) {
                console.error("Failed to load chat", error);
                toast.error("Failed to load conversation");
            } finally {
                setIsLoading(false);
            }
        };
        if (id && user) initChat();
        else setIsLoading(false);
    }, [id, user, isDoctor, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleNewMessage = (newMessage: any) => {
            const isMatch = newMessage.appointmentId === id ||
                newMessage.appointmentId === appointment?._id ||
                newMessage.appointmentId === appointment?.id ||
                newMessage.appointmentId === appointment?.customId;

            if (isMatch) {
                const uiMsg: Message = {
                    id: newMessage._id || newMessage.id || Date.now(),
                    sender: (newMessage.senderModel === 'User' && !isDoctor) || (newMessage.senderModel === 'Doctor' && isDoctor) ? 'user' : 'other',
                    text: newMessage.content,
                    time: new Date(newMessage.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'read',
                    type: newMessage.type,
                };
                setMessages((prev) => {
                    const messageId = newMessage._id || newMessage.id;
                    if (messageId && prev.some(m => String(m.id) === String(messageId))) return prev;
                    return [...prev, uiMsg];
                });
            }

            setConversations((prev: any[]) => {
                const existingConvIdx = prev.findIndex(c => c.appointmentId === newMessage.appointmentId);
                const updatedConversations = [...prev];
                if (existingConvIdx !== -1) {
                    const conv = updatedConversations[existingConvIdx];
                    const updatedConv = {
                        ...conv,
                        lastMessage: {
                            content: newMessage.content,
                            createdAt: newMessage.createdAt || new Date().toISOString(),
                            senderModel: newMessage.senderModel
                        },
                        unreadCount: (newMessage.appointmentId !== id) ? (conv.unreadCount + 1) : conv.unreadCount
                    };
                    updatedConversations.splice(existingConvIdx, 1);
                    updatedConversations.unshift(updatedConv);
                } else {
                    chatService.getConversations().then(response => {
                        setConversations(response.data || []);
                    });
                }
                return updatedConversations;
            });
        };

        const onTyping = ({ userId: typingUserId, isTyping }: { userId: string, isTyping: boolean }) => {
            const myId = String(user?.id || (user as any)?._id || "");
            if (String(typingUserId) !== myId) setIsOtherTyping(isTyping);
        };

        const onStatusUpdate = ({ userId: statusUserId, status }: { userId: string, status: 'online' | 'offline' }) => {
            const otherParty = isPatientMe ? appointment?.doctor : appointment?.patient;
            const otherPartyId = otherParty?.userId?.id || otherParty?.userId?._id || otherParty?.id || otherParty?._id || (isPatientMe ? appointment?.doctorId : appointment?.patientId);
            if (statusUserId && otherPartyId && String(statusUserId) === String(otherPartyId)) {
                setActiveChat((prev: any) => ({ ...prev, online: status === 'online' }));
            }
            setConversations((prev: any[]) => prev.map(conv => {
                const myCurrentId = String(user?.id || (user as any)?._id || "");
                const convIsPMe = String(conv.patient?._id || conv.patient?.id || conv.patient) === myCurrentId ||
                    String((conv.patient as any)?.userId?._id || (conv.patient as any)?.userId?.id) === myCurrentId;
                const convOther = convIsPMe ? conv.doctor : conv.patient;
                const convOtherId = convOther?.userId?._id || convOther?.userId?.id || convOther?._id || convOther?.id;
                if (statusUserId && convOtherId && String(convOtherId) === String(statusUserId)) {
                    return { ...conv, isOnline: status === 'online' };
                }
                return conv;
            }));
        };

        const onRead = ({ appointmentId: readAppId }: { appointmentId: string }) => {
            if (readAppId === id || readAppId === appointment?._id || readAppId === appointment?.id) {
                setMessages(prev => prev.map(msg => ({ ...msg, status: 'read' })));
            }
        };

        socket.on('receive-message', handleNewMessage);
        socket.on('user-typing', onTyping);
        socket.on('user-status', onStatusUpdate);
        socket.on('messages-read', onRead);

        const roomId = appointment?._id || appointment?.id || id;
        if (roomId && user && socket) {
            socket.emit('mark-read', { appointmentId: roomId, userId: user.id || user._id });
        }

        return () => {
            socket.off('receive-message', handleNewMessage);
            socket.off('user-typing', onTyping);
            socket.off('user-status', onStatusUpdate);
            socket.off('messages-read', onRead);
        };
    }, [socket, id, isDoctor, appointment, user, isPatientMe]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSaveNote = () => {
        if (!noteText.trim()) return;
        setSavedNotes([{ id: Date.now(), text: noteText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...savedNotes]);
        setNoteText("");
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setInputValue((prev) => prev + emojiData.emoji);
    };

    const handleTyping = () => {
        const roomId = appointment?.id || appointment?._id || id;
        if (!socket || !roomId || !user) return;
        socket.emit('typing', { appointmentId: roomId, userId: user.id || user._id });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop-typing', { appointmentId: roomId, userId: user.id || user._id });
        }, 2000);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !id) return;
        try {
            await chatService.sendMessage(id, inputValue, 'text');
            setInputValue("");
            setShowEmojiPicker(false);
        } catch (error) {
            console.error("Failed to send", error);
            toast.error("Failed to send message");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }
        try {
            const imageUrl = await chatService.uploadAttachment(id, file);
            await chatService.sendMessage(id, imageUrl, 'image');
            toast.success("Image sent");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload image");
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
        if (option.id === 'media' || option.id === 'cam') {
            fileInputRef.current?.click();
        }
        setShowAttachmentMenu(false);
    };

    // Voice Recording Logic
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
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioChunksRef.current.length > 0 && recordingTime > 0) {
                    try {
                        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
                        const audioUrl = await chatService.uploadAttachment(id!, audioFile);
                        await chatService.sendMessage(id!, audioUrl, 'file');
                        toast.success("Voice note sent");
                    } catch (error) {
                        toast.error("Failed to send voice note");
                    }
                }
                stream.getTracks().forEach(track => track.stop());
                audioContext.close();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
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
            clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setAudioLevels([]);
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
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
            clearInterval(timerIntervalRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setAudioLevels([]);
        }
    };

    return (
        <div className="flex h-screen w-full overflow-hidden font-sans bg-white text-slate-900">
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
                                <Globe className="h-3 w-3" />
                                Back to Website
                            </button>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full md:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={isDoctor ? "Search patients..." : "Search doctors..."}
                            className="pl-9 h-10 bg-slate-50 border-slate-200 focus-visible:ring-[#00A1B0]/20 rounded-xl text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {isConversationsLoading ? (
                        <div className="flex flex-col gap-4 p-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="h-12 w-12 rounded-full bg-slate-200" />
                                    <div className="flex-1">
                                        <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
                                        <div className="h-2 w-32 bg-slate-100 rounded" />
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
                            const isPMeInList = conv.patient?._id === user?.id || conv.patient === user?.id || conv.patient?.customId === user?.customId;
                            const otherPartyInList = isPMeInList ? conv.doctor : conv.patient;
                            const nameInList = isPMeInList ? (otherPartyInList?.userId?.name || 'Doctor') : (otherPartyInList?.name || 'Patient');
                            const avatarInList = getAvatarUrl(isPMeInList ? otherPartyInList?.userId?.profileImage : otherPartyInList?.profileImage, nameInList);
                            const isActiveInList = id === conv.appointmentId;

                            return (
                                <div
                                    key={conv.appointmentId}
                                    onClick={() => navigate(isDoctor ? `/doctor/chat/${conv.appointmentId}` : `/patient/chat/${conv.appointmentId}`)}
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
            <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
                <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 min-h-[73px]">
                    {isLoading ? (
                        <div className="flex items-center gap-4 animate-pulse">
                            <div className="h-10 w-10 rounded-full bg-slate-200" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-slate-200 rounded" />
                                <div className="h-3 w-20 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4">
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
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><Search className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                            </div>
                        </>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                    <div className="max-w-3xl mx-auto flex flex-col gap-4">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.type === 'image'
                                        ? 'bg-transparent p-0 overflow-hidden border border-slate-100 shadow-lg'
                                        : msg.sender === 'user' ? 'bg-[#00A1B0] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                        {msg.type === 'image' ? (
                                            <img src={msg.text} alt="" className="max-h-72 w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.text, '_blank')} />
                                        ) : (
                                            <p className="whitespace-pre-wrap font-medium">{formatMessageText(msg.text, msg.sender === 'user')}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 px-1">
                                        <span className="text-[10px] text-slate-400 font-bold">{msg.time}</span>
                                        {msg.sender === 'user' && (msg.status === 'read' ? <CheckCheck className="h-3 w-3 text-[#00A1B0]" /> : <Check className="h-3 w-3 text-slate-300" />)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                            <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`rounded-full transition-colors ${showEmojiPicker ? 'text-[#00A1B0] bg-slate-50' : 'text-slate-400'}`} disabled={isLoading || isRecording}>
                                <Smile className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`rounded-full transition-colors ${showAttachmentMenu ? 'text-[#00A1B0] bg-slate-50' : 'text-slate-400'}`} disabled={isLoading || isRecording}>
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
                                        <Button variant="ghost" size="icon" onClick={stopRecording} className="h-8 w-8 bg-[#00A1B0] text-white hover:bg-[#008f9c] rounded-full shadow-lg shadow-[#00A1B0]/20">
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        placeholder="Type a message..."
                                        className="pr-12 h-11 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#00A1B0]/20 shadow-none"
                                        value={inputValue}
                                        onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={isLoading}
                                    />
                                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                        {!inputValue.trim() ? (
                                            <Button variant="ghost" size="icon" onClick={startRecording} className="text-slate-400 hover:text-[#00A1B0] hover:bg-transparent" disabled={isLoading}>
                                                <Mic className="h-5 w-5" />
                                            </Button>
                                        ) : (
                                            <Button size="icon" onClick={handleSendMessage} className="bg-[#00A1B0] hover:bg-[#008f9c] h-8 w-8 rounded-lg shadow-lg shadow-[#00A1B0]/20 transition-all active:scale-95" disabled={isLoading}>
                                                <Send className="h-4 w-4 text-white" />
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </footer>
            </div>

            {/* Right Sidebar */}
            {isDoctor && (
                <aside className="w-80 bg-slate-50/50 border-l border-slate-100 hidden lg:flex flex-col overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <Card className="shadow-none border-slate-100 bg-white">
                        <CardHeader className="p-4 flex flex-col items-center text-center space-y-3">
                            <div className="h-20 w-20 rounded-full p-1 border-2 border-[#00A1B0]/10">
                                <img src={activeChat.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#00A1B0] tracking-tight">{appointment?.patientId?.name || 'Patient'}</h3>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Patient ID: {appointment?.patientId?.customId}</p>
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
                    <div className="space-y-4 pt-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Notes</h4>
                        <textarea
                            className="w-full bg-white rounded-2xl p-4 border border-slate-100 text-xs h-36 resize-none outline-none focus:ring-4 focus:ring-[#00A1B0]/5 transition-all font-medium placeholder:text-slate-300"
                            placeholder="Add consultation notes here..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                        />
                        <Button onClick={handleSaveNote} className="w-full bg-[#00A1B0] hover:bg-[#008f9c] rounded-xl h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#00A1B0]/10 transition-all active:scale-95"><Plus className="h-4 w-4 mr-2" /> Update Notes</Button>
                    </div>

                    <div className="pt-4 space-y-4">
                        {savedNotes.length > 0 && (
                            <>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">History</h4>
                                <div className="space-y-3">
                                    {savedNotes.map(note => (
                                        <div key={note.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">{note.text}</p>
                                            <p className="text-[8px] text-slate-400 font-black uppercase mt-2">{note.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </aside>
            )}
        </div>
    );
};

export default ChatPage;
