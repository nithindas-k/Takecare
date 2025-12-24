import { Document, Types } from "mongoose";

export interface IWallet {
    userId: Types.ObjectId;
    balance: number;
}

export interface IWalletDocument extends IWallet, Document {
    createdAt: Date;
    updatedAt: Date;
}

export interface ITransaction {
    userId: Types.ObjectId;
    appointmentId?: Types.ObjectId;
    amount: number;
    type: "Consultation Fee" | "Refund" | "Wallet Top-up";
    description: string;
    status: "completed" | "pending" | "failed";
}

export interface ITransactionDocument extends ITransaction, Document {
    createdAt: Date;
    updatedAt: Date;
}
