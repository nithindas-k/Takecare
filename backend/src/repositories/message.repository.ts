import { IMessageRepository } from "./interfaces/IMessage.repository";
import MessageModel, { IMessage } from "../models/message.model";
import { BaseRepository } from "./base.repository";
import { Types } from 'mongoose';

export class MessageRepository extends BaseRepository<IMessage> implements IMessageRepository {
    constructor() {
        super(MessageModel);
    }

    async create(messageData: Partial<IMessage>): Promise<IMessage> {
        return await this.model.create(messageData);
    }

    async findByAppointmentId(appointmentId: string): Promise<IMessage[]> {
        return await this.model
            .find({ appointmentId })
            .sort({ createdAt: 1 })
            .lean() as unknown as IMessage[];
    }

    async findByAppointmentIds(appointmentIds: string[]): Promise<IMessage[]> {
        return await this.model
            .find({ appointmentId: { $in: appointmentIds } })
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

    async markAsReadByIds(appointmentIds: string[], excludeSenderId: string): Promise<void> {
        await this.model.updateMany(
            {
                appointmentId: { $in: appointmentIds },
                senderId: { $ne: excludeSenderId },
                read: false
            },
            {
                $set: { read: true }
            }
        );
    }

    async findLastMessageByAppointmentIds(appointmentIds: string[]): Promise<IMessage | null> {
        const ids = appointmentIds.map(id => new Types.ObjectId(id));
        return await this.model
            .findOne({ appointmentId: { $in: ids } })
            .sort({ createdAt: -1 })
            .lean() as unknown as IMessage;
    }

    async countUnread(appointmentId: string, excludeSenderId: string): Promise<number> {
        const id = new Types.ObjectId(appointmentId);
        return await this.model.countDocuments({
            appointmentId: id,
            senderId: { $ne: new Types.ObjectId(excludeSenderId) },
            read: false,
            isDeleted: false
        });
    }

    async countUnreadInAppointments(appointmentIds: string[], excludeSenderId: string): Promise<number> {
        const ids = appointmentIds.map(id => new Types.ObjectId(id));
        return await this.model.countDocuments({
            appointmentId: { $in: ids },
            senderId: { $ne: new Types.ObjectId(excludeSenderId) },
            read: false,
            isDeleted: false
        });
    }

    async deleteById(id: string): Promise<IMessage | null> {
        return await this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
    }
}
