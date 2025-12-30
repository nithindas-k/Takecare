import mongoose, { Schema, Document } from "mongoose";
import { INotification } from "../types/notification.type";

export interface INotificationDocument extends INotification, Document { }

const NotificationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["success", "error", "warning", "info"],
            default: "info",
        },
        appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<INotificationDocument>("Notification", NotificationSchema);
