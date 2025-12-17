import type {
    CreateScheduleDTO,
    UpdateScheduleDTO,
    BlockDateDTO,
    ScheduleResponseDTO,
    AvailableSlotResponseDTO,
} from "../../dtos/schedule.dtos/schedule.dto";

export interface IScheduleService {
    createSchedule(userId: string, data: CreateScheduleDTO): Promise<ScheduleResponseDTO>;
    getScheduleByDoctorId(doctorId: string): Promise<ScheduleResponseDTO | null>;
    getScheduleByUserId(userId: string): Promise<ScheduleResponseDTO | null>;
    updateSchedule(doctorId: string, data: UpdateScheduleDTO): Promise<ScheduleResponseDTO>;
    updateScheduleByUserId(userId: string, data: UpdateScheduleDTO): Promise<ScheduleResponseDTO>;
    blockDate(doctorId: string, data: BlockDateDTO): Promise<ScheduleResponseDTO>;
    blockDateByUserId(userId: string, data: BlockDateDTO): Promise<ScheduleResponseDTO>;
    unblockDate(doctorId: string, date: Date | string): Promise<ScheduleResponseDTO>;
    unblockDateByUserId(userId: string, date: Date | string): Promise<ScheduleResponseDTO>;
    getAvailableSlots(
        doctorId: string,
        date: Date | string
    ): Promise<AvailableSlotResponseDTO[]>;
    deleteSchedule(doctorId: string): Promise<void>;
    deleteScheduleByUserId(userId: string): Promise<void>;
}

