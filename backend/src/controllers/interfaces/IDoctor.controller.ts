import { Request, Response, NextFunction } from "express";

export interface IDoctorController {
    submitVerification: (req: Request, res: Response, next: NextFunction) => Promise<void>;


}