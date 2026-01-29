/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../redux/user/userSlice';
import { API_BASE_URL } from '../utils/constants';
import { toast } from 'sonner';
import ReminderModal from '../components/common/ReminderModal';

interface SocketContextType {
    socket: Socket | null;
    onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);


export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [reminderData, setReminderData] = useState<any>(null);
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    const user = useSelector(selectCurrentUser);

    const userId = user?.id || (user as any)?._id || (user as any)?.userId;
    const userRole = user?.role;

    useEffect(() => {
        if (userId) {
            const socketUrl = API_BASE_URL.replace(/\/api$/, '');
            console.log(`[SOCKET] Connecting to: ${socketUrl} with userId: ${userId}`);

            const newSocket = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                timeout: 20000,
            });

            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log("[SOCKET] Connected successfully. Socket ID:", newSocket.id);
                newSocket.emit('join', userId);
            });

            newSocket.on('online-users', (users: string[]) => {
                setOnlineUsers(users);
            });

            newSocket.on('user-status', ({ userId: statusUserId, status }: { userId: string, status: 'online' | 'offline' }) => {
                setOnlineUsers(prev => {
                    if (status === 'online') {
                        if (prev.includes(statusUserId)) return prev;
                        return [...prev, statusUserId];
                    } else {
                        return prev.filter(id => id !== statusUserId);
                    }
                });
            });

            newSocket.on('connect_error', (err) => {
                console.error("[SOCKET] Connection Error:", err.message);
                toast.error(`Socket Connection Failed: ${err.message}`, {
                    description: `Target: ${socketUrl}`,
                    id: "socket-error-toast",
                    duration: 5000,
                });
            });

            newSocket.on('disconnect', (reason) => {
                console.warn("Socket Disconnected:", reason);
                setOnlineUsers([]);
            });

            const playNotificationSound = () => {
                const audio = new Audio('/notificationSound.mp3');
                audio.play().catch(err => console.debug("Autoplay prevented or error playing sound:", err));
            };

            newSocket.on('appointment-reminder', (data: any) => {
                playNotificationSound();
                setReminderData(data);
                setIsReminderOpen(true);
            });


            newSocket.on('notification', (notification: any) => {
                const relevantKeywords = [
                    'appointment', 'reschedule', 'consultation', 'payment',
                    'wallet', 'refund', 'earnings', 'confirmed', 'rejected', 'cancelled', 'request'
                ];

                const titleLower = notification.title?.toLowerCase() || '';
                const messageLower = notification.message?.toLowerCase() || '';

                const isRelevant = relevantKeywords.some(keyword =>
                    titleLower.includes(keyword) || messageLower.includes(keyword)
                );

                if (isRelevant) {
                    playNotificationSound();
                }

                const toastOptions = {
                    description: notification.message,
                };

                switch (notification.type) {
                    case 'success':
                        toast.success(notification.title, toastOptions);
                        break;
                    case 'error':
                        toast.error(notification.title, toastOptions);
                        break;
                    case 'warning':
                        toast.warning(notification.title, toastOptions);
                        break;
                    case 'info':
                    default:
                        toast.info(notification.title, toastOptions);
                        break;
                }
            });
            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [userId, userRole]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
            <ReminderModal
                isOpen={isReminderOpen}
                onClose={() => setIsReminderOpen(false)}
                data={reminderData}
                onAction={() => {
                    if (reminderData?.appointmentId) {
                        const path = userRole === 'doctor'
                            ? `/doctor/appointments/${reminderData.appointmentId}`
                            : `/patient/appointments/${reminderData.appointmentId}`;
                        window.location.href = path;
                    }
                    setIsReminderOpen(false);
                }}
            />
        </SocketContext.Provider>
    );
};

export default SocketProvider;
