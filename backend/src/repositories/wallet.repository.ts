import WalletModel from "../models/wallet.model";
import TransactionModel from "../models/transaction.model";
import { IWalletRepository } from "./interfaces/IWalletRepository";
import { IWalletDocument, ITransactionDocument } from "../types/wallet.type";
import { Types } from "mongoose";

export class WalletRepository implements IWalletRepository {
    async findByUserId(userId: string): Promise<IWalletDocument | null> {
        return await WalletModel.findOne({ userId: new Types.ObjectId(userId) });
    }

    async createWallet(userId: string): Promise<IWalletDocument> {
        return await WalletModel.create({ userId: new Types.ObjectId(userId), balance: 0 });
    }

    async updateBalance(userId: string, amount: number): Promise<IWalletDocument | null> {
        return await WalletModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $inc: { balance: amount } },
            { new: true, upsert: true }
        );
    }

    async createTransaction(data: any): Promise<ITransactionDocument> {
        return await TransactionModel.create(data);
    }

    async getTransactionsByUserId(userId: string, skip: number, limit: number): Promise<{ transactions: ITransactionDocument[], total: number }> {
        const query = { userId: new Types.ObjectId(userId) };
        const [transactions, total] = await Promise.all([
            TransactionModel.find(query)
                .populate('appointmentId', 'customId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            TransactionModel.countDocuments(query)
        ]);
        return { transactions, total };
    }

    async getAdminTransactions(skip: number, limit: number): Promise<{ transactions: any[], total: number }> {
        const query = { description: { $regex: /Commission/i } };
        const [transactions, total] = await Promise.all([
            TransactionModel.find(query)
                .populate('userId', 'name email')
                .populate('appointmentId', 'customId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            TransactionModel.countDocuments(query)
        ]);
        return { transactions, total };
    }

    async getTotalCommission(): Promise<number> {
  
        const result = await TransactionModel.aggregate([
            { $match: { description: { $regex: /Commission/i } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        return result[0]?.total || 0;
    }
}
