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

    async getTransactionsByUserId(userId: string, skip: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }> {
        const query: any = { userId: new Types.ObjectId(userId) };

        if (filters?.search) {
            query.description = { $regex: filters.search, $options: 'i' };
        }

        if (filters?.type) {
            if (filters.type === 'credit') {
                query.amount = { $gt: 0 };
            } else if (filters.type === 'debit') {
                query.amount = { $lt: 0 };
            }
        }

        if (filters?.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

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

    async getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: any[], total: number }> {
        const query: any = { description: { $regex: /Commission/i } };

        if (filters?.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);

            query.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

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
