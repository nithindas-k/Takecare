import { IMessage } from "../../models/message.model";

export interface IMessageRepository {
    create(messageData: {
        appointmentId: string;
        senderId: string;
        senderModel: 'User' | 'Doctor';
        content: string;
        type: 'text' | 'image' | 'file' | 'system';
        read: boolean;
    }): Promise<IMessage>;

    findByAppointmentId(appointmentId: string): Promise<IMessage[]>;

    markAsRead(appointmentId: string, excludeSenderId: string): Promise<void>;

    findLastMessageByAppointmentId(appointmentId: string): Promise<IMessage | null>;

    countUnread(appointmentId: string, excludeSenderId: string): Promise<number>;
}
