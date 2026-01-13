import { Response, NextFunction } from "express";
import { IPrescriptionService } from "../services/interfaces/IPrescriptionService";
import { HttpStatus, MESSAGES } from "../constants/constants";
import { AppError } from "../errors/AppError";
import { AuthenticatedRequest } from "../types/auth.type";

export class PrescriptionController {
    constructor(private _prescriptionService: IPrescriptionService) { }

    createPrescription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const result = await this._prescriptionService.createPrescription(userId, req.body);
            res.status(HttpStatus.CREATED).json({
                success: true,
                message: "Prescription created successfully",
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    getPrescription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            const { appointmentId } = req.params;

            if (!userId || !role) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const result = await this._prescriptionService.getPrescriptionByAppointment(userId, role, appointmentId);
            res.status(HttpStatus.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
