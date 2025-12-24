import mongoose, { Schema, Model } from "mongoose";
import { ITransactionDocument } from "../types/wallet.type";

const TransactionSchema = new Schema<ITransactionDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["Consultation Fee", "Refund", "Wallet Top-up"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["completed", "pending", "failed"],
            default: "completed",
        },
    },
    {
        timestamps: true,
    }
);

const TransactionModel: Model<ITransactionDocument> =
    mongoose.models.Transaction || mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);

export default TransactionModel;
