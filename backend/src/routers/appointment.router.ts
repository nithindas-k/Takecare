import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { AppointmentService } from "../services/appointment.service";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { UserRepository } from "../repositories/user.repository";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { WalletService } from "../services/wallet.service";
import { WalletRepository } from "../repositories/wallet.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin, requireRole } from "../middlewares/role.middleware";
import { APPOINTMENT_ROUTES } from "../constants/routes.constants";
import { LoggerService } from "../services/logger.service";

const appointmentRouter = Router();


const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();
const scheduleRepository = new ScheduleRepository();
const walletRepository = new WalletRepository();

import { notificationService } from "./notification.router";
import { chatService } from "./chat.router";

const walletService = new WalletService(walletRepository, undefined, undefined, undefined, notificationService);

const appointmentServiceLogger = new LoggerService("AppointmentService");
const appointmentControllerLogger = new LoggerService("AppointmentController");

const appointmentService = new AppointmentService(
    appointmentRepository,
    userRepository,
    doctorRepository,
    scheduleRepository,
    walletService,
    appointmentServiceLogger,
    notificationService,
    chatService
);

const appointmentController = new AppointmentController(appointmentService, appointmentControllerLogger);


appointmentRouter.post(
    APPOINTMENT_ROUTES.CREATE,
    authMiddleware,
    appointmentController.createAppointment
);


appointmentRouter.get(
    APPOINTMENT_ROUTES.MY_APPOINTMENTS,
    authMiddleware,
    appointmentController.getMyAppointments
);


appointmentRouter.get(
    APPOINTMENT_ROUTES.DOCTOR_REQUESTS,
    authMiddleware,
    appointmentController.getDoctorAppointmentRequests
);


appointmentRouter.get(
    APPOINTMENT_ROUTES.DOCTOR_APPOINTMENTS,
    authMiddleware,
    appointmentController.getDoctorAppointments
);


appointmentRouter.get(
    APPOINTMENT_ROUTES.ADMIN_ALL,
    authMiddleware,
    requireAdmin,
    appointmentController.getAllAppointments
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.CANCEL,
    authMiddleware,
    requireRole("admin", "doctor", "patient"),
    appointmentController.cancelAppointment
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.RESCHEDULE,
    authMiddleware,
    requireRole("admin", "patient", "doctor"),
    appointmentController.rescheduleAppointment
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.ACCEPT_RESCHEDULE,
    authMiddleware,
    requireRole("patient"),
    appointmentController.acceptReschedule
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.REJECT_RESCHEDULE,
    authMiddleware,
    requireRole("patient"),
    appointmentController.rejectReschedule
);


appointmentRouter.put(
    APPOINTMENT_ROUTES.APPROVE,
    authMiddleware,
    appointmentController.approveAppointmentRequest
);


appointmentRouter.put(
    APPOINTMENT_ROUTES.REJECT,
    authMiddleware,
    appointmentController.rejectAppointmentRequest
);


appointmentRouter.put(
    APPOINTMENT_ROUTES.COMPLETE,
    authMiddleware,
    appointmentController.completeAppointment
);


appointmentRouter.get(
    APPOINTMENT_ROUTES.GET_BY_ID,
    authMiddleware,
    appointmentController.getAppointmentById
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.START_CONSULTATION,
    authMiddleware,
    appointmentController.startConsultation
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.UPDATE_SESSION_STATUS,
    authMiddleware,
    appointmentController.updateSessionStatus
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.ENABLE_CHAT,
    authMiddleware,
    appointmentController.enablePostConsultationChat
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.DISABLE_CHAT,
    authMiddleware,
    appointmentController.disablePostConsultationChat
);

appointmentRouter.put(
    APPOINTMENT_ROUTES.UPDATE_NOTES,
    authMiddleware,
    appointmentController.updateDoctorNotes
);

export default appointmentRouter;
