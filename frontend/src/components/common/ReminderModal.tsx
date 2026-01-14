import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaTimes, FaStethoscope } from 'react-icons/fa';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        message: string;
        customId: string;
        type?: string;
    } | null;
    onAction?: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, data, onAction }) => {
    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-[2px]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-[360px] overflow-hidden border border-gray-100"
                    >
                        <div className="p-1 px-4 pt-4 flex justify-end">
                            <button
                                onClick={onClose}
                                className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="px-8 pb-8 flex flex-col items-center text-center">
                            {/* Animated Icon Container */}
                            <div className="relative mb-6">
                                <div className={`absolute inset-0 ${data.type === 'appointment_started' ? 'bg-green-500/10' : 'bg-[#00A1B0]/10'} rounded-full animate-ping`}></div>
                                <div className={`relative ${data.type === 'appointment_started' ? 'bg-green-50' : 'bg-[#00A1B0]/5'} p-5 rounded-full`}>
                                    {data.type === 'appointment_started' ? (
                                        <FaStethoscope size={32} className="text-green-500" />
                                    ) : (
                                        <FaClock size={32} className="text-[#00A1B0]" />
                                    )}
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {data.title}
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                {data.message}
                            </p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reference ID</span>
                                    <span className="text-sm font-semibold text-gray-700">#{data.customId}</span>
                                </div>
                                <div className={`flex items-center justify-center gap-2 text-[11px] ${data.type === 'appointment_started' ? 'text-green-500' : 'text-[#00A1B0]'} font-bold uppercase tracking-wide`}>
                                    {data.type === 'appointment_started' ? (
                                        <>
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span>Session is Live</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaClock size={12} />
                                            <span>Preparation Required</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="w-full flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-[0.98]"
                                >
                                    Okay
                                </button>
                                <button
                                    onClick={onAction || onClose}
                                    className={`flex-1 ${data.type === 'appointment_started' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#00A1B0] hover:bg-[#008f9c]'} text-white py-3.5 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] shadow-sm`}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReminderModal;
