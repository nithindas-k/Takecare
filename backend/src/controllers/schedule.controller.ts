import { Request, Response, NextFunction } from "express";
import { IScheduleController } from "./interfaces/ISchedule.controller";
import { IScheduleService } from "../services/interfaces/IScheduleService";
import { STATUS, MESSAGES } from "../constants/constants";
import { AppError } from "../types/error.type";
import { sendSuccess } from "../utils/response.util";
import {
    CreateScheduleDTO,
    UpdateScheduleDTO,
    BlockDateDTO,
} from "../dtos/schedule.dtos/schedule.dto";
import { RecurringSlotsDTO } from "../dtos/schedule.dtos/recurringSlots.dto";

export class ScheduleController implements IScheduleController {
    constructor(private _scheduleService: IScheduleService) { }

    private getUserIdFromReq(req: Request): string | undefined {
        return req.user?.userId;
    }

    createSchedule = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }



            const dto: CreateScheduleDTO = {
                doctorId: "",
                weeklySchedule: req.body.weeklySchedule,
                defaultSlotDuration: req.body.defaultSlotDuration,
                bufferTime: req.body.bufferTime,
                maxPatientsPerSlot: req.body.maxPatientsPerSlot,
            };

            const result = await this._scheduleService.createSchedule(userId, dto);

            sendSuccess(res, result, MESSAGES.SCHEDULE_CREATED, STATUS.CREATED);
        } catch (error: unknown) {
            return next(error);
        }
    };

    getSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const userId = this.getUserIdFromReq(req);
            const doctorId = req.params.doctorId;

            let result;
            if (doctorId) {

                result = await this._scheduleService.getScheduleByDoctorId(doctorId);
            } else if (userId) {

                if (typeof userId !== 'string' || userId.trim() === '') {
                    throw new AppError(MESSAGES.INVALID_ID_FORMAT, STATUS.BAD_REQUEST);
                }

                result = await this._scheduleService.getScheduleByUserId(userId);
            } else {
                throw new AppError(MESSAGES.DOCTOR_ID_OR_AUTH_REQUIRED, STATUS.BAD_REQUEST);
            }

            if (!result) {

                sendSuccess(res, null, MESSAGES.SCHEDULE_NOT_FOUND, STATUS.OK);
                return;
            }

            sendSuccess(res, result, MESSAGES.SCHEDULE_FETCHED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    updateSchedule = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const doctorId = req.params.doctorId;
            const dto: UpdateScheduleDTO = {
                weeklySchedule: req.body.weeklySchedule,
                defaultSlotDuration: req.body.defaultSlotDuration,
                bufferTime: req.body.bufferTime,
                maxPatientsPerSlot: req.body.maxPatientsPerSlot,
                isActive: req.body.isActive,
            };


            let result;
            if (doctorId) {
                result = await this._scheduleService.updateSchedule(doctorId, dto);
            } else {
                result = await this._scheduleService.updateScheduleByUserId(userId, dto);
            }

            sendSuccess(res, result, MESSAGES.SCHEDULE_UPDATED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    blockDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const doctorId = req.params.doctorId;
            const dto: BlockDateDTO = {
                date: req.body.date,
                reason: req.body.reason,
                slots: req.body.slots,
            };


            let result;
            if (doctorId) {
                result = await this._scheduleService.blockDate(doctorId, dto);
            } else {
                result = await this._scheduleService.blockDateByUserId(userId, dto);
            }

            sendSuccess(res, result, MESSAGES.DATE_BLOCKED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    unblockDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const doctorId = req.params.doctorId;
            const date = req.body.date || req.params.date;

            if (!date) {
                throw new AppError(MESSAGES.DATE_REQUIRED, STATUS.BAD_REQUEST);
            }


            let result;
            if (doctorId) {
                result = await this._scheduleService.unblockDate(doctorId, date);
            } else {
                result = await this._scheduleService.unblockDateByUserId(userId, date);
            }

            sendSuccess(res, result, MESSAGES.DATE_UNBLOCKED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    getAvailableSlots = async (
        req: Request,
        res: Response, next: NextFunction
    ): Promise<void> => {
        try {
            const doctorId = req.params.doctorId;
            const date = req.query.date as string;

            if (!doctorId) {
                throw new AppError(MESSAGES.DOCTOR_ID_REQUIRED, STATUS.BAD_REQUEST);
            }

            if (!date) {
                throw new AppError(MESSAGES.DATE_REQUIRED, STATUS.BAD_REQUEST);
            }

            const result = await this._scheduleService.getAvailableSlots(doctorId, date);

            sendSuccess(res, result, MESSAGES.AVAILABLE_SLOTS_FETCHED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    deleteSchedule = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const doctorId = req.params.doctorId;


            if (doctorId) {
                await this._scheduleService.deleteSchedule(doctorId);
            } else {
                await this._scheduleService.deleteScheduleByUserId(userId);
            }

            sendSuccess(res, null, MESSAGES.SCHEDULE_DELETED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    addRecurringSlots = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const dto: RecurringSlotsDTO = {
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                days: req.body.days,
                skipOverlappingDays: req.body.skipOverlappingDays,
            };

            const result = await this._scheduleService.addRecurringSlots(userId, dto);

            sendSuccess(res, result, MESSAGES.SCHEDULE_UPDATED, STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    deleteRecurringSlot = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const { day, slotId } = req.params;

            if (!day || !slotId) {
                throw new AppError("Day and slot ID are required", STATUS.BAD_REQUEST);
            }

            const result = await this._scheduleService.deleteRecurringSlot(userId, day, slotId);

            sendSuccess(res, result, "Recurring slot deleted successfully", STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };

    deleteRecurringSlotByTime = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = this.getUserIdFromReq(req);
            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, STATUS.UNAUTHORIZED);
            }

            const { startTime, endTime } = req.params;

            if (!startTime || !endTime) {
                throw new AppError("Start time and end time are required", STATUS.BAD_REQUEST);
            }

            const result = await this._scheduleService.deleteRecurringSlotByTime(userId, startTime, endTime);

            sendSuccess(res, result, "Recurring slots deleted successfully from all days", STATUS.OK);
        } catch (error: unknown) {
            return next(error);
        }
    };
}

export default ScheduleController;

