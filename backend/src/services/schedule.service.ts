import { IScheduleService } from "./interfaces/IScheduleService";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import {
    CreateScheduleDTO,
    UpdateScheduleDTO,
    BlockDateDTO,
    ScheduleResponseDTO,
    AvailableSlotResponseDTO,
} from "../dtos/schedule.dtos/schedule.dto";
import { ScheduleValidator } from "../validators/schedule.validator";
import { NotFoundError, AppError } from "../errors/AppError";
import { LoggerService } from "./logger.service";
import { MESSAGES, HttpStatus, SCHEDULE_DEFAULTS } from "../constants/constants";
import { Types } from "mongoose";
import { DayOfWeek } from "../types/schedule.type";
import { IDGenerator } from "../utils/idGenerator.util";

import { ILoggerService } from "./interfaces/ILogger.service";

export class ScheduleService implements IScheduleService {
    constructor(
        private _scheduleRepository: IScheduleRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _doctorRepository: IDoctorRepository,
        private logger: ILoggerService
    ) {
    }


    async createSchedule(
        userId: string,
        data: CreateScheduleDTO
    ): Promise<ScheduleResponseDTO> {
        this.logger.info("Creating schedule by user ID", { userId });

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }


        const doctorId = doctor._id.toString();
        const existingSchedule = await this._scheduleRepository.findByDoctorId(doctorId);

        if (existingSchedule) {
            throw new AppError(
                MESSAGES.SCHEDULE_ALREADY_EXISTS,
                HttpStatus.CONFLICT
            );
        }

        data.doctorId = doctorId;

        if (data.weeklySchedule) {
            data.weeklySchedule.forEach(day => {
                if (day.enabled && day.slots && day.slots.length > 3) {
                    throw new AppError("Slot limit exceeded: max 3 slots per day allowed", HttpStatus.BAD_REQUEST);
                }
            });
        }

        ScheduleValidator.validateCreateSchedule(data);


        const weeklySchedule = data.weeklySchedule.map(day => ({
            ...day,
            slots: day.slots ? day.slots.map(slot => ({
                ...slot,
                customId: (slot as any).customId || IDGenerator.generateSlotId()
            })) : []
        }));

        const schedule = await this._scheduleRepository.create({
            doctorId: doctor._id,
            weeklySchedule: weeklySchedule,
            blockedDates: [],
            defaultSlotDuration: data.defaultSlotDuration ?? SCHEDULE_DEFAULTS.SLOT_DURATION_MINUTES,
            bufferTime: data.bufferTime ?? SCHEDULE_DEFAULTS.BUFFER_TIME_MINUTES,
            maxPatientsPerSlot: data.maxPatientsPerSlot ?? SCHEDULE_DEFAULTS.MAX_PATIENTS_PER_SLOT,
            isActive: true,
        });

        this.logger.info("Schedule created successfully", { doctorId, scheduleId: schedule._id });

