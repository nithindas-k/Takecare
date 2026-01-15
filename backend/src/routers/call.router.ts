import { Router } from "express";
import { CallController } from "../controllers/call.controller";
import { CallSessionService } from "../services/call-session.service";
import { CallSessionRepository } from "../repositories/call-session.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { LoggerService } from "../services/logger.service";

const callRouter = Router();

// Initialize dependencies
const callSessionRepository = new CallSessionRepository();
const appointmentRepository = new AppointmentRepository();
const callLogger = new LoggerService("CallSessionService");

const callSessionService = new CallSessionService(
    callSessionRepository,
    appointmentRepository,
    callLogger
);

const callController = new CallController(callSessionService);

// Routes
callRouter.post(
    "/:appointmentId/start",
    authMiddleware,
    callController.startCall
);

callRouter.post(
    "/session/:sessionId/end",
    authMiddleware,
    callController.endCall
);

callRouter.get(
    "/:appointmentId/status",
    authMiddleware,
    callController.getCallStatus
);

callRouter.post(
    "/:appointmentId/rejoin",
    authMiddleware,
    callController.rejoinCall
);

callRouter.get(
    "/:appointmentId/active",
    authMiddleware,
    callController.getActiveCall
);

export default callRouter;
export { callSessionService };
