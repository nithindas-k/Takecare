import React, { useState, useEffect } from 'react';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import AlertDialog from '../../components/common/AlertDialog';
import { FaPlus, FaTrash, FaClock, FaToggleOn, FaToggleOff, FaCalendarTimes } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import { toast } from 'sonner';

interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
}

interface DaySchedule {
    day: string;
    enabled: boolean;
    slots: TimeSlot[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getDefaultSchedule = (): DaySchedule[] => {
    return DAYS_OF_WEEK.map(day => ({
        day,
        enabled: false,
        slots: [],
    }));
    return DAYS_OF_WEEK.map(day => ({
        day,
        enabled: false,
        slots: [],
    }));
};

interface BlockedDate {
    date: Date | string;
    reason?: string;
}

const DoctorSchedule: React.FC = () => {
    const [schedule, setSchedule] = useState<DaySchedule[]>(getDefaultSchedule());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasSchedule, setHasSchedule] = useState(false);
    const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
    const [dayToClear, setDayToClear] = useState<{ dayIndex: number; dayName: string } | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState<{ dayIndex: number; slotId: string; dayName: string; slotTime: string } | null>(null);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [newBlockDate, setNewBlockDate] = useState('');
    const [newBlockReason, setNewBlockReason] = useState('');
    const [activeTab, setActiveTab] = useState<'available' | 'unavailable'>('available');
    const [blockSubmitting, setBlockSubmitting] = useState(false);
    const [blockWholeDay, setBlockWholeDay] = useState(true);
    const [selectedBlockSlots, setSelectedBlockSlots] = useState<string[]>([]);


    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const response = await doctorService.getSchedule();
            console.log('Schedule response:', JSON.stringify(response, null, 2));

            if (response?.success && response.data) {
                const scheduleData = response.data;
                console.log('Schedule data:', JSON.stringify(scheduleData, null, 2));
                setHasSchedule(true);




                const scheduleMap = new Map();
                if (scheduleData.weeklySchedule && Array.isArray(scheduleData.weeklySchedule)) {
                    scheduleData.weeklySchedule.forEach((daySchedule: any) => {
                        scheduleMap.set(daySchedule.day, daySchedule);
                    });
                }

                if (scheduleData.blockedDates && Array.isArray(scheduleData.blockedDates)) {
                    setBlockedDates(scheduleData.blockedDates);
                }

                console.log('Schedule map size:', scheduleMap.size);


                const transformedSchedule = DAYS_OF_WEEK.map((day) => {
                    const backendDay = scheduleMap.get(day);
                    if (backendDay) {
                        const slots = (backendDay.slots || []).map((slot: any, slotIndex: number) => {
                            const slotData = {

                                id: `slot-${day}-${slot.startTime || '09:00'}-${slot.endTime || '10:00'}-${slotIndex}`,
                                startTime: slot.startTime || '09:00',
                                endTime: slot.endTime || '10:00',
                                enabled: slot.enabled !== undefined ? slot.enabled : true,
                            };
                            console.log(`Slot ${slotIndex} for ${day}:`, slotData);
                            return slotData;
                        });

                        console.log(`Day ${day}: enabled=${backendDay.enabled}, slots=${slots.length}`);

                        return {
                            day: backendDay.day,
                            enabled: backendDay.enabled !== undefined ? backendDay.enabled : false,
                            slots: slots,
                        };
                    } else {

                        console.log(`Day ${day} not found in backend, using default`);
                        return {
                            day,
                            enabled: false,
                            slots: [],
                        };
                    }
                });

                console.log('Transformed schedule:', JSON.stringify(transformedSchedule, null, 2));
                setSchedule(transformedSchedule);
            } else {

                console.log('No schedule found, using default. Response:', response);
                setHasSchedule(false);
                setSchedule(getDefaultSchedule());
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            toast.error('Failed to load schedule');
            setSchedule(getDefaultSchedule());
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = async (dayIndex: number) => {
        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].enabled = !updatedSchedule[dayIndex].enabled;



        setSchedule(updatedSchedule);

        if (hasSchedule) {
            setSaving(true);
            try {
                const scheduleData = {
                    weeklySchedule: updatedSchedule.map(daySchedule => ({
                        day: daySchedule.day,
                        enabled: daySchedule.enabled,

                        slots: (daySchedule.slots || []).map(slot => ({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            enabled: slot.enabled !== undefined ? slot.enabled : true,
                        })),
                    })),
                };

                console.log('Sending schedule data to backend:', JSON.stringify(scheduleData, null, 2));

                const response = await doctorService.updateSchedule(scheduleData);

                if (response?.success) {
                    setHasSchedule(true);

                    toast.success('Schedule updated successfully');
                } else {

                    setSchedule(schedule);
                    toast.error(response?.message || 'Failed to update schedule');
                }
            } catch (error) {
                console.error('Error toggling day:', error);

                setSchedule(schedule);
                toast.error('Failed to update schedule');
            } finally {
                setSaving(false);
            }
        }
    };

    const addTimeSlot = (dayIndex: number) => {
        const updatedSchedule = [...schedule];
        const daySchedule = updatedSchedule[dayIndex];
        const slotIndex = daySchedule.slots.length;
        const newSlot: TimeSlot = {

            id: `slot-${daySchedule.day}-09:00-10:00-${slotIndex}`,
            startTime: '09:00',
            endTime: '10:00',
            enabled: true,
        };
        updatedSchedule[dayIndex].slots.push(newSlot);
        setSchedule(updatedSchedule);
    };

    const toggleSlot = (dayIndex: number, slotId: string) => {
        const updatedSchedule = [...schedule];
        const slotIndex = updatedSchedule[dayIndex].slots.findIndex(slot => slot.id === slotId);
        if (slotIndex !== -1) {
            updatedSchedule[dayIndex].slots[slotIndex].enabled = !updatedSchedule[dayIndex].slots[slotIndex].enabled;
            setSchedule(updatedSchedule);
        }
    };

    const handleDeleteClick = (dayIndex: number, slotId: string) => {
        const daySchedule = schedule[dayIndex];
        const slot = daySchedule.slots.find(s => s.id === slotId);

        if (slot) {
            setSlotToDelete({
                dayIndex,
                slotId,
                dayName: daySchedule.day,
                slotTime: `${slot.startTime} - ${slot.endTime}`
            });
            setDeleteDialogOpen(true);
        }
    };

    const confirmDeleteSlot = async () => {
        if (!slotToDelete) return;


        const previousSchedule = [...schedule];


        const updatedSchedule = [...schedule];
        updatedSchedule[slotToDelete.dayIndex].slots = updatedSchedule[slotToDelete.dayIndex].slots.filter(
            slot => slot.id !== slotToDelete.slotId
        );

        if (updatedSchedule[slotToDelete.dayIndex].slots.length === 0) {
            updatedSchedule[slotToDelete.dayIndex].enabled = false;
        }

        setSchedule(updatedSchedule);

        if (!hasSchedule) {
            setSlotToDelete(null);
            toast.success('Time slot deleted');
            return;
        }

        setSaving(true);
        try {

            const scheduleData = {
                weeklySchedule: updatedSchedule.map(daySchedule => ({
                    day: daySchedule.day,
                    enabled: daySchedule.enabled,
                    slots: daySchedule.slots.map(slot => ({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        enabled: slot.enabled !== undefined ? slot.enabled : true,
                    })),
                })),
            };

            const response = await doctorService.updateSchedule(scheduleData);

            if (response?.success) {
                toast.success('Time slot deleted successfully');
                setHasSchedule(true);

            } else {

                setSchedule(previousSchedule);
                toast.error(response?.message || 'Failed to delete time slot');
            }
        } catch (error) {
            console.error('Error deleting slot:', error);

            setSchedule(previousSchedule);
            toast.error('Failed to delete time slot');
        } finally {
            setSaving(false);
            setSlotToDelete(null);
        }
    };

    const handleClearAllClick = (dayIndex: number) => {
        const daySchedule = schedule[dayIndex];


        if (daySchedule.slots.length === 0) {
            toast.error('No slots to clear');
            return;
        }

        setDayToClear({
            dayIndex,
            dayName: daySchedule.day,
        });
        setClearAllDialogOpen(true);
    };

    const confirmClearAllSlots = async () => {
        if (!dayToClear) return;

        const dayIndex = dayToClear.dayIndex;

        const previousSchedule = [...schedule];


        const updatedSchedule = [...schedule];
        updatedSchedule[dayIndex].slots = [];
        updatedSchedule[dayIndex].enabled = false;
        setSchedule(updatedSchedule);

        if (!hasSchedule) {
            setDayToClear(null);
            toast.success('All slots cleared. Day has been disabled.');
            return;
        }

        setSaving(true);
        try {

            const scheduleData = {
                weeklySchedule: updatedSchedule.map(daySchedule => ({
                    day: daySchedule.day,
                    enabled: daySchedule.enabled,
                    slots: daySchedule.slots.map(slot => ({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        enabled: slot.enabled !== undefined ? slot.enabled : true,
                    })),
                })),
            };

            const response = await doctorService.updateSchedule(scheduleData);

            if (response?.success) {
                toast.success('All slots cleared successfully. Day has been disabled.');
                setHasSchedule(true);

            } else {

                setSchedule(previousSchedule);
                toast.error(response?.message || 'Failed to clear slots');
            }
        } catch (error) {
            console.error('Error clearing slots:', error);
            setSchedule(previousSchedule);
            toast.error('Failed to clear slots');
        } finally {
            setSaving(false);
            setDayToClear(null);
        }
    };

    const updateTimeSlot = (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
        const updatedSchedule = [...schedule];
        const slotIndex = updatedSchedule[dayIndex].slots.findIndex(slot => slot.id === slotId);
        if (slotIndex !== -1) {
            const slot = updatedSchedule[dayIndex].slots[slotIndex];
            slot[field] = value;

            const daySchedule = updatedSchedule[dayIndex];
            slot.id = `slot-${daySchedule.day}-${slot.startTime}-${slot.endTime}-${slotIndex}`;

            setSchedule(updatedSchedule);
        }
    };

    const transformScheduleForBackend = () => {
        return {
            weeklySchedule: schedule.map(daySchedule => ({
                day: daySchedule.day,
                enabled: daySchedule.enabled,
                slots: daySchedule.slots.map(slot => ({
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    enabled: slot.enabled !== undefined ? slot.enabled : true,
                })),
            })),
        };
    };

    const validateSchedule = (): boolean => {

        const hasEnabledDay = schedule.some(day => day.enabled);
        if (!hasEnabledDay) {
            toast.error('Please enable at least one day');
            return false;
        }

       
        for (const daySchedule of schedule) {
            if (daySchedule.enabled) {
                if (daySchedule.slots.length === 0) {
                    toast.error(`${daySchedule.day} is enabled but has no time slots`);
                    return false;
                }

                for (const slot of daySchedule.slots) {
                    if (!slot.startTime || !slot.endTime) {
                        toast.error(`Invalid time slot in ${daySchedule.day}`);
                        return false;
                    }

                    const [startHours, startMinutes] = slot.startTime.split(':').map(Number);
                    const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
                    const startTotal = startHours * 60 + startMinutes;
                    const endTotal = endHours * 60 + endMinutes;

                    if (startTotal >= endTotal) {
                        toast.error(`Start time must be before end time in ${daySchedule.day}`);
                        return false;
                    }

                    if (endTotal - startTotal < 15) {
                        toast.error(`Slot duration must be at least 15 minutes in ${daySchedule.day}`);
                        return false;
                    }
                }

                const slots = daySchedule.slots;
                for (let i = 0; i < slots.length; i++) {
                    for (let j = i + 1; j < slots.length; j++) {
                        const slot1 = slots[i];
                        const slot2 = slots[j];

                        const [start1Hours, start1Minutes] = slot1.startTime.split(':').map(Number);
                        const [end1Hours, end1Minutes] = slot1.endTime.split(':').map(Number);
                        const [start2Hours, start2Minutes] = slot2.startTime.split(':').map(Number);
                        const [end2Hours, end2Minutes] = slot2.endTime.split(':').map(Number);

                        const start1 = start1Hours * 60 + start1Minutes;
                        const end1 = end1Hours * 60 + end1Minutes;
                        const start2 = start2Hours * 60 + start2Minutes;
                        const end2 = end2Hours * 60 + end2Minutes;

                        if ((start1 < end2 && end1 > start2) || (start2 < end1 && end2 > start1)) {
                            toast.error(`Overlapping slots detected in ${daySchedule.day}`);
                            return false;
                        }
                    }
                }
            }
        }

        return true;
        return true;
    };

    const getSlotsForDate = (dateStr: string) => {
        if (!dateStr) return [];
        const date = new Date(dateStr);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const dayName = DAYS_OF_WEEK[dayIndex];

        const daySchedule = schedule.find(d => d.day === dayName);
        return (daySchedule?.slots || []).filter(s => s.enabled);
    };

    const handleBlockDate = async () => {
        if (!newBlockDate) {
            toast.error('Please select a date');
            return;
        }

        if (!blockWholeDay && selectedBlockSlots.length === 0) {
            toast.error('Please select at least one slot to block, or choose Block Entire Day');
            return;
        }

        setBlockSubmitting(true);
        try {
            const response = await doctorService.blockDate(newBlockDate, newBlockReason, undefined, !blockWholeDay ? selectedBlockSlots : undefined);
            if (response?.success) {
                toast.success('Date blocked successfully');
                setNewBlockDate('');
                setNewBlockReason('');
                setBlockWholeDay(true);
                setSelectedBlockSlots([]);
                fetchSchedule();
            } else {
                toast.error(response?.message || 'Failed to block date');
            }
        } catch (error) {
            console.error('Error blocking date:', error);
            toast.error('Failed to block date');
        } finally {
            setBlockSubmitting(false);
        }
    };

    const handleUnblockDate = async (date: string | Date) => {
        try {
            const dateStr = date instanceof Date ? date.toISOString() : date;
            const response = await doctorService.unblockDate(dateStr);
            if (response?.success) {
                toast.success('Date unblocked successfully');
                fetchSchedule();
            } else {
                toast.error(response?.message || 'Failed to unblock date');
            }
        } catch (error) {
            console.error('Error unblocking date:', error);
            toast.error('Failed to unblock date');
        }
    };

    const handleSaveSchedule = async () => {
        if (!validateSchedule()) {
            return;
        }

        setSaving(true);
        try {
            const scheduleData = transformScheduleForBackend();
            let response;

            if (hasSchedule) {
                response = await doctorService.updateSchedule(scheduleData);
            } else {
                const profileResponse = await doctorService.getDoctorProfile();
                if (!profileResponse?.success || !profileResponse.data) {
                    toast.error('Failed to get doctor profile');
                    return;
                }

                const doctorId = profileResponse.data.id || profileResponse.data._id;

                response = await doctorService.createSchedule({
                    ...scheduleData,
                    doctorId: doctorId,
                });
            }

            if (response?.success) {
                toast.success('Schedule saved successfully!');
                setHasSchedule(true);

                await fetchSchedule();
            } else {
                toast.error(response?.message || 'Failed to save schedule');
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            toast.error('Failed to save schedule');
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Home', path: '/doctor/dashboard' },
        { label: 'Schedule Settings' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DoctorNavbar />
                <Breadcrumbs
                    items={breadcrumbItems}
                    title="Schedule Settings"
                    subtitle="Manage your weekly availability and time slots"
                />
                <DoctorLayout>
                    <div className="flex items-center justify-center">
                        <div className="animate-spin h-12 w-12 border-b-2 border-[#00A1B0] rounded-full"></div>
                    </div>
                </DoctorLayout>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />

            <Breadcrumbs
                items={breadcrumbItems}
                title="Schedule Settings"
                subtitle="Manage your weekly availability and time slots"
            />

            <DoctorLayout>
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="border-b border-gray-100">
                        <div className="flex gap-1 p-2">
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'available'
                                    ? 'bg-[#00A1B0] text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Available Timings
                            </button>
                            <button
                                onClick={() => setActiveTab('unavailable')}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'unavailable'
                                    ? 'bg-[#00A1B0] text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Unavailable Dates
                            </button>
                        </div>
                    </div>
                </div>

                {/* Available Timings Section */}
                {activeTab === 'available' && (
                    <>
                        {/* Info Banner */}
                        <div className="bg-blue-50 rounded-lg p-3.5 mb-5 flex items-center gap-2.5 text-sm border border-blue-100">
                            <FaClock className="text-blue-600 flex-shrink-0" size={18} />
                            <p className="text-blue-700">
                                Configure your weekly availability. Patients can book appointments during your enabled time slots.
                            </p>
                        </div>

                        {/* Weekly Schedule */}
                        <div className="space-y-3.5">
                            {schedule.map((daySchedule, dayIndex) => (
                                <div
                                    key={daySchedule.day}
                                    className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all ${!daySchedule.enabled ? 'opacity-50' : ''}`}
                                >
                                    {/* Day Header */}
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-bold text-gray-800">{daySchedule.day}</h3>
                                            {daySchedule.enabled && (
                                                <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleDay(dayIndex)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${daySchedule.enabled
                                                ? 'bg-[#00A1B0]/10 text-[#00A1B0] hover:bg-[#00A1B0]/20'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                }`}
                                        >
                                            {daySchedule.enabled ? (
                                                <FaToggleOn size={18} />
                                            ) : (
                                                <FaToggleOff size={18} />
                                            )}
                                        </button>
                                    </div>

                                    {/* Time Slots */}
                                    <div className="p-4">
                                        {daySchedule.slots.length === 0 ? (
                                            <p className="text-center text-gray-400 text-sm py-3">
                                                {daySchedule.enabled ? 'No time slots added' : 'Day is disabled - slots preserved'}
                                            </p>
                                        ) : (
                                            <div className="space-y-2.5 mb-3">
                                                {!daySchedule.enabled && daySchedule.slots.length > 0 && (
                                                    <div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <p className="text-xs text-amber-700">
                                                            <strong>Note:</strong> This day is disabled. Slots are preserved and will be available when you re-enable this day.
                                                        </p>
                                                    </div>
                                                )}
                                                {daySchedule.slots.map((slot) => (
                                                    <div
                                                        key={slot.id}
                                                        className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${!slot.enabled
                                                            ? 'bg-gray-100 border-gray-300 opacity-60'
                                                            : daySchedule.enabled
                                                                ? 'bg-gray-50 border-gray-200'
                                                                : 'bg-gray-100 border-gray-300 opacity-75'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) =>
                                                                    updateTimeSlot(dayIndex, slot.id, 'startTime', e.target.value)
                                                                }
                                                                disabled={!daySchedule.enabled || !slot.enabled}
                                                                className={`text-sm px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent ${daySchedule.enabled
                                                                    ? 'border-gray-300 bg-white'
                                                                    : 'border-gray-300 bg-gray-200 cursor-not-allowed'
                                                                    }`}
                                                            />
                                                            <span className="text-gray-400">—</span>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) =>
                                                                    updateTimeSlot(dayIndex, slot.id, 'endTime', e.target.value)
                                                                }
                                                                disabled={!daySchedule.enabled || !slot.enabled}
                                                                className={`text-sm px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent ${daySchedule.enabled
                                                                    ? 'border-gray-300 bg-white'
                                                                    : 'border-gray-300 bg-gray-200 cursor-not-allowed'
                                                                    }`}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => toggleSlot(dayIndex, slot.id)}
                                                                disabled={!daySchedule.enabled}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${slot.enabled
                                                                    ? 'bg-[#00A1B0]/10 text-[#00A1B0] hover:bg-[#00A1B0]/20'
                                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                                    } ${!daySchedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                title={daySchedule.enabled ? (slot.enabled ? 'Disable slot' : 'Enable slot') : 'Enable day to toggle slots'}
                                                            >
                                                                {slot.enabled ? (
                                                                    <FaToggleOn size={18} />
                                                                ) : (
                                                                    <FaToggleOff size={18} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(dayIndex, slot.id)}
                                                                disabled={!daySchedule.enabled}
                                                                className={`p-2 rounded-lg transition-colors ${daySchedule.enabled
                                                                    ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                                title={daySchedule.enabled ? 'Delete slot' : 'Enable day to delete slots'}
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {daySchedule.enabled && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => addTimeSlot(dayIndex)}
                                                    className="flex-1 px-4 py-2 bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FaPlus size={12} />
                                                    Add Time Slot
                                                </button>
                                                {daySchedule.slots.length > 0 && (
                                                    <button
                                                        onClick={() => handleClearAllClick(dayIndex)}
                                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                        title="Clear all slots (day will be disabled)"
                                                    >
                                                        <FaTrash size={12} />
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Save Button */}
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={handleSaveSchedule}
                                disabled={saving}
                                className="px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Schedule'}
                            </button>
                        </div>
                    </>
                )}

                {/* Unavailable Dates Section */}
                {activeTab === 'unavailable' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <FaCalendarTimes size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Unavailable Dates</h2>
                                <p className="text-sm text-gray-500">Block specific dates when you are not available (holidays, leave, etc.)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">Add Unavailable Date</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newBlockDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                setNewBlockDate(e.target.value);
                                                setSelectedBlockSlots([]);
                                                setBlockWholeDay(true);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                                        />
                                    </div>

                                    {newBlockDate && (
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="blockWholeDay"
                                                    checked={blockWholeDay}
                                                    onChange={(e) => setBlockWholeDay(e.target.checked)}
                                                    className="rounded text-red-600 focus:ring-red-500"
                                                />
                                                <label htmlFor="blockWholeDay" className="text-sm font-medium text-gray-700">
                                                    Block entire day
                                                </label>
                                            </div>

                                            {!blockWholeDay && (
                                                <div className="pl-6 space-y-2">
                                                    <p className="text-xs text-gray-500 font-medium">Select slots to block:</p>
                                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                        {getSlotsForDate(newBlockDate).map((slot, idx) => (
                                                            <label key={idx} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedBlockSlots.includes(slot.startTime)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedBlockSlots([...selectedBlockSlots, slot.startTime]);
                                                                        } else {
                                                                            setSelectedBlockSlots(selectedBlockSlots.filter(s => s !== slot.startTime));
                                                                        }
                                                                    }}
                                                                    className="rounded text-red-600 focus:ring-red-500"
                                                                />
                                                                {slot.startTime} - {slot.endTime}
                                                            </label>
                                                        ))}
                                                        {getSlotsForDate(newBlockDate).length === 0 && (
                                                            <p className="text-xs text-red-500 col-span-2">No slots configured for this day.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                                        <input
                                            type="text"
                                            value={newBlockReason}
                                            onChange={(e) => setNewBlockReason(e.target.value)}
                                            placeholder="e.g. Personal Leave, Conference"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleBlockDate}
                                        disabled={blockSubmitting || !newBlockDate}
                                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <FaCalendarTimes />
                                        {blockWholeDay ? 'Block Entire Date' : 'Block Selected Slots'}
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[600px] overflow-y-auto">
                                <h3 className="font-semibold text-gray-700 mb-4">Currently Unavailable</h3>
                                {blockedDates.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-400 text-sm">No dates blocked</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pr-2">
                                        {blockedDates.map((blocked, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center bg-white px-2 py-1 rounded border border-red-100 shadow-sm">
                                                        <span className="block text-xs font-bold text-red-600 uppercase">
                                                            {new Date(blocked.date).toLocaleString('default', { month: 'short' })}
                                                        </span>
                                                        <span className="block text-lg font-bold text-gray-800 leading-none">
                                                            {new Date(blocked.date).getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {new Date(blocked.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                                                        </p>
                                                        {blocked.reason && (
                                                            <p className="text-xs text-red-600">{blocked.reason}</p>
                                                        )}
                                                        {(blocked as any).slots && (blocked as any).slots.length > 0 ? (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                <span className="font-semibold">{(blocked as any).slots.length} slots blocked</span>
                                                                : {(blocked as any).slots.slice(0, 3).join(', ')}
                                                                {(blocked as any).slots.length > 3 ? '...' : ''}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-1 italic">
                                                                Whole day blocked
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnblockDate(blocked.date)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Unblock date"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DoctorLayout>

            {/* Delete Slot Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Time Slot"
                description={
                    slotToDelete
                        ? `Are you sure you want to delete the time slot ${slotToDelete.slotTime} on ${slotToDelete.dayName}? ${schedule[slotToDelete.dayIndex]?.slots.length === 1 ? 'This is the last slot - the day will be disabled.' : ''} This action cannot be undone.`
                        : 'Are you sure you want to delete this time slot?'
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDeleteSlot}
                variant="destructive"
            />

            {/* Clear All Slots Confirmation Dialog */}
            <AlertDialog
                open={clearAllDialogOpen}
                onOpenChange={setClearAllDialogOpen}
                title="Clear All Slots"
                description={
                    dayToClear
                        ? `Are you sure you want to clear all slots for ${dayToClear.dayName}? The day will be automatically disabled. This action cannot be undone.`
                        : 'Are you sure you want to clear all slots? The day will be automatically disabled.'
                }
                confirmText="Clear All"
                cancelText="Cancel"
                onConfirm={confirmClearAllSlots}
                variant="destructive"
            />
        </div>
    );
};

export default DoctorSchedule;
