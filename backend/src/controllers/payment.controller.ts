import { Request, Response, NextFunction } from "express";
import type { IPaymentController } from "./interfaces/IPayment.controller";
import type { IPaymentService } from "../services/interfaces/IPaymentService";
import { AppError } from "../errors/AppError";
import { sendSuccess } from "../utils/response.util";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class PaymentController implements IPaymentController {
    constructor(private _paymentService: IPaymentService) { }

    createRazorpayOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }
            const result = await this._paymentService.createRazorpayOrder(patientId, req.body);
            sendSuccess(res, result, undefined, HttpStatus.CREATED);
        } catch (err: unknown) {
            next(err);
        }
    };

    verifyRazorpayPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const result = await this._paymentService.verifyRazorpayPayment(patientId, req.body);
            sendSuccess(res, result, MESSAGES.PAYMENT_VERIFIED, HttpStatus.OK);
        } catch (err: unknown) {
            next(err);
        }
    };

    unlockSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const appointmentId = req.params.appointmentId || req.body.appointmentId;
            if (!appointmentId) throw new AppError("Appointment ID required", HttpStatus.BAD_REQUEST);

            await this._paymentService.unlockSlot(appointmentId);
            sendSuccess(res, undefined, "Slot unlocked");
        } catch (err: unknown) {
            next(err);
        }
    };
}
