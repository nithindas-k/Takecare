import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.type";
import { HttpStatus, MESSAGES } from "../constants/constants";


export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }


        const userRole = authReq.user.role.toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map((role) =>
            role.toLowerCase()
        );


        if (!normalizedAllowedRoles.includes(userRole)) {
            res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "Access denied. Insufficient permissions.",
                requiredRoles: allowedRoles,
                userRole: authReq.user.role,
            });
            return;
        }


        next();
    };
};


export const requireAdmin = requireRole("admin");

export const requireDoctor = requireRole("doctor");


export const requirePatient = requireRole("patient");

export const requireDoctorOrPatient = requireRole("doctor", "patient");
export const requireAdminOrDoctor = requireRole("admin", "doctor");
