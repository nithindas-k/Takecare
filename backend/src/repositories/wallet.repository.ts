import WalletModel from "../models/wallet.model";
import TransactionModel from "../models/transaction.model";
import { IWalletRepository } from "./interfaces/IWalletRepository";
import { IWalletDocument, ITransactionDocument } from "../types/wallet.type";
import { Types, ClientSession } from "mongoose";

export class WalletRepository implements IWalletRepository {
    async findByUserId(userId: string, session?: ClientSession | undefined): Promise<IWalletDocument | null> {
        return await WalletModel.findOne({ userId: new Types.ObjectId(userId) }).session(session || null);
    }

    async createWallet(userId: string, session?: ClientSession | undefined): Promise<IWalletDocument> {
        return await WalletModel.create([{ userId: new Types.ObjectId(userId), balance: 0 }], { session: session || undefined }).then(docs => docs[0]);
    }

    async updateBalance(userId: string, amount: number, session?: ClientSession | undefined): Promise<IWalletDocument | null> {
        return await WalletModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $inc: { balance: amount } },
            { new: true, upsert: true, session: session || undefined }
        );
    }

    async createTransaction(data: Partial<ITransactionDocument>, session?: ClientSession | undefined): Promise<ITransactionDocument> {
        return await TransactionModel.create([data], { session: session || undefined }).then(docs => docs[0]);
    }

    async getTransactionsByUserId(userId: string, skip: number, limit: number, filters?: { search?: string, type?: string, date?: string }): Promise<{ transactions: ITransactionDocument[], total: number, earnings: number, deductions: number }> {
        const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

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

        const [transactions, total, summary] = await Promise.all([
            TransactionModel.find(query)
                .populate('appointmentId', 'customId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            TransactionModel.countDocuments(query),
            TransactionModel.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        earnings: {
                            $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] }
                        },
                        deductions: {
                            $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] }
                        }
                    }
                }
            ])
        ]);

        return {
            transactions,
            total,
            earnings: summary[0]?.earnings || 0,
            deductions: Math.abs(summary[0]?.deductions || 0)
        };
    }

    async getAdminTransactions(skip: number, limit: number, filters?: { date?: string }): Promise<{ transactions: ITransactionDocument[], total: number }> {
        const query: Record<string, unknown> = { description: { $regex: /Commission/i } };

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
                .limit(limit),
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

    async getDoctorEarningsStats(): Promise<any[]> {
        return await WalletModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $match: {
                    'user.role': 'doctor'
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: 'userId',
                    foreignField: 'userId',
                    as: 'doctorInfo'
                }
            },
            {
                $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    doctorId: '$userId',
                    name: '$user.name',
                    specialty: '$doctorInfo.specialty',
                    balance: 1,
                    isActive: '$doctorInfo.isActive'
                }
            },
            {
                $sort: { balance: -1 }
            }
        ]);
    }
}
