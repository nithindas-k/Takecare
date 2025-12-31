import { IMessage } from "../../models/message.model";
import { IBaseRepository } from "./IBase.repository";

export interface IMessageRepository extends IBaseRepository<IMessage> {
    findByAppointmentId(appointmentId: string): Promise<IMessage[]>;

    markAsRead(appointmentId: string, excludeSenderId: string): Promise<void>;

    findLastMessageByAppointmentId(appointmentId: string): Promise<IMessage | null>;

    countUnread(appointmentId: string, excludeSenderId: string): Promise<number>;
}
