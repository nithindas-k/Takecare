import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, HttpStatus, MESSAGES } from "../constants/constants";
import { LoggerService } from "../services/logger.service";

const logger = new LoggerService("CheckUserBlocked");

export const checkUserBlocked = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
      
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: MESSAGES.UNAUTHORIZED,
            });
            return;
        }


        
        next();
    } catch (error) {
        logger.error("Check user blocked error", error);
        res.status(HttpStatus.INTERNAL_ERROR).json({
            success: false,
            message: MESSAGES.SERVER_ERROR,
        });
    }
};
