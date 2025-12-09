import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { LoggerService } from "../services/logger.service";

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
        res.status(400).json({
            success: false,
            message: err.message,
        });
        return;
    }

    if (err.name === "CastError") {
        res.status(400).json({
            success: false,
            message: "Invalid ID format",
        });
        return;
    }

    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    res.status(500).json({
        success: false,
        message,
    });
};
