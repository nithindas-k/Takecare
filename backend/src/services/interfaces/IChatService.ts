import { IMessage } from "../../models/message.model";

export interface IChatService {
    saveMessage(
        appointmentId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type?: 'text' | 'image' | 'file' | 'system'
    ): Promise<IMessage>;

    sendMessage(
        appointmentId: string,
        userId: string,
        userRole: string,
        content: string,
        type?: 'text' | 'image' | 'file' | 'system'
    ): Promise<IMessage>;

    getMessages(appointmentId: string): Promise<IMessage[]>;

    markMessagesAsRead(appointmentId: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void>;

    getConversations(userId: string, userRole: string): Promise<any[]>;
}