        return this.mapToResponseDTO(schedule);
    }

    async getScheduleByDoctorId(doctorId: string): Promise<ScheduleResponseDTO | null> {
        this.logger.debug("Fetching schedule by doctor ID", { doctorId });

        const schedule = await this._scheduleRepository.findByDoctorId(doctorId);
        if (!schedule) {
            return null;
        }

        return this.mapToResponseDTO(schedule);
    }

    async getScheduleByUserId(userId: string): Promise<ScheduleResponseDTO | null> {
        this.logger.debug("Fetching schedule by user ID", { userId });

        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            this.logger.warn("Invalid userId provided", { userId });
            return null;
        }

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            this.logger.warn("Doctor not found for userId", { userId });
            return null;
        }


        const schedule = await this._scheduleRepository.findByDoctorId(doctor._id.toString());
        if (!schedule) {
            this.logger.warn("Schedule not found for doctorId", { doctorId: doctor._id.toString() });
            return null;
        }

        return this.mapToResponseDTO(schedule);
    }

    async updateSchedule(
        doctorId: string,
        data: UpdateScheduleDTO
    ): Promise<ScheduleResponseDTO> {
        this.logger.info("Updating schedule", { doctorId });


        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }


        const existingSchedule = await this._scheduleRepository.findByDoctorId(doctorId);
        if (!existingSchedule) {
            throw new NotFoundError(MESSAGES.SCHEDULE_NOT_FOUND);
        }

        ScheduleValidator.validateUpdateSchedule(data);


        const updateData: any = {};
        if (data.weeklySchedule) {

            updateData.weeklySchedule = data.weeklySchedule.map(day => ({

                ...day,
                slots: day.slots ? day.slots.map(slot => ({
                    ...slot,
                    customId: (slot as any).customId || IDGenerator.generateSlotId()
                })) : []
            }));
        }
        if (data.defaultSlotDuration !== undefined) {
            updateData.defaultSlotDuration = data.defaultSlotDuration;
        }
        if (data.bufferTime !== undefined) {
            updateData.bufferTime = data.bufferTime;
        }
        if (data.maxPatientsPerSlot !== undefined) {
            updateData.maxPatientsPerSlot = data.maxPatientsPerSlot;
        }
        if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
        }

        const updatedSchedule = await this._scheduleRepository.updateByDoctorId(
            doctorId,
            updateData
        );

        if (!updatedSchedule) {
            throw new NotFoundError(MESSAGES.SCHEDULE_UPDATE_FAILED);
        }

        this.logger.info("Schedule updated successfully", { doctorId });

        return this.mapToResponseDTO(updatedSchedule);
    }

    async updateScheduleByUserId(
        userId: string,
        data: UpdateScheduleDTO
    ): Promise<ScheduleResponseDTO> {
        this.logger.info("Updating schedule by user ID", { userId });

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        return this.updateSchedule(doctor._id.toString(), data);
    }

    async blockDate(doctorId: string, data: BlockDateDTO): Promise<ScheduleResponseDTO> {
        this.logger.info("Blocking date", { doctorId, date: data.date });

        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        ScheduleValidator.validateBlockDate(data);

        const date = new Date(data.date);
        const schedule = await this._scheduleRepository.addBlockedDate(
            doctorId,
            date,
            data.reason,
            data.slots
        );

        if (!schedule) {
            throw new NotFoundError(MESSAGES.SCHEDULE_NOT_FOUND);
        }

        this.logger.info("Date blocked successfully", { doctorId, date: data.date });

        return this.mapToResponseDTO(schedule);
    }

    async blockDateByUserId(userId: string, data: BlockDateDTO): Promise<ScheduleResponseDTO> {
        this.logger.info("Blocking date by user ID", { userId, date: data.date });

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        return this.blockDate(doctor._id.toString(), data);
    }

    async unblockDate(doctorId: string, date: Date | string): Promise<ScheduleResponseDTO> {
        this.logger.info("Unblocking date", { doctorId, date });

        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            throw new AppError(MESSAGES.INVALID_DATE_FORMAT, HttpStatus.BAD_REQUEST);
        }

        const schedule = await this._scheduleRepository.removeBlockedDate(doctorId, dateObj);

        if (!schedule) {
            throw new NotFoundError(MESSAGES.SCHEDULE_NOT_FOUND);
        }

        this.logger.info("Date unblocked successfully", { doctorId, date });

        return this.mapToResponseDTO(schedule);
    }

    async unblockDateByUserId(userId: string, date: Date | string): Promise<ScheduleResponseDTO> {
        this.logger.info("Unblocking date by user ID", { userId, date });

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        return this.unblockDate(doctor._id.toString(), date);
    }

    async getAvailableSlots(
        doctorId: string,
        date: Date | string
    ): Promise<AvailableSlotResponseDTO[]> {
        this.logger.debug("Getting available slots", { doctorId, date });

        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        const schedule = await this._scheduleRepository.findByDoctorId(doctorId);
        if (!schedule || !schedule.isActive) {
            return [];
        }

        const dateObj = new Date(date);
        const dayOfWeek = this.getDayOfWeek(dateObj);

        let daySchedule = null;
        for (const day of schedule.weeklySchedule) {
            if (day.day === dayOfWeek) {
                daySchedule = day;
                break;
            }
        }

        if (!daySchedule || !daySchedule.enabled) {
            return [];
        }

        const dateStr = dateObj.toISOString().split("T")[0];

        let isBlocked = false;
        let blockedDaySlots: string[] = [];

        if (schedule.blockedDates) {
            for (const blocked of schedule.blockedDates) {
                if (blocked.date.toISOString().split("T")[0] === dateStr) {
                    if (!blocked.slots || blocked.slots.length === 0) {
                        isBlocked = true;
                    } else {
                        blockedDaySlots = blocked.slots;
                    }
                    break;
                }
            }
        }

        if (isBlocked) {
            return [];
        }

        const appointments = await this._appointmentRepository.findByDoctorId(
            doctorId,
            undefined,
            0,
            1000
        );

        const appointmentsForDate = [];
        for (const apt of appointments.appointments) {
            const aptDate = new Date(apt.appointmentDate);
            const isSameDate = aptDate.toISOString().split("T")[0] === dateStr;
            const validStatus = apt.status === 'pending' || apt.status === 'confirmed' || apt.status === 'upcoming';

            if (isSameDate && validStatus) {
                appointmentsForDate.push(apt);
            }
        }

        const enabledSlots = [];
        if (daySchedule.slots) {
            for (const slot of daySchedule.slots) {
                if (slot.enabled !== false) {
                    enabledSlots.push(slot);
                }
            }
        }

        const availableSlots: AvailableSlotResponseDTO[] = [];
        for (const slot of enabledSlots) {
            if (blockedDaySlots.includes(slot.startTime)) {
                continue;
            }
            const isSlotBooked = slot.booked === true;
            const slotTimeRange = `${slot.startTime} - ${slot.endTime}`;

            let bookedCount = 0;
            for (const apt of appointmentsForDate) {
                const aptSlotId = (apt as any).slotId;
                let match = false;

                if (slot.customId && aptSlotId && aptSlotId === slot.customId) {
                    match = true;
                } else if (apt.appointmentTime === slotTimeRange) {
                    match = true;
                }

                if (match) {
                    bookedCount++;
                }
            }

            const isAvailable = !isSlotBooked && bookedCount < schedule.maxPatientsPerSlot;

            availableSlots.push({
                date: dateObj,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: isAvailable,
                bookedCount,
                maxPatients: schedule.maxPatientsPerSlot,
                slotId: slot.customId,
            });
        }

        return availableSlots;
    }

    async deleteSchedule(doctorId: string): Promise<void> {
        this.logger.info("Deleting schedule", { doctorId });


        const schedule = await this._scheduleRepository.findByDoctorId(doctorId);
        if (!schedule) {
            throw new NotFoundError(MESSAGES.SCHEDULE_NOT_FOUND);
        }

        await this._scheduleRepository.updateByDoctorId(doctorId, { isActive: false });

        this.logger.info("Schedule deleted successfully", { doctorId });
    }

    async deleteScheduleByUserId(userId: string): Promise<void> {
        this.logger.info("Deleting schedule by user ID", { userId });

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError(MESSAGES.DOCTOR_NOT_FOUND);
        }

        return this.deleteSchedule(doctor._id.toString());
    }

    private mapToResponseDTO(schedule: any): ScheduleResponseDTO {
        return {
            id: schedule._id?.toString() || schedule.id,
            doctorId: schedule.doctorId?.toString() || schedule.doctorId,
            weeklySchedule: schedule.weeklySchedule,
            blockedDates: schedule.blockedDates || [],
            defaultSlotDuration: schedule.defaultSlotDuration,
            bufferTime: schedule.bufferTime,
            maxPatientsPerSlot: schedule.maxPatientsPerSlot,
            isActive: schedule.isActive,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
        };
    }

    private getDayOfWeek(date: Date): DayOfWeek {
        const days: DayOfWeek[] = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

     
        const dateCopy = new Date(date);
        dateCopy.setUTCHours(dateCopy.getUTCHours() + 12);
        return days[dateCopy.getUTCDay()];
    }
}

