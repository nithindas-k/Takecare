import { Request, Response, NextFunction } from "express";

export interface IScheduleController {
    createSchedule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSchedule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateSchedule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    blockDate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    unblockDate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAvailableSlots: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteSchedule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

