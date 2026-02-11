import { IConversationRepository } from "./interfaces/IConversationRepository";
import { Conversation, IConversationDocument, IConversationPopulated } from "../models/conversation.model";
import { BaseRepository } from "./base.repository";
import { Types } from "mongoose";

export class ConversationRepository extends BaseRepository<IConversationDocument> implements IConversationRepository {
    constructor() {
        super(Conversation);
    }

    async findByParticipantIds(participantIds: string[]): Promise<IConversationDocument | null> {
        const ids = participantIds.map(id => new Types.ObjectId(id)).sort();
        return await this.model.findOne({
            participants: { $all: ids, $size: ids.length }
        }).exec();
    }

    async findOrCreate(participantIds: string[], participantModels: ('User' | 'Doctor')[]): Promise<IConversationDocument> {
        const sortedIds = participantIds.map(id => new Types.ObjectId(id)).sort();


        const idModelMap = participantIds.map((id, index) => ({ id, model: participantModels[index] }));
        const sortedModels = sortedIds.map(sid => idModelMap.find(m => m.id === sid.toString())!.model);

        let conv = await this.findByParticipantIds(participantIds);
        if (!conv) {
            conv = await this.model.create({
                participants: sortedIds,
                participantModels: sortedModels,
                unreadCount: {}
            });
        }
        return conv;
    }

    async findAllForUser(userId: string): Promise<IConversationPopulated[]> {
        const id = new Types.ObjectId(userId);
        return await this.model.find({
            participants: id
        })
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .exec() as unknown as IConversationPopulated[];
    }

    async updateLastMessage(conversationId: string, messageId: string): Promise<void> {
        await this.model.findByIdAndUpdate(conversationId, {
            lastMessage: new Types.ObjectId(messageId)
        }).exec();
    }

    async updateActiveAppointment(conversationId: string, appointmentId: string): Promise<void> {
        await this.model.findByIdAndUpdate(conversationId, {
            activeAppointmentId: new Types.ObjectId(appointmentId)
        }).exec();
    }
}
