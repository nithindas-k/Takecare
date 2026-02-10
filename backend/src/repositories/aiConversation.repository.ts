import { Model, Types } from "mongoose";
import { IAIConversationDocument } from "../types/aiMatching.type";
import { IAIConversationRepository } from "./interfaces/IAIConversation.repository";

export class AIConversationRepository implements IAIConversationRepository {
    constructor(private model: Model<IAIConversationDocument>) { }

    async create(patientId: string): Promise<IAIConversationDocument> {
        const conversation = new this.model({
            patientId: new Types.ObjectId(patientId),
            messages: [],
            status: "active",
            lastActivity: new Date(),
        });
        return await conversation.save();
    }

    async findActiveByPatientId(patientId: string): Promise<IAIConversationDocument | null> {
        return (await this.model
            .findOne({
                patientId: new Types.ObjectId(patientId),
                status: "active",
            })
            .sort({ lastActivity: -1 })
            .lean()) as any;
    }

    async findById(conversationId: string): Promise<IAIConversationDocument | null> {
        return (await this.model.findById(conversationId).lean()) as any;
    }

    async addMessage(
        conversationId: string,
        role: "user" | "assistant" | "system",
        content: string,
        recommendations?: Record<string, unknown>
    ): Promise<IAIConversationDocument | null> {
        return (await this.model.findByIdAndUpdate(
            conversationId,
            {
                $push: {
                    messages: {
                        role,
                        content,
                        recommendations,
                        timestamp: new Date(),
                    },
                },
                $set: {
                    lastActivity: new Date(),
                },
            },
            { new: true }
        ).lean()) as any;
    }

    async updateExtractedInfo(
        conversationId: string,
        extractedInfo: Record<string, unknown>
    ): Promise<IAIConversationDocument | null> {
        return (await this.model.findByIdAndUpdate(
            conversationId,
            {
                $set: {
                    extractedInfo,
                    lastActivity: new Date(),
                },
            },
            { new: true }
        ).lean()) as any;
    }

    async addRecommendedDoctors(
        conversationId: string,
        doctorIds: string[]
    ): Promise<IAIConversationDocument | null> {
        const objectIds = doctorIds.map((id) => new Types.ObjectId(id));
        return (await this.model.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: {
                    recommendedDoctors: { $each: objectIds },
                },
                $set: {
                    lastActivity: new Date(),
                },
            },
            { new: true }
        ).lean()) as any;
    }

    async updateStatus(
        conversationId: string,
        status: "active" | "completed" | "abandoned"
    ): Promise<IAIConversationDocument | null> {
        return (await this.model.findByIdAndUpdate(
            conversationId,
            {
                $set: {
                    status,
                    lastActivity: new Date(),
                },
            },
            { new: true }
        ).lean()) as any;
    }

    async getConversationHistory(conversationId: string): Promise<{
        role: string;
        content: string;
        timestamp: Date;
        recommendations?: Record<string, unknown>;
    }[]> {
        const conversation = await this.model.findById(conversationId).select("messages").lean();
        return conversation?.messages || [];
    }

    async cleanupOldConversations(daysOld: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.model.deleteMany({
            status: "abandoned",
            lastActivity: { $lt: cutoffDate },
        });

        return result.deletedCount || 0;
    }
}
