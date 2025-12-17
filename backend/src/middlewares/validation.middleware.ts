import { Request, Response, NextFunction } from "express";

/**
 * Middleware adapter for validation functions
 * @param validatorFn - Function that validates data and throws error if invalid
 */
export const validate = (validatorFn: (data: any) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            validatorFn(req.body);
            next();
        } catch (error) {
            next(error);
        }
    };
};
