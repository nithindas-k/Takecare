import { Request, Response, NextFunction } from "express";

export const validate = <T>(validatorFn: (data: T) => void) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            validatorFn(req.body as T);
            next();
        } catch (error) {
            next(error);
        }
    };
};
