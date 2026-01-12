import React, { useState, useEffect, useCallback } from 'react';
import { FaBell, FaCircle } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import AlertDialog from './AlertDialog';

interface Notification {
    _id: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    type: string;
    title: string;
}

interface NotificationDropdownProps {
    color?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ color = 'text-white' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const { socket } = useSocket();

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (socket) {
            const handleNotification = (notification: Notification) => {
                setNotifications((prev) => [notification, ...prev]);
            };

            const handleClearNotifications = () => {
                setNotifications([]);
            };

            socket.on('notification', handleNotification);
            socket.on('clear-notifications', handleClearNotifications);

            return () => {
                socket.off('notification', handleNotification);
                socket.off('clear-notifications', handleClearNotifications);
            };
        }
    }, [socket]);

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const clearAll = async () => {
        if (notifications.length === 0) return;
        setShowClearConfirm(true);
    };

    const confirmClearAll = async () => {
        try {
            await notificationService.clearAll();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.deleteNotification(id);
            setNotifications((prev) => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.isRead) {
            try {
                await notificationService.markAsRead(notif._id);
                setNotifications((prev) => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 ${color} ${color.includes('white') ? 'hover:bg-white/10' : 'hover:bg-slate-50'} rounded-full transition-all duration-300 active:scale-95`}
            >
                <FaBell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center font-bold shadow-lg">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[11px] bg-[#00A1B0] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-[#00A1B0] hover:text-[#008f9c] font-bold transition-colors"
                                >
                                    Mark all as read
                                </button>
                                {notifications.length > 0 && (
                                    <>
                                        <div className="h-3 w-px bg-gray-200"></div>
                                        <button
                                            onClick={clearAll}
                                            className="text-xs text-red-500 hover:text-red-600 font-bold transition-colors"
                                        >
                                            Clear all history
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center text-gray-400">
                                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaBell className="opacity-20" size={32} />
                                    </div>
                                    <p className="font-medium">All caught up!</p>
                                    <p className="text-xs mt-1">No new notifications to show</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`group px-5 py-4 hover:bg-gray-50 transition-all cursor-pointer border-l-4 relative ${notif.isRead ? 'border-transparent' : 'border-[#00A1B0] bg-blue-50/20'}`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <h4 className={`text-sm leading-tight ${notif.isRead ? 'font-medium text-gray-600' : 'font-bold text-gray-900'}`}>
                                                    {notif.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {!notif.isRead && <FaCircle className="text-[#00A1B0] text-[8px]" />}
                                                <button
                                                    onClick={(e) => deleteNotification(notif._id, e)}
                                                    className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                            </span>
                                            {notif.type && (
                                                <span className={`text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded font-bold ${notif.type === 'success' ? 'bg-green-100 text-green-700' :
                                                    notif.type === 'error' ? 'bg-red-100 text-red-700' :
                                                        notif.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {notif.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 text-center border-t border-gray-50 bg-white">
                                <button className="text-xs text-gray-400 hover:text-[#00A1B0] font-bold py-1 w-full transition-colors uppercase tracking-widest">
                                    Notification Center
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            <AlertDialog
                open={showClearConfirm}
                onOpenChange={setShowClearConfirm}
                title="Clear All Notifications"
                description="Are you sure you want to permanently delete your entire notification history? This action cannot be undone."
                confirmText="Clear All"
                cancelText="Keep Them"
                variant="destructive"
                onConfirm={confirmClearAll}
            />
        </div>
    );
};

export default NotificationDropdown;
