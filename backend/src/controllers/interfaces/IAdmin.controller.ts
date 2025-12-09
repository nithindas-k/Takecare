import { Request, Response, NextFunction } from "express";

export interface IAdminController {
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDoctorRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDoctorRequestDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    approveDoctor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    rejectDoctor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAllDoctors: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    banDoctor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    unbanDoctor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAllPatients: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getPatientById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    blockPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    unblockPatient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
