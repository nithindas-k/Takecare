import { Request, Response, NextFunction } from "express";

export interface IAdminController {
    login: (req: Request, res: Response) => Promise<void>;
    getDoctorRequests: (req: Request, res: Response) => Promise<void>;
 
    approveDoctor: (req: Request, res: Response) => Promise<void>;
    rejectDoctor: (req: Request, res: Response) => Promise<void>;
    getAllDoctors: (req: Request, res: Response) => Promise<void>;
    banDoctor: (req: Request, res: Response) => Promise<void>;
    unbanDoctor: (req: Request, res: Response) => Promise<void>;
    getAllPatients: (req: Request, res: Response) => Promise<void>;
    getPatientById: (req: Request, res: Response) => Promise<void>;
    blockPatient: (req: Request, res: Response) => Promise<void>;
    unblockPatient: (req: Request, res: Response) => Promise<void>;
    getDoctorRequestDetails: (req: Request, res: Response) => Promise<void>;
}
