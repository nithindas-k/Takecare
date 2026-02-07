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

    async findByConversationId(conversationId: string, legacyAppointmentIds?: string[]): Promise<IMessage[]> {
        const conversationObjectId = new Types.ObjectId(conversationId);
        let query: Record<string, unknown> = { conversationId: conversationObjectId };

        if (legacyAppointmentIds && legacyAppointmentIds.length > 0) {
            const legacyObjectIds = legacyAppointmentIds.map(id => new Types.ObjectId(id));
            query = {
                $or: [
                    { conversationId: conversationObjectId },
                    { appointmentId: { $in: legacyObjectIds } }
                ]
            };
        }

        return await this.model
            .find(query)
            .sort({ createdAt: 1 })
            .lean() as unknown as IMessage[];
    }

    async markAsReadByConversation(conversationId: string, excludeSenderId: string): Promise<void> {
        await this.model.updateMany(
            {
                conversationId: new Types.ObjectId(conversationId),
                senderId: { $ne: new Types.ObjectId(excludeSenderId) },
                read: false
            },
            {
                $set: { read: true }
            }
        );
    }

    async findLastMessageByConversationId(conversationId: string): Promise<IMessage | null> {
        return await this.model
            .findOne({ conversationId: new Types.ObjectId(conversationId) })
            .sort({ createdAt: -1 })
            .lean() as unknown as IMessage;
    }

    async countUnreadByConversation(conversationId: string, excludeSenderId: string): Promise<number> {
        return await this.model.countDocuments({
            conversationId: new Types.ObjectId(conversationId),
            senderId: { $ne: new Types.ObjectId(excludeSenderId) },
            read: false,
            isDeleted: false
        });
    }

    async deleteById(id: string): Promise<IMessage | null> {
        return await this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
    }
}
