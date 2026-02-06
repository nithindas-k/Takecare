import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';

interface ReminderData {
    appointmentId: string;
    customId: string;
    appointmentTime: string;
    appointmentDate: string;
    minutesUntilStart?: number;
    type: '5min_reminder' | 'appointment_ready';
    appointmentType?: 'video' | 'chat';
    isLive?: boolean;
}

interface UseAppointmentRemindersReturn {
    show5MinReminder: boolean;
    showJoinButton: boolean;
    reminderData: ReminderData | null;
    dismiss5MinReminder: () => void;
}


export const useAppointmentReminders = (): UseAppointmentRemindersReturn => {
    const { socket } = useSocket();
    const [show5MinReminder, setShow5MinReminder] = useState(false);
    const [showJoinButton, setShowJoinButton] = useState(false);
    const [reminderData, setReminderData] = useState<ReminderData | null>(null);

    useEffect(() => {
        if (!socket) return;

       
        const handle5MinReminder = (data: ReminderData) => {
            console.log('[Reminder] 5-minute reminder received from server:', data);
            setReminderData(data);
            setShow5MinReminder(true);

       
            toast.success(`Your appointment #${data.customId} starts in 5 minutes!`, {
                duration: 5000,
                icon: '⏰',
            });
        };

        
        const handleAppointmentReady = (data: ReminderData) => {
            console.log('[Reminder] Appointment ready signal received from server:', data);
            setReminderData(data);
            setShowJoinButton(true);
            setShow5MinReminder(false); 

            
            toast.success(`Your appointment #${data.customId} is ready! You can join now.`, {
                duration: 10000,
                icon: '🎯',
            });
        };

        socket.on('appointment-reminder-5min', handle5MinReminder);
        socket.on('appointment-ready', handleAppointmentReady);

        return () => {
            socket.off('appointment-reminder-5min', handle5MinReminder);
            socket.off('appointment-ready', handleAppointmentReady);
        };
    }, [socket]);

    const dismiss5MinReminder = () => {
        setShow5MinReminder(false);
    };

    return {
        show5MinReminder,
        showJoinButton,
        reminderData,
        dismiss5MinReminder,
    };
};
