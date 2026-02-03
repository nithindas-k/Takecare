import { ClientSession } from "mongoose";
import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletRepository {
    findByUserId(userId: string, session?: ClientSession | undefined): Promise<IWalletDocument | null>;
    createWallet(userId: string, session?: ClientSession | undefined): Promise<IWalletDocument>;
    updateBalance(userId: string, amount: number, session?: ClientSession | undefined): Promise<IWalletDocument | null>;
    createTransaction(data: Partial<ITransactionDocument>, session?: ClientSession | undefined): Promise<ITransactionDocument>;
    getTransactionsByUserId(userId: string, skip: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number, earnings: number, deductions: number }>;
    getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }>;
    getTotalCommission(): Promise<number>;
    getDoctorEarningsStats(): Promise<any[]>;
}
