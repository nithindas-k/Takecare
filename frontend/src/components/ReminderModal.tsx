import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Video, MessageSquare } from 'lucide-react';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    customId: string;
    appointmentTime: string;
    appointmentType?: 'video' | 'chat';
    minutesUntilStart?: number;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
    isOpen,
    onClose,
    appointmentId,
    customId,
    appointmentTime,
    appointmentType = 'video',
    minutesUntilStart = 5,
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleJoinNow = () => {
        const path = appointmentType === 'video'
            ? `/consultation/video/${appointmentId}`
            : `/consultation/chat/${appointmentId}`;
        navigate(path);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-teal-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-1 transition"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-full">
                            <Clock size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Appointment Reminder</h2>
                            <p className="text-cyan-100 text-sm">#{customId}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 px-4 py-2 rounded-full mb-4">
                            {appointmentType === 'video' ? <Video size={18} /> : <MessageSquare size={18} />}
                            <span className="font-semibold capitalize">{appointmentType} Consultation</span>
                        </div>

                        <p className="text-gray-700 text-lg mb-2">
                            Your appointment starts in
                        </p>
                        <p className="text-4xl font-bold text-cyan-600 mb-2">
                            {minutesUntilStart} minutes
                        </p>
                        <p className="text-gray-500">
                            Scheduled time: {appointmentTime}
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 text-sm">
                            <strong>Tip:</strong> Please be ready to join. The consultation will start soon!
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Dismiss
                        </button>
                        <button
                            onClick={handleJoinNow}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg hover:from-cyan-600 hover:to-teal-600 transition font-medium shadow-lg"
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
