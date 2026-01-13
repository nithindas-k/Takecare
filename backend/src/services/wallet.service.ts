import { ClientSession } from "mongoose";
import { IWalletService } from "./interfaces/IWalletService";
import { IWalletRepository } from "../repositories/interfaces/IWalletRepository";
import { ITransactionDocument } from "../types/wallet.type";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { AppError } from "../errors/AppError";
import { MESSAGES, HttpStatus } from "../constants/constants";

import { INotificationService } from "./notification.service";

export class WalletService implements IWalletService {
    constructor(
        private _walletRepository: IWalletRepository,
        private _appointmentRepository?: IAppointmentRepository,
        private _userRepository?: IUserRepository,
        private _doctorRepository?: IDoctorRepository,
        private _notificationService?: INotificationService
    ) { }

    async getWalletBalance(userId: string): Promise<number> {
        const wallet = await this._walletRepository.findByUserId(userId);
        return wallet ? wallet.balance : 0;
    }

    async getTransactions(userId: string, page: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number, earnings: number, deductions: number }> {
        const skip = (page - 1) * limit;
        return await this._walletRepository.getTransactionsByUserId(userId, skip, limit, filters);
    }

    async addMoney(userId: string, amount: number, description: string, appointmentId?: string, type: string = "Refund", session?: ClientSession | undefined): Promise<void> {
        await this._walletRepository.updateBalance(userId, amount, session);
        await this._walletRepository.createTransaction({
            userId,
            appointmentId,
            amount,
            type,
            description,
            status: "completed"
        }, session);

        if (this._notificationService) {
            const title = type === "Refund" ? "Refund Received" :
                type === "Consultation Fee" ? "Payment Received" :
                    "Wallet Credited";

            await this._notificationService.notify(userId, {
                title: title,
                message: `₹${amount} has been added to your wallet. ${description}`,
                type: "success",
                appointmentId
            });
        }
    }

    async deductMoney(userId: string, amount: number, description: string, appointmentId?: string, type: string = "Consultation Fee", session?: ClientSession | undefined): Promise<void> {
        await this._walletRepository.updateBalance(userId, -amount, session);
        await this._walletRepository.createTransaction({
            userId,
            appointmentId,
            amount: -amount,
            type,
            description,
            status: "completed"
        }, session);

        if (this._notificationService) {
            await this._notificationService.notify(userId, {
                title: "Wallet Debited",
                message: `₹${amount} has been deducted from your wallet. ${description}`,
                type: "warning",
                appointmentId
            });
        }
    }

    async getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }> {
        return await this._walletRepository.getAdminTransactions(skip, limit, filters);
    }

    async getAdminEarningsOverview(): Promise<{ revenue: number; commission: number; users: number; bookings: number; trends: { revenue: string; commission: string; users: string; bookings: string } }> {
        const [commission, totalAppointments, patients, doctors] = await Promise.all([
            this._walletRepository.getTotalCommission(),
            this._appointmentRepository?.countByStatus("completed") || Promise.resolve(0),
            this._userRepository?.countDocuments?.({ role: "patient" }) || Promise.resolve(0),
            this._doctorRepository?.findAllActive?.().then((docs) => docs.length) || Promise.resolve(0)
        ]);


        const grossRevenue = commission / 0.20;

        return {
            revenue: grossRevenue,
            commission: commission,
            users: (patients || 0) + (doctors || 0),
            bookings: totalAppointments || 0,
            trends: {
                revenue: "+15%",
                commission: "+12%",
                users: "+8%",
                bookings: "+20%"
            }
        };
    }
}
