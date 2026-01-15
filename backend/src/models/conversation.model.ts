import { Schema, model, Document, Types } from "mongoose";

export interface IConversation {
    participants: Types.ObjectId[];
    participantModels: ('User' | 'Doctor')[];
    lastMessage?: Types.ObjectId;
    activeAppointmentId?: Types.ObjectId;
    unreadCount: Map<string, number>; // userId -> count
    sessionStatus?: string;
    isLocked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IConversationDocument extends IConversation, Document { }

const conversationSchema = new Schema<IConversationDocument>({
    participants: [{
        type: Schema.Types.ObjectId,
        required: true
    }],
    participantModels: [{
        type: String,
        enum: ['User', 'Doctor'],
        required: true
    }],
    lastMessage: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    activeAppointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

// Index for quick lookup of conversation between two users
conversationSchema.index({ participants: 1 });

export const Conversation = model<IConversationDocument>("Conversation", conversationSchema);
