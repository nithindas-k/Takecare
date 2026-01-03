import { IMessage } from "../../models/message.model";
import { IBaseRepository } from "./IBase.repository";

export interface IMessageRepository extends IBaseRepository<IMessage> {
    findByAppointmentId(appointmentId: string): Promise<IMessage[]>;
    findByAppointmentIds(appointmentIds: string[]): Promise<IMessage[]>;
    markAsRead(appointmentId: string, excludeSenderId: string): Promise<void>;
    markAsReadByIds(appointmentIds: string[], excludeSenderId: string): Promise<void>;
    findLastMessageByAppointmentIds(appointmentIds: string[]): Promise<IMessage | null>;
    countUnread(appointmentId: string, excludeSenderId: string): Promise<number>;
    countUnreadInAppointments(appointmentIds: string[], excludeSenderId: string): Promise<number>;
}
