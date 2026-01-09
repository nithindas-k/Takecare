import { Request, Response, NextFunction } from "express";

export interface IDoctorController {
    submitVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getVerificationFormData: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getVerifiedDoctors: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDoctorById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRelatedDocs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDashboardStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}