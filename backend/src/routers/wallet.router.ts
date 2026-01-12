import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { WalletService } from "../services/wallet.service";
import { WalletRepository } from "../repositories/wallet.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { UserRepository } from "../repositories/user.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const walletRouter = Router();


const walletRepository = new WalletRepository();
const appointmentRepository = new AppointmentRepository();
const userRepository = new UserRepository();
const doctorRepository = new DoctorRepository();

import { notificationService } from "./notification.router";

const walletService = new WalletService(
    walletRepository,
    appointmentRepository,
    userRepository,
    doctorRepository,
    notificationService
);

import { LoggerService } from "../services/logger.service";

const walletControllerLogger = new LoggerService("WalletController");
const walletController = new WalletController(walletService, walletControllerLogger);


walletRouter.get("/my-wallet", authMiddleware, walletController.getWallet.bind(walletController));


walletRouter.get("/admin/earnings-overview", authMiddleware, requireAdmin, walletController.getAdminEarningsOverview.bind(walletController));


walletRouter.get("/admin/transactions", authMiddleware, requireAdmin, walletController.getAdminTransactions.bind(walletController));

export default walletRouter;
