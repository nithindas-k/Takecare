import { Request, Response, NextFunction } from "express";

export interface IPaymentController {
    createRazorpayOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyRazorpayPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    unlockSlot(req: Request, res: Response, next: NextFunction): Promise<void>;
}
