import { Document, Types } from "mongoose";


export interface ITimeSlot {
    customId?: string;
    startTime: string;
    endTime: string;  
    enabled?: boolean;
    booked?: boolean;
}


export type DayOfWeek =
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";

export interface IDaySchedule {
    day: DayOfWeek;
    enabled: boolean;
    slots: ITimeSlot[];
}


export interface IBlockedDate {
    date: Date;
    reason?: string | null;
}

export interface IDoctorSchedule {
    customId?: string;
    doctorId: Types.ObjectId;
    weeklySchedule: IDaySchedule[];
    blockedDates?: IBlockedDate[];
    defaultSlotDuration: number; 
    bufferTime: number;         
    maxPatientsPerSlot: number;
    isActive: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export interface IDoctorScheduleDocument extends IDoctorSchedule, Document {
    _id: Types.ObjectId;
    id: string;
}

export interface IAvailableSlot {
    date: Date;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    bookedCount: number;
    maxPatients: number;
}
