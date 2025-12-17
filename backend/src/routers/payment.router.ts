import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkUserBlocked } from "../middlewares/check-user-blocked.middleware";
import { requirePatient } from "../middlewares/role.middleware";
import { PAYMENT_ROUTES } from "../constants/routes.constants";
import { PaymentController } from "../controllers/payment.controller";
import { PaymentService } from "../services/payment.service";
import { AppointmentRepository } from "../repositories/appointment.repository";

const paymentRouter = Router();

const appointmentRepository = new AppointmentRepository();
const paymentService = new PaymentService(appointmentRepository);
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

export default paymentRouter;
