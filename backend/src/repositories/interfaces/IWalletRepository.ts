import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletRepository {
    findByUserId(userId: string, session?: any): Promise<IWalletDocument | null>;
    createWallet(userId: string, session?: any): Promise<IWalletDocument>;
    updateBalance(userId: string, amount: number, session?: any): Promise<IWalletDocument | null>;
    createTransaction(data: any, session?: any): Promise<ITransactionDocument>;
    getTransactionsByUserId(userId: string, skip: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }>;
    getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: any[], total: number }>;
    getTotalCommission(): Promise<number>;
}
