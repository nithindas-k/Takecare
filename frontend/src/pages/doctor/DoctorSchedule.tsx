import React, { useState, useEffect, useCallback } from 'react';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import AlertDialog from '../../components/common/AlertDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FaPlus, FaTrash, FaClock, FaToggleOn, FaToggleOff, FaCalendarTimes, FaRedo, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import doctorService from '../../services/doctorService';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';

interface TimeSlot {
    id: string;
    customId?: string;
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
    const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
    const [commonSlots, setCommonSlots] = useState<{ startTime: string; endTime: string; customId: string; count: number }[]>([]);
    const [selectedCommonSlots, setSelectedCommonSlots] = useState<string[]>([]);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [newBlockReason, setNewBlockReason] = useState('');
    const [activeTab, setActiveTab] = useState<'available' | 'unavailable' | 'recurring'>('available');
    const [blockSubmitting, setBlockSubmitting] = useState(false);
    const [blockWholeDay, setBlockWholeDay] = useState(true);
    const [selectedBlockSlots, setSelectedBlockSlots] = useState<string[]>([]);
    
    
    const [recurringStartTime, setRecurringStartTime] = useState('');
    const [recurringEndTime, setRecurringEndTime] = useState('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [overlapDialogOpen, setOverlapDialogOpen] = useState(false);
    const [overlapInfo, setOverlapInfo] = useState<{ overlappingDays: string[], nonOverlappingDays: string[] } | null>(null);


  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
        const response = await doctorService.getSchedule();

        if (response?.success && response.data) {
            const scheduleData = response.data;
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

            const transformedSchedule = DAYS_OF_WEEK.map((day) => {
                const backendDay = scheduleMap.get(day);
                if (backendDay) {
                    const slots = (backendDay.slots || []).map((slot: any, slotIndex: number) => {
                        const slotData = {
                            id: `slot-${day}-${slot.startTime || '09:00'}-${slot.endTime || '10:00'}-${slotIndex}`,
                            customId: slot.customId, 
                            startTime: slot.startTime || '09:00',
                            endTime: slot.endTime || '10:00',
                            enabled: slot.enabled !== undefined ? slot.enabled : true,
                        };
                        return slotData;
                    });

                    return {
                        day: backendDay.day,
                        enabled: backendDay.enabled !== undefined ? backendDay.enabled : false,
                        slots: slots,
                    };
                } else {
                    return {
                        day,
                        enabled: false,
                        slots: [],
                    };
                }
            });

            setSchedule(transformedSchedule);
        } else {
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
}, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    useEffect(() => {
        findCommonRecurringSlots();
    }, [schedule]);

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
        const slots = daySchedule.slots;
        const slotIndex = slots.length;

        let startTime = '09:00';
        let endTime = '09:30';

        if (slots.length > 0) {
            const lastSlot = slots[slots.length - 1];
            // Helper to parse time string "HH:MM" to minutes
            const toMinutes = (time: string) => {
                const [h, m] = time.split(':').map(Number);
                return h * 60 + m;
            };
            // Helper to format minutes to "HH:MM"
            const toTimeStr = (mins: number) => {
                const h = Math.floor(mins / 60) % 24;
                const m = mins % 60;
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };

            const lastStartMins = toMinutes(lastSlot.startTime);
            const lastEndMins = toMinutes(lastSlot.endTime);

            // Calculate duration of previous slot (handle crossing midnight if necessary, though simple subtraction usually works for schedule within a day)
            let duration = lastEndMins - lastStartMins;
            if (duration <= 0) duration = 30; // Default to 30 minutes if calculation fails or is weird

            const newStartMins = lastEndMins;
            const newEndMins = lastEndMins + duration;

            startTime = toTimeStr(newStartMins);
            endTime = toTimeStr(newEndMins);
        }

        const newSlot: TimeSlot = {
            id: `slot-${daySchedule.day}-${startTime}-${endTime}-${slotIndex}`,
            startTime,
            endTime,
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

    // Handle recurring slot submission
    const handleRecurringSlots = async () => {
        if (!recurringStartTime || !recurringEndTime) {
            toast.error('Please select both start and end times');
            return;
        }

        if (selectedDays.length === 0) {
            toast.error('Please select at least one day');
            return;
        }

        const [startHours, startMinutes] = recurringStartTime.split(':').map(Number);
        const [endHours, endMinutes] = recurringEndTime.split(':').map(Number);
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;

        if (startTotal >= endTotal) {
            toast.error('Start time must be before end time');
            return;
        }

        if (endTotal - startTotal < 15) {
            toast.error('Slot duration must be at least 15 minutes');
            return;
        }

        try {
            const response = await doctorService.addRecurringSlots({
                startTime: recurringStartTime,
                endTime: recurringEndTime,
                days: selectedDays,
                skipOverlappingDays: false
            });

            if (response?.success) {
                if (response.data?.overlappingDays && response.data.overlappingDays.length > 0) {
                    // Show overlap dialog
                    setOverlapInfo({
                        overlappingDays: response.data.overlappingDays,
                        nonOverlappingDays: response.data.nonOverlappingDays
                    });
                    setOverlapDialogOpen(true);
                } else {
                    // No overlaps, refresh schedule
                    toast.success('Recurring slots added successfully');
                    console.log('Schedule before recurring slots fetch:', JSON.stringify(schedule, null, 2));
                    // Reset form first
                    setRecurringStartTime('');
                    setRecurringEndTime('');
                    setSelectedDays([]);
                    // Then fetch schedule to refresh UI
                    await fetchSchedule();
                    console.log('Schedule after recurring slots fetch:', JSON.stringify(schedule, null, 2));
                }
            } else {
                toast.error(response?.message || 'Failed to add recurring slots');
            }
        } catch (error) {
            console.error('Error adding recurring slots:', error);
            toast.error('Failed to add recurring slots');
        }
    };

    // Continue with overlapping slots (skip overlapping days)
    const handleContinueWithOverlaps = async () => {
        if (overlapInfo) {
            try {
                const response = await doctorService.addRecurringSlots({
                    startTime: recurringStartTime,
                    endTime: recurringEndTime,
                    days: overlapInfo.nonOverlappingDays,
                    skipOverlappingDays: true
                });

                if (response?.success) {
                    toast.success(`Recurring slots added to ${overlapInfo.nonOverlappingDays.length} day(s)`);
                    console.log('Schedule before recurring slots continue:', JSON.stringify(schedule, null, 2));
                    // Reset form first
                    setRecurringStartTime('');
                    setRecurringEndTime('');
                    setSelectedDays([]);
                    setOverlapDialogOpen(false);
                    setOverlapInfo(null);
                    // Then fetch schedule to refresh UI
                    await fetchSchedule();
                    console.log('Schedule after recurring slots continue:', JSON.stringify(schedule, null, 2));
                } else {
                    toast.error(response?.message || 'Failed to add recurring slots');
                }
            } catch (error) {
                console.error('Error adding recurring slots:', error);
                toast.error('Failed to add recurring slots');
            }
        }
    };

    // Toggle day selection for recurring slots
    const toggleDaySelection = (day: string) => {
        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    // Delete recurring slot
    const handleDeleteRecurringSlot = async (day: string, slotId: string, slotTime: string) => {
        try {
            const response = await doctorService.deleteRecurringSlot(day, slotId);
            if (response?.success) {
                console.log('Schedule before fetch:', JSON.stringify(schedule, null, 2));
                await fetchSchedule();
                console.log('Schedule after fetch:', JSON.stringify(schedule, null, 2));
                toast.success(`Slot ${slotTime} on ${day} deleted successfully`);
            } else {
                toast.error(response?.message || 'Failed to delete slot');
            }
        } catch (error) {
            console.error('Error deleting recurring slot:', error);
            toast.error('Failed to delete slot');
        }
    };

    // Find common recurring slots across enabled days
    const findCommonRecurringSlots = () => {
        const slotMap = new Map<string, { startTime: string; endTime: string; count: number; customIds: string[] }>();
        
        // Get all enabled days with slots
        const enabledDays = schedule.filter(day => day.enabled && day.slots.length > 0);
        
        // Count occurrences of each time slot across enabled days
        enabledDays.forEach(day => {
            day.slots.forEach(slot => {
                const key = `${slot.startTime}-${slot.endTime}`;
                if (slotMap.has(key)) {
                    const existing = slotMap.get(key)!;
                    existing.count++;
                    if (slot.customId && !existing.customIds.includes(slot.customId)) {
                        existing.customIds.push(slot.customId);
                    }
                } else {
                    slotMap.set(key, {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        count: 1,
                        customIds: slot.customId ? [slot.customId] : []
                    });
                }
            });
        });
        
        // Filter slots that appear in more than one day
        const commonSlots = Array.from(slotMap.values())
            .filter(slot => slot.count > 1)
            .map(slot => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                customId: slot.customIds[0], // Use first customId as identifier
                count: slot.count
            }));
        
        setCommonSlots(commonSlots);
    };

    // Handle deletion of selected common recurring slots
    const handleDeleteCommonRecurringSlots = () => {
        if (selectedCommonSlots.length === 0) {
            toast.error('Please select at least one slot to delete');
            return;
        }

        // Show confirmation dialog instead of directly deleting
        setShowDeleteConfirmation(true);
    };

    // Computed values for select all functionality
    const areAllSlotsSelected = commonSlots.length > 0 && selectedCommonSlots.length === commonSlots.length;
    const areSomeSlotsSelected = selectedCommonSlots.length > 0 && selectedCommonSlots.length < commonSlots.length;

    // Handle select all checkbox
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCommonSlots(commonSlots.map(slot => slot.customId));
        } else {
            setSelectedCommonSlots([]);
        }
    };

    // Confirm and delete slots
