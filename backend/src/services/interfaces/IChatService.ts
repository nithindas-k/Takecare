import { IMessage } from "../../models/message.model";
import { Types } from "mongoose";

export interface ConversationItem {
    appointmentId: Types.ObjectId | string;
    customId: string;
    appointmentType: "video" | "chat";
    status: string;
    patient: Types.ObjectId | string;
    doctor: Types.ObjectId | string;
    lastMessage: {
        content: string;
        createdAt: Date;
        senderModel: 'User' | 'Doctor';
    };
    unreadCount: number;
}

export interface IChatService {
    saveMessage(
        appointmentId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type?: 'text' | 'image' | 'file' | 'system',
        fileName?: string
    ): Promise<IMessage>;

    sendMessage(
        appointmentId: string,
        userId: string,
        userRole: string,
        content: string,
        type?: 'text' | 'image' | 'file' | 'system',
        fileName?: string
    ): Promise<IMessage>;

    getMessages(appointmentId: string): Promise<IMessage[]>;

    markMessagesAsRead(appointmentId: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void>;

    getConversations(userId: string, userRole: string): Promise<ConversationItem[]>;

    editMessage(messageId: string, content: string, userId: string): Promise<IMessage>;

    deleteMessage(messageId: string, userId: string): Promise<IMessage>;
}
