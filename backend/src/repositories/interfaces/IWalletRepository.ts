import { IWalletDocument, ITransactionDocument } from "../../types/wallet.type";

export interface IWalletRepository {
    findByUserId(userId: string): Promise<IWalletDocument | null>;
    createWallet(userId: string): Promise<IWalletDocument>;
    updateBalance(userId: string, amount: number): Promise<IWalletDocument | null>;
    createTransaction(data: any): Promise<ITransactionDocument>;
    getTransactionsByUserId(userId: string, skip: number, limit: number): Promise<{ transactions: ITransactionDocument[], total: number }>;
    getAdminTransactions(skip: number, limit: number): Promise<{ transactions: any[], total: number }>;
    getTotalCommission(): Promise<number>;
}
