import { Request, Response, NextFunction } from "express";
import { ICallSessionService } from "../services/interfaces/ICallSessionService";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class CallController {
    constructor(private _callSessionService: ICallSessionService) { }

    startCall = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { appointmentId } = req.params;
            const { doctorId, patientId } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const session = await this._callSessionService.startCall(appointmentId, doctorId, patientId);
            sendSuccess(res, session, "Call session started successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    endCall = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            await this._callSessionService.endCall(sessionId);
            sendSuccess(res, null, "Call ended successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    getCallStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { appointmentId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const result = await this._callSessionService.checkCanRejoin(appointmentId);
            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };

    rejoinCall = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { appointmentId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const session = await this._callSessionService.rejoinCall(appointmentId, userId);
            sendSuccess(res, session, "Rejoined call successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    getActiveCall = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { appointmentId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const session = await this._callSessionService.getActiveCallByAppointment(appointmentId);
            sendSuccess(res, session);
        } catch (err: unknown) {
            next(err);
        }
    };
}
