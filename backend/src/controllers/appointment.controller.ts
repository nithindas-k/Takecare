import { Request, Response, NextFunction } from "express";
import { IAppointmentController } from "./interfaces/IAppointment.controller";
import { IAppointmentService } from "../services/interfaces/IAppointmentService";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { MESSAGES, HttpStatus, PAGINATION, ROLES } from "../constants/constants";

export class AppointmentController implements IAppointmentController {
    constructor(private _appointmentService: IAppointmentService) { }

    createAppointment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const appointmentData = req.body;

            if (!appointmentData.doctorId) {
                throw new AppError(
                    MESSAGES.APPOINTMENT_DOCTOR_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }
            if (!appointmentData.appointmentDate) {
                throw new AppError(
                    MESSAGES.APPOINTMENT_DATE_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }
            if (!appointmentData.appointmentTime) {
                throw new AppError(
                    MESSAGES.APPOINTMENT_TIME_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }
            if (!appointmentData.appointmentType) {
                throw new AppError(
                    MESSAGES.APPOINTMENT_TYPE_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }

            const appointment = await this._appointmentService.createAppointment(
                patientId,
                appointmentData
            );

            sendSuccess(res, appointment, MESSAGES.APPOINTMENT_CREATED, HttpStatus.CREATED);
        } catch (err: unknown) {
            next(err);
        }
    };

    getMyAppointments = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const status = req.query.status as string | undefined;
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.getMyAppointments(
                userId,
                userRole,
                status,
                page,
                limit
            );

            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };

    getAppointmentById = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const appointment = await this._appointmentService.getAppointmentById(
                appointmentId,
                userId,
                userRole
            );

            if (!appointment) {
                throw new AppError(
                    MESSAGES.APPOINTMENT_NOT_FOUND,
                    HttpStatus.NOT_FOUND
                );
            }

            sendSuccess(res, appointment);
        } catch (err: unknown) {
            next(err);
        }
    };

    cancelAppointment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;

            const { cancellationReason } = req.body;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            if (!cancellationReason || cancellationReason.trim() === "") {
                throw new AppError(
                    MESSAGES.CANCELLATION_REASON_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }

            const updatedAppointment = await this._appointmentService.cancelAppointment(
                appointmentId,
                userId,
                userRole,
                cancellationReason
            );

            sendSuccess(res, updatedAppointment, MESSAGES.APPOINTMENT_CANCELLED);
        } catch (err: unknown) {
            next(err);
        }
    };

    getDoctorAppointmentRequests = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.getDoctorAppointmentRequests(
                userId,
                page,
                limit
            );

            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };

    getDoctorAppointments = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            const status = req.query.status as string | undefined;
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.getDoctorAppointments(
                userId,
                status,
                page,
                limit
            );

            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };

    approveAppointmentRequest = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;

            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            await this._appointmentService.approveAppointmentRequest(
                appointmentId,
                userId
            );

            sendSuccess(res, undefined, MESSAGES.APPOINTMENT_APPROVED);
        } catch (err: unknown) {
            next(err);
        }
    };

    rejectAppointmentRequest = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;
            const { rejectionReason } = req.body;

            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            if (!rejectionReason || rejectionReason.trim() === "") {
                throw new AppError(
                    MESSAGES.REJECTION_REASON_REQUIRED,
                    HttpStatus.BAD_REQUEST
                );
            }

            await this._appointmentService.rejectAppointmentRequest(
                appointmentId,
                userId,
                rejectionReason
            );

            sendSuccess(res, undefined, MESSAGES.APPOINTMENT_REJECTED);
        } catch (err: unknown) {
            next(err);
        }
    };

    completeAppointment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;
            const { doctorNotes, prescriptionUrl } = req.body;

            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            await this._appointmentService.completeAppointment(
                appointmentId,
                userId,
                doctorNotes,
                prescriptionUrl
            );

            sendSuccess(res, undefined, MESSAGES.APPOINTMENT_COMPLETED);
        } catch (err: unknown) {
            next(err);
        }
    };

    getAllAppointments = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const status = req.query.status as string | undefined;
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.getAllAppointments(
                status,
                page,
                limit
            );

            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };
}
