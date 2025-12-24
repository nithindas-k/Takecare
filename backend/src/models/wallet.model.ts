import mongoose, { Schema, Model } from "mongoose";
import { IWalletDocument } from "../types/wallet.type";

const WalletSchema = new Schema<IWalletDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

const WalletModel: Model<IWalletDocument> =
    mongoose.models.Wallet || mongoose.model<IWalletDocument>("Wallet", WalletSchema);

export default WalletModel;