const confirmDeleteSlots = async () => {
    try {
        let totalDeleted = 0;
        
        // For each selected common slot, delete it from all days
        for (const slotIdentifier of selectedCommonSlots) {
            const slot = commonSlots.find(s => s.customId === slotIdentifier);
            if (!slot) continue;

            const result = await doctorService.deleteRecurringSlotByTime(slot.startTime, slot.endTime);
            
            if (result?.success) {
                totalDeleted++;
            }
        }
        
        if (totalDeleted > 0) {
            toast.success(`Successfully deleted ${totalDeleted} recurring slot(s) from all days`);
        } else {
            toast.error('No slots were deleted');
        }
        
        // Reset states and refresh
        setIsClearAllModalOpen(false);
        setSelectedCommonSlots([]);
        setShowDeleteConfirmation(false);
        
        // Refresh the schedule
        await fetchSchedule();
        
    } catch (error) {
        console.error('Error deleting common recurring slots:', error);
        toast.error('Failed to delete common recurring slots');
    }
};


    // Open Clear All Recurring Slots modal
    const handleOpenClearAllModal = () => {
        setIsClearAllModalOpen(true);
        setSelectedCommonSlots([]);
    };

const handleClearSlotFromAllDays = async (startTime: string, endTime: string) => {
    try {
        console.log("Deleting slot from all days", { 
            timeRange: `${startTime} - ${endTime}`
        });
        
        const result = await doctorService.deleteRecurringSlotByTime(startTime, endTime);
        
        if (result?.success) {
            toast.success(`Slot ${startTime} - ${endTime} deleted from all days`);
        } else {
            toast.error(result?.message || 'Failed to delete slot from all days');
        }
        
        // Refresh the schedule to show updated data
        await fetchSchedule();
        
    } catch (error) {
        console.error('Error clearing slot from all days:', error);
        toast.error('Failed to clear slot from all days');
    }
};
    const breadcrumbItems = [
        { label: 'Home', path: '/doctor/dashboard' },
        { label: 'Schedule Settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />
            <Breadcrumbs
                items={breadcrumbItems}
                title="Schedule Settings"
                subtitle="Manage your weekly availability and time slots"
            />

            <DoctorLayout>
                {loading ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                            <div className="flex gap-1">
                                <Skeleton className="flex-1 h-10 rounded-lg" />
                                <Skeleton className="flex-1 h-10 rounded-lg" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-8 w-16 rounded-lg" />
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <Skeleton className="h-10 w-full rounded-lg" />
                                        <div className="flex gap-2">
                                            <Skeleton className="flex-1 h-10 rounded-lg" />
                                            <Skeleton className="w-24 h-10 rounded-lg" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
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
                                        onClick={() => setActiveTab('recurring')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${activeTab === 'recurring'
                                            ? 'bg-[#00A1B0] text-white'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        Recurring Slots
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

                        {activeTab === 'available' && (
                            <>
                                <div className="bg-blue-50 rounded-lg p-3.5 mb-5 flex items-center gap-2.5 text-sm border border-blue-100">
                                    <FaClock className="text-blue-600 flex-shrink-0" size={18} />
                                    <p className="text-blue-700">Configure your weekly availability. Patients can book appointments during your enabled time slots.</p>
                                </div>

                                <div className="space-y-3.5">
                                    {schedule.map((daySchedule, dayIndex) => (
                                        <div key={daySchedule.day} className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all ${!daySchedule.enabled ? 'opacity-50' : ''}`}>
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="font-bold text-gray-800">{daySchedule.day}</h3>
                                                    {daySchedule.enabled && (<span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">Active</span>)}
                                                </div>
                                                <button onClick={() => toggleDay(dayIndex)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${daySchedule.enabled ? 'bg-[#00A1B0]/10 text-[#00A1B0] hover:bg-[#00A1B0]/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{daySchedule.enabled ? (<FaToggleOn size={18} />) : (<FaToggleOff size={18} />)}</button>
                                            </div>
                                            <div className="p-4">
                                                {daySchedule.slots.length === 0 ? (<p className="text-center text-gray-400 text-sm py-3">{daySchedule.enabled ? 'No time slots added' : 'Day is disabled - slots preserved'}</p>) : (
                                                    <div className="space-y-2.5 mb-3">
                                                        {!daySchedule.enabled && daySchedule.slots.length > 0 && (<div className="mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-xs text-amber-700"><strong>Note:</strong> This day is disabled. Slots are preserved and will be available when you re-enable this day.</p></div>)}
                                                        {daySchedule.slots.map((slot) => (
                                                            <div key={slot.id} className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${!slot.enabled ? 'bg-gray-100 border-gray-300 opacity-60' : daySchedule.enabled ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-75'}`}>
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <input type="time" value={slot.startTime} onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'startTime', e.target.value)} disabled={!daySchedule.enabled || !slot.enabled} className={`text-sm px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent ${daySchedule.enabled ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-200 cursor-not-allowed'}`} />
                                                                    <span className="text-gray-400">—</span>
                                                                    <input type="time" value={slot.endTime} onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'endTime', e.target.value)} disabled={!daySchedule.enabled || !slot.enabled} className={`text-sm px-2.5 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent ${daySchedule.enabled ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-200 cursor-not-allowed'}`} />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => toggleSlot(dayIndex, slot.id)} disabled={!daySchedule.enabled} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${slot.enabled ? 'bg-[#00A1B0]/10 text-[#00A1B0] hover:bg-[#00A1B0]/20' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${!daySchedule.enabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={daySchedule.enabled ? (slot.enabled ? 'Disable slot' : 'Enable slot') : 'Enable day to toggle slots'}>{slot.enabled ? (<FaToggleOn size={18} />) : (<FaToggleOff size={18} />)}</button>
                                                                    <button onClick={() => handleDeleteClick(dayIndex, slot.id)} disabled={!daySchedule.enabled} className={`p-2 rounded-lg transition-colors ${daySchedule.enabled ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} title={daySchedule.enabled ? 'Delete slot' : 'Enable day to delete slots'}><FaTrash size={12} /></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {daySchedule.enabled && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => addTimeSlot(dayIndex)} className="flex-1 px-4 py-2 bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"><FaPlus size={12} />Add Time Slot</button>
                                                        {daySchedule.slots.length > 0 && (<button onClick={() => handleClearAllClick(dayIndex)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2" title="Clear all slots (day will be disabled)"><FaTrash size={12} />Clear All</button>)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 mb-12">
                                    <button onClick={handleSaveSchedule} disabled={saving} className={`w-full py-3 rounded-lg font-medium text-[#00A1B0] bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 transition-colors flex items-center justify-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>{saving ? (<><div className="w-4 h-4 border-2 border-[#00A1B0] border-t-transparent rounded-full animate-spin" />Saving Changes...</>) : (<>Save Weekly Schedule</>)}</button>
                                </div>
                            </>
                        )}

                        {activeTab === 'recurring' && (
                            <>
                                <div className="bg-green-50 rounded-lg p-3.5 mb-5 flex items-center gap-2.5 text-sm border border-green-100">
                                    <FaRedo className="text-green-600 flex-shrink-0" size={18} />
                                    <p className="text-green-700">Add recurring time slots to multiple days at once. Overlapping slots will be detected and you can choose to skip those days.</p>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <FaRedo className="text-green-600" />
                                        Add Recurring Slots
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start Time</label>
                                            <input 
                                                type="time" 
                                                value={recurringStartTime} 
                                                onChange={(e) => setRecurringStartTime(e.target.value)} 
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1B0]" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">End Time</label>
                                            <input 
                                                type="time" 
                                                value={recurringEndTime} 
                                                onChange={(e) => setRecurringEndTime(e.target.value)} 
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1B0]" 
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Select Days</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                            {DAYS_OF_WEEK.map((day) => {
                                                const isSelected = selectedDays.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => toggleDaySelection(day)}
                                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                                                            isSelected 
                                                                ? 'bg-[#00A1B0] text-white border-[#00A1B0] shadow-md' 
                                                                : 'bg-white border-gray-200 text-gray-600 hover:border-[#00A1B0] hover:text-[#00A1B0]'
                                                        }`}
                                                    >
                                                        {day.slice(0, 3)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleRecurringSlots}
                                        className="flex-1 px-4 py-2 bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaPlus size={12} />
                                        Add Recurring Slot
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-gray-800">Current Schedule Preview</h3>
                                        <button 
                                            onClick={handleOpenClearAllModal}
                                            className="px-4 py-2 bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaTrash size={12} />
                                            Clear All Recurring Slots
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {schedule.map((daySchedule) => (
                                            <div key={daySchedule.day} className={`p-4 rounded-lg border ${daySchedule.enabled && daySchedule.slots.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-800">{daySchedule.day}</h4>
                                                    {daySchedule.enabled && daySchedule.slots.length > 0 && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                            {daySchedule.slots.filter(s => s.enabled).length} slots
                                                        </span>
                                                    )}
                                                </div>
                                                {daySchedule.enabled && daySchedule.slots.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {daySchedule.slots.filter(s => s.enabled).map((slot) => (
                                                            <div key={slot.id} className="px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs rounded flex items-center gap-2">
                                                                <span>{slot.startTime} - {slot.endTime}</span>
                                                                <button
                                                                    onClick={() => handleDeleteRecurringSlot(daySchedule.day, slot.customId || slot.id, `${slot.startTime} - ${slot.endTime}`)}
                                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                                    title="Delete slot from this day"
                                                                >
                                                                    <FaTrash size={10} />
                                                                </button>

                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No slots configured</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'unavailable' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaCalendarTimes className="text-red-500" />Block Time Off</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Date</label>
                                            <input type="date" value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1B0]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reason (Optional)</label>
                                            <input type="text" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} placeholder="Vacation, family emergency, etc." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A1B0]" />
                                        </div>
                                    </div>
                                    {newBlockDate && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex items-center gap-6 mb-4">
                                                <label className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" checked={blockWholeDay} onChange={() => setBlockWholeDay(true)} className="w-4 h-4 text-[#00A1B0] focus:ring-[#00A1B0]" /><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Block Entire Day</span></label>
                                                <label className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" checked={!blockWholeDay} onChange={() => setBlockWholeDay(false)} className="w-4 h-4 text-[#00A1B0] focus:ring-[#00A1B0]" /><span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Block Specific Slots</span></label>
                                            </div>
                                            {!blockWholeDay && (
                                                <div className="space-y-3">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Select slots to block:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {getSlotsForDate(newBlockDate).length > 0 ? (getSlotsForDate(newBlockDate).map((slot) => {
                                                            const isSelected = selectedBlockSlots.includes(slot.startTime);
                                                            return (<button key={slot.startTime} onClick={() => setSelectedBlockSlots(prev => isSelected ? prev.filter(s => s !== slot.startTime) : [...prev, slot.startTime])} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-red-500 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'}`}>{slot.startTime} - {slot.endTime}</button>);
                                                        })) : (<p className="text-sm text-gray-500 italic">No available slots found for this day.</p>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={handleBlockDate} disabled={blockSubmitting} className={`flex-1 px-4 py-2 bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${blockSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{blockSubmitting ? (<div className="w-4 h-4 border-2 border-[#00A1B0] border-t-transparent rounded-full animate-spin" />) : (<FaPlus size={12} />)}Add Unavailable Date</button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">Your Blocked Dates</h3></div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50"><tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Reason</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {blockedDates.length === 0 ? (<tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">No blocked dates found.</td></tr>) : (blockedDates.map((block, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4"><span className="text-sm font-bold text-gray-800">{new Date(block.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
                                                        <td className="px-6 py-4"><span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-100">Blocked</span></td>
                                                        <td className="px-6 py-4 font-medium text-gray-500 text-sm">{block.reason || 'None provided'}</td>
                                                        <td className="px-6 py-4 text-right"><button onClick={() => handleUnblockDate(block.date)} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove block"><FaTrash size={14} /></button></td>
                                                    </tr>
                                                )))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DoctorLayout>

            <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen} title="Clear all slots?" description={`Are you sure you want to clear all time slots for ${dayToClear?.dayName}? This will also disable the day.`} confirmText="Clear All" cancelText="Cancel" variant="destructive" onConfirm={confirmClearAllSlots} />
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete time slot?" description={`Are you sure you want to delete the slot for ${slotToDelete?.slotTime} on ${slotToDelete?.dayName}?`} confirmText="Delete" cancelText="Cancel" variant="destructive" onConfirm={confirmDeleteSlot} />
            
            {/* Overlap Detection Custom Dialog */}
            {overlapDialogOpen && overlapInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOverlapDialogOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl border border-gray-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                                    <FaExclamationTriangle size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Overlapping Slots Detected</h3>
                            </div>
                            <button
                                onClick={() => setOverlapDialogOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="space-y-3">
                                <p className="text-amber-700 font-medium">
                                    ⚠️ Found overlapping slots on {overlapInfo.overlappingDays.length} day(s):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {overlapInfo.overlappingDays.map(day => (
                                        <span key={day} className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded border border-red-200">
                                            {day}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-green-700 font-medium">
                                    ✓ Can add slots to {overlapInfo.nonOverlappingDays.length} day(s):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {overlapInfo.nonOverlappingDays.map(day => (
                                        <span key={day} className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded border border-green-200">
                                            {day}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600">
                                    Would you like to continue and add slots only to the non-overlapping days?
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setOverlapDialogOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleContinueWithOverlaps}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#00A1B0] rounded-lg hover:bg-[#008f9c] transition-colors"
                            >
                                Continue (Skip Overlapping Days)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear All Recurring Slots Modal */}
            <Dialog open={isClearAllModalOpen} onOpenChange={setIsClearAllModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Clear Recurring Slots</DialogTitle>
                        <DialogDescription>
                            Select the common recurring slots you want to delete from all days.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {!showDeleteConfirmation ? (
                        <>
                            <div className="grid gap-4 py-4">
                                {commonSlots.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-gray-600">No common recurring slots found across multiple days.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Select All Checkbox */}
                                        {commonSlots.length > 1 && (
                                            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={areAllSlotsSelected}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                                <label
                                                    htmlFor="select-all"
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {areAllSlotsSelected ? 'Deselect All' : areSomeSlotsSelected ? 'Select All (Partial)' : `Select All (${commonSlots.length} slots)`}
                                                </label>
                                            </div>
                                        )}
                                        
                                        {/* Individual Slots */}
                                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                                            {commonSlots.map((slot) => (
                                                <div key={slot.customId} className="flex items-center space-x-3 p-2 hover:bg-white rounded transition-colors">
                                                    <Checkbox
                                                        id={slot.customId}
                                                        checked={selectedCommonSlots.includes(slot.customId)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedCommonSlots((prev) =>
                                                                checked
                                                                    ? [...prev, slot.customId]
                                                                    : prev.filter((id) => id !== slot.customId)
                                                            );
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={slot.customId}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center justify-between"
                                                    >
                                                        <span className="font-semibold text-gray-900">
                                                            {slot.startTime} - {slot.endTime}
                                                        </span>
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                            {slot.count} days
                                                        </span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Selection Summary */}
                                        {selectedCommonSlots.length > 0 && (
                                            <div className="text-sm text-gray-600 text-center">
                                                {selectedCommonSlots.length} of {commonSlots.length} slots selected
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsClearAllModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleDeleteCommonRecurringSlots}
                                    disabled={selectedCommonSlots.length === 0}
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete Selected Slots ({selectedCommonSlots.length})
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        /* Confirmation Dialog */
                        <div className="py-4">
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <FaTrash className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Confirm Deletion
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Are you sure you want to delete {selectedCommonSlots.length} common recurring slot{selectedCommonSlots.length > 1 ? 's' : ''}?
                                </p>
                                <p className="text-xs text-gray-500">
                                    This action will remove these slots from all days they appear on and cannot be undone.
                                </p>
                            </div>
                            
                            <div className="space-y-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Slots to be deleted:</p>
                                {selectedCommonSlots.map(slotId => {
                                    const slot = commonSlots.find(s => s.customId === slotId);
                                    return slot ? (
                                        <div key={slotId} className="text-xs text-gray-600 flex justify-between">
                                            <span>{slot.startTime} - {slot.endTime}</span>
                                            <span className="text-gray-500">({slot.count} days)</span>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowDeleteConfirmation(false)}
                                >
                                    Back
                                </Button>
                                <Button 
                                    onClick={confirmDeleteSlots}
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Yes, Delete {selectedCommonSlots.length} Slot{selectedCommonSlots.length > 1 ? 's' : ''}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DoctorSchedule;
