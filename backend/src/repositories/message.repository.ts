import { IMessageRepository } from "./interfaces/IMessage.repository";
import MessageModel, { IMessage } from "../models/message.model";
import { BaseRepository } from "./base.repository";

export class MessageRepository extends BaseRepository<IMessage> implements IMessageRepository {
    constructor() {
        super(MessageModel);
    }

    async create(messageData: any): Promise<IMessage> {
        return await this.model.create(messageData);
    }

    async findByAppointmentId(appointmentId: string): Promise<IMessage[]> {
        return await this.model
            .find({ appointmentId })
            .sort({ createdAt: 1 })
            .lean() as unknown as IMessage[];
    }

    async markAsRead(appointmentId: string, excludeSenderId: string): Promise<void> {
        await this.model.updateMany(
            {
                appointmentId,
                senderId: { $ne: excludeSenderId },
                read: false
            },
            {
                $set: { read: true }
            }
        );
    }

    async findLastMessageByAppointmentId(appointmentId: string): Promise<IMessage | null> {
        return await this.model
            .findOne({ appointmentId })
            .sort({ createdAt: -1 })
            .lean() as unknown as IMessage;
    }

    async countUnread(appointmentId: string, excludeSenderId: string): Promise<number> {
        return await this.model.countDocuments({
            appointmentId,
            senderId: { $ne: excludeSenderId },
            read: false
        });
    }
}
