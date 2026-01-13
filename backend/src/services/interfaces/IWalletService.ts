import { ClientSession } from "mongoose";
import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletService {
    getWalletBalance(userId: string): Promise<number>;
    getTransactions(userId: string, page: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number, earnings: number, deductions: number }>;
    addMoney(userId: string, amount: number, description: string, appointmentId?: string, type?: string, session?: ClientSession | undefined): Promise<void>;
    deductMoney(userId: string, amount: number, description: string, appointmentId?: string, type?: string, session?: ClientSession | undefined): Promise<void>;
    getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }>;
    getAdminEarningsOverview(): Promise<{ revenue: number; commission: number; users: number; bookings: number; trends: { revenue: string; commission: string; users: string; bookings: string } }>;
}
