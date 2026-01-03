import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletService {
    getWalletBalance(userId: string): Promise<number>;
    getTransactions(userId: string, page: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: any[], total: number }>;
    addMoney(userId: string, amount: number, description: string, appointmentId?: string, type?: string): Promise<void>;
    deductMoney(userId: string, amount: number, description: string, appointmentId?: string, type?: string): Promise<void>;
    getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: any[], total: number }>;
    getAdminEarningsOverview(): Promise<any>;
}
