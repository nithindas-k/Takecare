import { ValidationError } from "../errors/AppError";
import type {
    CreateScheduleDTO,
    UpdateScheduleDTO,
    BlockDateDTO,
} from "../dtos/schedule.dtos/schedule.dto";
import { DayOfWeek } from "../types/schedule.type";

export class ScheduleValidator {
    private static readonly VALID_DAYS: DayOfWeek[] = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ];

    private static readonly TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    static validateCreateSchedule(data: CreateScheduleDTO): void {
        if (!data.doctorId || data.doctorId.trim().length === 0) {
            throw new ValidationError("Doctor ID is required");
        }

        if (!data.weeklySchedule || !Array.isArray(data.weeklySchedule)) {
            throw new ValidationError("Weekly schedule is required and must be an array");
        }

        if (data.weeklySchedule.length !== 7) {
            throw new ValidationError("Weekly schedule must contain all 7 days");
        }

       
        const daysSet = new Set<string>();
        for (const daySchedule of data.weeklySchedule) {
     
            if (daysSet.has(daySchedule.day)) {
                throw new ValidationError(`Duplicate day found: ${daySchedule.day}`);
            }
            daysSet.add(daySchedule.day);

      
            if (!this.VALID_DAYS.includes(daySchedule.day)) {
                throw new ValidationError(`Invalid day: ${daySchedule.day}`);
            }

      
            if (daySchedule.enabled) {
                if (!daySchedule.slots || !Array.isArray(daySchedule.slots)) {
                    throw new ValidationError(
                        `Slots are required when day ${daySchedule.day} is enabled`
                    );
                }

                if (daySchedule.slots.length === 0) {
                    throw new ValidationError(
                        `At least one slot is required when day ${daySchedule.day} is enabled`
                    );
                }

       
                for (const slot of daySchedule.slots) {
                    this.validateTimeSlot(slot);
                }

       
                this.validateNoOverlappingSlots(daySchedule.slots);
            }
        }

       
        if (data.defaultSlotDuration !== undefined) {
            if (data.defaultSlotDuration < 15 || data.defaultSlotDuration > 120) {
                throw new ValidationError(
                    "Default slot duration must be between 15 and 120 minutes"
                );
            }
        }

       
        if (data.bufferTime !== undefined) {
            if (data.bufferTime < 0 || data.bufferTime > 30) {
                throw new ValidationError("Buffer time must be between 0 and 30 minutes");
            }
        }

       
        if (data.maxPatientsPerSlot !== undefined) {
            if (data.maxPatientsPerSlot < 1 || data.maxPatientsPerSlot > 10) {
                throw new ValidationError(
                    "Max patients per slot must be between 1 and 10"
                );
            }
        }
    }

    static validateUpdateSchedule(data: UpdateScheduleDTO): void {
        if (data.weeklySchedule) {
            if (!Array.isArray(data.weeklySchedule)) {
                throw new ValidationError("Weekly schedule must be an array");
            }

            if (data.weeklySchedule.length !== 7) {
                throw new ValidationError("Weekly schedule must contain all 7 days");
            }

            const daysSet = new Set<string>();
            for (const daySchedule of data.weeklySchedule) {
                if (daysSet.has(daySchedule.day)) {
                    throw new ValidationError(`Duplicate day found: ${daySchedule.day}`);
                }
                daysSet.add(daySchedule.day);

                if (!this.VALID_DAYS.includes(daySchedule.day)) {
                    throw new ValidationError(`Invalid day: ${daySchedule.day}`);
                }

                if (daySchedule.enabled) {
                    if (!daySchedule.slots || !Array.isArray(daySchedule.slots)) {
                        throw new ValidationError(
                            `Slots are required when day ${daySchedule.day} is enabled`
                        );
                    }

                    if (daySchedule.slots.length === 0) {
                        throw new ValidationError(
                            `At least one slot is required when day ${daySchedule.day} is enabled`
                        );
                    }

                    for (const slot of daySchedule.slots) {
                        this.validateTimeSlot(slot);
                    }

                    this.validateNoOverlappingSlots(daySchedule.slots);
                }
            }
        }

        if (data.defaultSlotDuration !== undefined) {
            if (data.defaultSlotDuration < 15 || data.defaultSlotDuration > 120) {
                throw new ValidationError(
                    "Default slot duration must be between 15 and 120 minutes"
                );
            }
        }

        if (data.bufferTime !== undefined) {
            if (data.bufferTime < 0 || data.bufferTime > 30) {
                throw new ValidationError("Buffer time must be between 0 and 30 minutes");
            }
        }

        if (data.maxPatientsPerSlot !== undefined) {
            if (data.maxPatientsPerSlot < 1 || data.maxPatientsPerSlot > 10) {
                throw new ValidationError(
                    "Max patients per slot must be between 1 and 10"
                );
            }
        }
    }

    static validateBlockDate(data: BlockDateDTO): void {
        if (!data.date) {
            throw new ValidationError("Date is required");
        }

        const date = new Date(data.date);
        if (isNaN(date.getTime())) {
            throw new ValidationError("Invalid date format");
        }

        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const blockDate = new Date(date);
        blockDate.setHours(0, 0, 0, 0);

        if (blockDate < today) {
            throw new ValidationError("Cannot block dates in the past");
        }

        if (data.reason && data.reason.length > 500) {
            throw new ValidationError("Reason cannot exceed 500 characters");
        }
    }

    private static validateTimeSlot(slot: { startTime: string; endTime: string }): void {
        if (!slot.startTime || !this.TIME_REGEX.test(slot.startTime)) {
            throw new ValidationError(
                `Invalid start time format: ${slot.startTime}. Use HH:MM format`
            );
        }

        if (!slot.endTime || !this.TIME_REGEX.test(slot.endTime)) {
            throw new ValidationError(
                `Invalid end time format: ${slot.endTime}. Use HH:MM format`
            );
        }


        const startMinutes = this.timeToMinutes(slot.startTime);
        const endMinutes = this.timeToMinutes(slot.endTime);

        if (startMinutes >= endMinutes) {
            throw new ValidationError(
                `Start time (${slot.startTime}) must be before end time (${slot.endTime})`
            );
        }

       
        if (endMinutes - startMinutes < 15) {
            throw new ValidationError(
                `Slot duration must be at least 15 minutes (${slot.startTime} - ${slot.endTime})`
            );
        }
    }

    private static validateNoOverlappingSlots(
        slots: { startTime: string; endTime: string }[]
    ): void {
        for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
                const slot1 = slots[i];
                const slot2 = slots[j];

                const start1 = this.timeToMinutes(slot1.startTime);
                const end1 = this.timeToMinutes(slot1.endTime);
                const start2 = this.timeToMinutes(slot2.startTime);
                const end2 = this.timeToMinutes(slot2.endTime);

           
                if (
                    (start1 < end2 && end1 > start2) ||
                    (start2 < end1 && end2 > start1)
                ) {
                    throw new ValidationError(
                        `Overlapping slots detected: ${slot1.startTime}-${slot1.endTime} and ${slot2.startTime}-${slot2.endTime}`
                    );
                }
            }
        }
    }

    private static timeToMinutes(time: string): number {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    }
}

