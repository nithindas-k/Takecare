import { IMessage } from "../../models/message.model";


export interface ConversationItem {
    appointmentId: string;
    conversationId: string;
    realAppointmentId: string | null;
    customId: string;
    appointmentType: string;
    status: string;
    patient: any;
    doctor: any;
    lastMessage: {
        content: string;
        createdAt: Date;
        type: string;
    } | null;
    unreadCount: number;
    isOnline: boolean;
}

export interface IChatService {
    saveMessage(
        conversationId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type?: 'text' | 'image' | 'file' | 'system',
        fileName?: string,
        appointmentId?: string
    ): Promise<IMessage>;

    sendMessage(
        appointmentId: string,
        userId: string,
        userRole: string,
        content: string,
        type?: 'text' | 'image' | 'file' | 'system',
        fileName?: string
    ): Promise<IMessage>;

    getMessages(id: string): Promise<IMessage[]>; 

    markMessagesAsRead(id: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void>;

    getConversations(userId: string, userRole: string): Promise<ConversationItem[]>;

    getConversation(id: string): Promise<any>;

    getConversationByDoctorId(patientId: string, doctorId: string): Promise<any>;

    editMessage(messageId: string, content: string, userId: string): Promise<IMessage>;

    deleteMessage(messageId: string, userId: string): Promise<IMessage>;
}
