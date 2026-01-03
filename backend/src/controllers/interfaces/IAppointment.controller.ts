import { Request, Response, NextFunction } from "express";

export interface IAppointmentController {

    createAppointment(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void>;
    rescheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void>;


    getDoctorAppointmentRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDoctorAppointments(req: Request, res: Response, next: NextFunction): Promise<void>;
    approveAppointmentRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    rejectAppointmentRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
    completeAppointment(req: Request, res: Response, next: NextFunction): Promise<void>;
    startConsultation(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateSessionStatus(req: Request, res: Response, next: NextFunction): Promise<void>;


    getAllAppointments(req: Request, res: Response, next: NextFunction): Promise<void>;
}
