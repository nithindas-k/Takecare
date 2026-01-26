import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FaCalendarAlt } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import { toast } from 'sonner';
import type { Slot } from '../../types/appointment.types';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (slot: Slot, date: Date) => Promise<void>;
    doctorId: string;
    doctorName: string;
    currentDate?: Date;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, onConfirm, doctorId, doctorName, currentDate }) => {
    const [startDate, setStartDate] = useState(currentDate || new Date());
    const [selectedDay, setSelectedDay] = useState<Date>(currentDate || new Date());
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const formatDate = (date: Date) => {
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date
        };
    };

    const generateDays = (start: Date) => {
        const daysArr = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            daysArr.push(formatDate(d));
        }
        return daysArr;
    };

    const days = generateDays(startDate);

    const groupSlotsByTime = (slots: any[]) => {
        const grouped: { [key: string]: any[] } = {};
        slots.forEach(slot => {
            const hour = parseInt(slot.startTime.split(':')[0]);
            let period = 'Evening';
            if (hour < 12) period = 'Morning';
            else if (hour < 17) period = 'Afternoon';

            if (!grouped[period]) grouped[period] = [];
            grouped[period].push(slot);
        });
        return grouped;
    };

    const groupedSlots = groupSlotsByTime(availableSlots);

    const formatTimeTo12h = (timeStr: string) => {
        if (!timeStr) return 'N/A';

        return timeStr.split('-').map(part => {
            const [hours, minutes] = part.trim().split(':');
            let h = parseInt(hours);
            const m = minutes || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        }).join(' - ');
    };

    useEffect(() => {
        const fetchSlots = async () => {
            if (!isOpen || !doctorId || !selectedDay) return;

            setLoadingSlots(true);
            try {
                const year = selectedDay.getFullYear();
                const month = String(selectedDay.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDay.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const response = await doctorService.getAvailableSlots(doctorId, dateStr);
                if (response?.success) {
                    let slots = response.data || [];

             
                    const now = new Date();
                    const isToday = selectedDay.toDateString() === now.toDateString();

                    if (isToday) {
                        slots = slots.filter((slot: Slot) => {
                            const [hours, minutes] = slot.startTime.split(':').map(Number);
                            const slotDate = new Date();
                            slotDate.setHours(hours, minutes, 0, 0);
                            return slotDate > now;
                        });
                    }

                    setAvailableSlots(slots);
                }
            } catch (err) {
                console.error("Failed to fetch slots:", err);
                toast.error("Failed to load available slots");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [isOpen, selectedDay, doctorId]);

    const handleConfirm = async () => {
        if (!selectedSlot || !selectedDay) return;
        setSubmitting(true);
        try {
            await onConfirm(selectedSlot, selectedDay);
            onClose();
        } catch (error) {
            console.error("Error confirming reschedule:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    if (!submitting) onClose();
                }}
            />

            <div className="relative z-50 w-full max-w-2xl mx-4">
                <Card className="max-h-[90vh] overflow-y-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FaCalendarAlt className="text-[#00A1B0]" />
                            Reschedule Appointment
                        </CardTitle>
                        <CardDescription>
                            Select a new date and time for your appointment with {doctorName}.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Date Selection - Horizontal Strip */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700">Select Date</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={startDate.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        const d = new Date(e.target.value);
                                        if (!isNaN(d.getTime())) {
                                            setStartDate(d);
                                            setSelectedDay(d);
                                            setSelectedSlot(null);
                                        }
                                    }}
                                    className="text-xs border-gray-200 rounded p-1 focus:ring-[#00A1B0]"
                                />
                            </div>

                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                <div className="grid grid-cols-7 gap-2">
                                    {days.map((item, index) => {
                                        const isSelected = selectedDay.toDateString() === item.fullDate.toDateString();
                                        return (
                                            <div
                                                key={index}
                                                className={`cursor-pointer group text-center p-2 rounded-lg transition-all ${isSelected ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedDay(item.fullDate);
                                                    setSelectedSlot(null);
                                                }}
                                            >
                                                <h4 className={`font-bold text-[10px] uppercase mb-1 transition-colors ${isSelected ? 'text-[#00A1B0]' : 'text-gray-400 group-hover:text-[#00A1B0]'}`}>
                                                    {item.day.slice(0, 3)}
                                                </h4>
                                                <p className={`text-xs font-semibold transition-colors ${isSelected ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                                    {item.fullDate.getDate()}
                                                </p>
                                                <div className={`h-1 mx-auto mt-1 rounded-full transition-all duration-300 ${isSelected ? 'w-4 bg-[#00A1B0]' : 'w-0'}`}></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Slot Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-gray-700">Available Slots</label>
                            {loadingSlots ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#00A1B0]"></div>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 text-sm">No slots available for this date.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(groupedSlots).map(([period, slots]) => (
                                        <div key={period} className="space-y-3">
                                            <h4 className="text-[#002f33] font-bold text-xs uppercase tracking-wider">{period}</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {slots.map((slot, index) => {
                                                    const slotKey = slot.slotId || slot.customId || `${slot.startTime}-${slot.endTime}`;
                                                    const isSelected = selectedSlot && (selectedSlot.slotId || selectedSlot.customId || `${selectedSlot.startTime}-${selectedSlot.endTime}`) === slotKey;
                                                    const isAvailable = slot.isAvailable !== false && slot.available !== false;

                                                    return (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            disabled={!isAvailable}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`px-4 py-2.5 rounded-md text-xs font-semibold transition-all min-w-[100px] border ${isSelected
                                                                ? 'bg-[#00A1B0] text-white border-[#00A1B0] shadow-md transform scale-105'
                                                                : !isAvailable
                                                                    ? 'bg-red-500 bg-opacity-10 text-red-500 border-red-200 cursor-not-allowed opacity-60'
                                                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#00A1B0] hover:bg-white hover:text-[#00A1B0] group-hover:shadow-sm'
                                                                }`}
                                                        >
                                                            {formatTimeTo12h(slot.startTime)} - {formatTimeTo12h(slot.endTime)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end gap-3 border-t pt-6">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={submitting || !selectedSlot}
                            className="bg-[#00A1B0] hover:bg-[#008f9c] text-white"
                        >
                            {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default RescheduleModal;
