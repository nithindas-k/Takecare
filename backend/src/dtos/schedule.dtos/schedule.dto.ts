import { DayOfWeek, ITimeSlot, IBlockedDate } from "../../types/schedule.type";

// ==================== REQUEST DTOs ====================

export interface CreateScheduleDTO {
    doctorId: string;
    weeklySchedule: {
        day: DayOfWeek;
        enabled: boolean;
        slots: ITimeSlot[];
    }[];
    defaultSlotDuration?: number;
    bufferTime?: number;
    maxPatientsPerSlot?: number;
}

export interface UpdateScheduleDTO {
    weeklySchedule?: {
        day: DayOfWeek;
        enabled: boolean;
        slots: ITimeSlot[];
    }[];
    defaultSlotDuration?: number;
    bufferTime?: number;
    maxPatientsPerSlot?: number;
    isActive?: boolean;
}

export interface BlockDateDTO {
    date: Date | string;
    reason?: string;
}

export interface UnblockDateDTO {
    date: Date | string;
}

export interface GetAvailableSlotsDTO {
    doctorId: string;
    date: Date | string;
}

// ==================== RESPONSE DTOs ====================

export interface ScheduleResponseDTO {
    id: string;
    doctorId: string;
    weeklySchedule: {
        day: DayOfWeek;
        enabled: boolean;
        slots: ITimeSlot[];
    }[];
    blockedDates: IBlockedDate[];
    defaultSlotDuration: number;
    bufferTime: number;
    maxPatientsPerSlot: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AvailableSlotResponseDTO {
    date: Date;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    bookedCount: number;
    maxPatients: number;
    slotId?: string; // Include slot customId
}

