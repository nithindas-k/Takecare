import { IMessage } from "../../models/message.model";
import { PatientListItem, DoctorListItem } from "../../types/common";


export interface ConversationItem {
    appointmentId: string;
    conversationId: string;
    realAppointmentId: string | null;
    customId: string;
    appointmentType: string;
    status: string;
    patient: Partial<PatientListItem>;
    doctor: Partial<DoctorListItem>;
    lastMessage: {
        content: string;
        createdAt: Date;
        type: 'text' | 'image' | 'file' | 'system';
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

    getConversation(id: string): Promise<ConversationItem>;

    getConversationByDoctorId(patientId: string, doctorId: string): Promise<ConversationItem>;

    editMessage(messageId: string, content: string, userId: string): Promise<IMessage>;

    deleteMessage(messageId: string, userId: string): Promise<IMessage>;

    sendSystemMessage(appointmentId: string, content: string): Promise<IMessage>;
}
