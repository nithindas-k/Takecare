import { Request, Response, NextFunction } from "express";
import { IAppointmentController } from "./interfaces/IAppointment.controller";
import { IAppointmentService } from "services/interfaces/IAppointmentService";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { MESSAGES, HttpStatus, PAGINATION, ROLES, APPOINTMENT_STATUS } from "../constants/constants";



import { ILoggerService } from "../services/interfaces/ILogger.service";

export class AppointmentController implements IAppointmentController {
    constructor(
        private _appointmentService: IAppointmentService,
        private logger: ILoggerService
    ) { }

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

            this.logger.info("Calling createAppointment", { patientId, appointmentData });
            const appointment = await this._appointmentService.createAppointment(
                patientId,
                appointmentData
            );
            this.logger.info("Appointment created successfully", { id: appointment?.id });

            sendSuccess(res, appointment, MESSAGES.APPOINTMENT_CREATED, HttpStatus.CREATED);
        } catch (err: unknown) {
            this.logger.error("Error in createAppointment", err);
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
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.listAppointments(
                userId,
                userRole,
                { status, search, page, limit }
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

    rescheduleAppointment = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;

            const { appointmentDate, appointmentTime, slotId } = req.body;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            if (!appointmentDate || !appointmentTime) {
                throw new AppError(
                    "Appointment date and time are required for rescheduling",
                    HttpStatus.BAD_REQUEST
                );
            }

            const updatedAppointment = await this._appointmentService.rescheduleAppointment(
                appointmentId,
                userId,
                userRole,
                { appointmentDate, appointmentTime, slotId }
            );

            sendSuccess(res, updatedAppointment, "Appointment rescheduled successfully. Waiting for doctor approval.");
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

            const result = await this._appointmentService.listAppointments(
                userId,
                userRole,
                { status: APPOINTMENT_STATUS.PENDING, page, limit }
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
            const patientId = req.query.patientId as string | undefined;
            const search = req.query.search as string | undefined;
            const page = parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE;
            const limit = parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT;

            const result = await this._appointmentService.listAppointments(
                userId,
                userRole,
                { status, patientId, search, page, limit }
            );

            console.log("result :- ", result);

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
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const filters = {
                status: req.query.status as string,
                search: req.query.search as string,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                doctorId: req.query.doctorId as string,
                patientId: req.query.patientId as string,
                page: parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE,
                limit: parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT,
            };

            const result = await this._appointmentService.listAppointments(userId, userRole, filters);

            sendSuccess(res, result);
        } catch (err: unknown) {
            next(err);
        }
    };

    startConsultation = async (
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

            await this._appointmentService.startConsultation(appointmentId, userId);

            sendSuccess(res, undefined, "Consultation started successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    updateSessionStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const appointmentId = req.params.id;
            const { status } = req.body;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            await this._appointmentService.updateSessionStatus(appointmentId, userId, status);

            sendSuccess(res, undefined, `Session status updated to ${status}`);
        } catch (err: unknown) {
            next(err);
        }
    };

    acceptReschedule = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const appointmentId = req.params.id;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            await this._appointmentService.acceptReschedule(appointmentId, userId);

            sendSuccess(res, undefined, "Reschedule request accepted successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    rejectReschedule = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const appointmentId = req.params.id;
            const { reason } = req.body;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            if (!reason || reason.trim() === "") {
                throw new AppError("Rejection reason is required", HttpStatus.BAD_REQUEST);
            }

            await this._appointmentService.rejectReschedule(appointmentId, userId, reason);

            sendSuccess(res, undefined, "Reschedule request rejected successfully");
        } catch (err: unknown) {
            next(err);
        }
    };

    enablePostConsultationChat = async (
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

            await this._appointmentService.enablePostConsultationChat(appointmentId, userId);

            sendSuccess(res, undefined, "Post-consultation chat enabled for 24 hours.");
        } catch (err: unknown) {
            next(err);
        }
    };

    disablePostConsultationChat = async (
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

            await this._appointmentService.disablePostConsultationChat(appointmentId, userId);

            sendSuccess(res, undefined, "Post-consultation chat manually closed.");
        } catch (err: unknown) {
            next(err);
        }
    };

    updateDoctorNotes = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            const appointmentId = req.params.id;
            const { notes } = req.body;



            if (!userId || userRole !== ROLES.DOCTOR) {
                throw new AppError(MESSAGES.DOCTOR_ONLY, HttpStatus.FORBIDDEN);
            }

            await this._appointmentService.updateDoctorNotes(appointmentId, userId, notes);

            sendSuccess(res, undefined, "Doctor notes updated successfully.");
        } catch (err: unknown) {
            next(err);
        }
    };
}
