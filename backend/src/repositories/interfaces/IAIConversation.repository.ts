import { IAIConversationDocument } from "../../types/aiMatching.type";

export interface IAIConversationRepository {

    create(patientId: string): Promise<IAIConversationDocument>;


    findActiveByPatientId(patientId: string): Promise<IAIConversationDocument | null>;

    findById(conversationId: string): Promise<IAIConversationDocument | null>;

    addMessage(
        conversationId: string,
        role: "user" | "assistant" | "system",
        content: string,
        recommendations?: Record<string, unknown>
    ): Promise<IAIConversationDocument | null>;


    updateExtractedInfo(
        conversationId: string,
        extractedInfo: Record<string, unknown>
    ): Promise<IAIConversationDocument | null>;


    addRecommendedDoctors(
        conversationId: string,
        doctorIds: string[]
    ): Promise<IAIConversationDocument | null>;


    updateStatus(
        conversationId: string,
        status: "active" | "completed" | "abandoned"
    ): Promise<IAIConversationDocument | null>;

    getConversationHistory(conversationId: string): Promise<{
        role: string;
        content: string;
        timestamp: Date;
        recommendations?: Record<string, unknown>;
    }[]>;

    cleanupOldConversations(daysOld: number): Promise<number>;
}
