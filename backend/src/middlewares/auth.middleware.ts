import { env } from "configs/env";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/auth.type";

declare global {
  namespace Express {

    interface User extends JWTPayload { }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    console.log("Auth Middleware - headers:", req.headers);
    console.log("Authorization header:", req.headers.authorization);

    const token = req.headers.authorization?.split(" ")[1];
    console.log("Extracted token:", token);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET || "your-secret-key") as JWTPayload;

    console.log("Decoded token payload:", decoded);

    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
