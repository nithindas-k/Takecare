import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";
import { requirePatient } from "../middlewares/role.middleware";
import { PAYMENT_ROUTES } from "../constants/routes.constants";
import { PaymentController } from "../controllers/payment.controller";
import { PaymentService } from "../services/payment.service";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { UserRepository } from "../repositories/user.repository";
import { WalletRepository } from "../repositories/wallet.repository";
import { WalletService } from "../services/wallet.service";

const paymentRouter = Router();

const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();
const walletRepository = new WalletRepository();
import { notificationService } from "./notification.router";

const walletService = new WalletService(walletRepository, undefined, undefined, undefined, notificationService);

import { LoggerService } from "../services/logger.service";

const paymentServiceLogger = new LoggerService("PaymentService");

const paymentService = new PaymentService(
    appointmentRepository,
    doctorRepository,
    userRepository,
    walletService,
    paymentServiceLogger,
    notificationService
);
const paymentController = new PaymentController(paymentService);

paymentRouter.post(
    PAYMENT_ROUTES.RAZORPAY_ORDER,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    paymentController.createRazorpayOrder
);

paymentRouter.post(
    PAYMENT_ROUTES.RAZORPAY_VERIFY,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    paymentController.verifyRazorpayPayment
);

paymentRouter.post(
    PAYMENT_ROUTES.UNLOCK_SLOT,
    authMiddleware,
    checkUserBlocked,
    requirePatient,
    paymentController.unlockSlot
);

export default paymentRouter;
