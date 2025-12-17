import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { LoggerService } from "../services/logger.service";
import { HttpStatus, MESSAGES } from "../constants/constants";

const logger = new LoggerService("ErrorHandler");

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    logger.error("Error occurred", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });


    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }


    if (err.name === "ValidationError") {
        res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: err.message,
        });
        return;
    }

    if (err.name === "CastError") {
        res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.INVALID_ID_FORMAT,
        });
        return;
    }

    const message = err instanceof Error ? err.message : MESSAGES.SERVER_ERROR;
    res.status(HttpStatus.INTERNAL_ERROR).json({
        success: false,
        message,
    });
};
