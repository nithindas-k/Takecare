import { IWalletService } from "./interfaces/IWalletService";
import { IWalletRepository } from "../repositories/interfaces/IWalletRepository";
import { AppError } from "../errors/AppError";
import { MESSAGES, HttpStatus } from "../constants/constants";

import { INotificationService } from "./notification.service";

export class WalletService implements IWalletService {
    constructor(
        private _walletRepository: IWalletRepository,
        private _appointmentRepository?: any,
        private _userRepository?: any,
        private _doctorRepository?: any,
        private _notificationService?: INotificationService
    ) { }

    async getWalletBalance(userId: string): Promise<number> {
        const wallet = await this._walletRepository.findByUserId(userId);
        return wallet ? wallet.balance : 0;
    }

    async getTransactions(userId: string, page: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: any[], total: number }> {
        const skip = (page - 1) * limit;
        return await this._walletRepository.getTransactionsByUserId(userId, skip, limit, filters);
    }

    async addMoney(userId: string, amount: number, description: string, appointmentId?: string, type: any = "Refund", session?: any): Promise<void> {
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

    async deductMoney(userId: string, amount: number, description: string, appointmentId?: string, type: any = "Consultation Fee", session?: any): Promise<void> {
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

    async getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: any[], total: number }> {
        return await this._walletRepository.getAdminTransactions(skip, limit, filters);
    }

    async getAdminEarningsOverview(): Promise<any> {
        const [commission, totalAppointments, patients, doctors] = await Promise.all([
            this._walletRepository.getTotalCommission(),
            this._appointmentRepository?.countByStatus("completed") || 0,
            this._userRepository?.countByField?.("role", "patient") || 0,
            this._doctorRepository?.findAllActive?.().then((docs: any[]) => docs.length) || 0
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
