import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletRepository {
    findByUserId(userId: string): Promise<IWalletDocument | null>;
    createWallet(userId: string): Promise<IWalletDocument>;
    updateBalance(userId: string, amount: number): Promise<IWalletDocument | null>;
    createTransaction(data: any): Promise<ITransactionDocument>;
    getTransactionsByUserId(userId: string, skip: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }>;
    getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: any[], total: number }>;
    getTotalCommission(): Promise<number>;
}
