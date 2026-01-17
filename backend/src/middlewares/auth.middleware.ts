import { env } from "../configs/env";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/auth.type";
import { HttpStatus, MESSAGES } from "../constants/constants";

declare global {
  namespace Express {

    interface User extends JWTPayload {
      _id?: any;
      id?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.ACCESS_TOKEN_MISSING,
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    ) as JWTPayload;

    req.user = decoded;
    next();

  } catch (error) {
    res.status(HttpStatus.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.INVALID_ACCESS_TOKEN,
    });
  }
};
