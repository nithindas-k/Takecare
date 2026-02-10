import {
    AIChatRequestDTO,
    AIChatResponseDTO,
    ChatMessageDTO,
} from "../../dtos/ai.dtos/aiMatching.dto";

export interface IAIMatchingService {

    processPatientMessage(request: AIChatRequestDTO): Promise<AIChatResponseDTO>;

    getOrCreateConversation(patientId: string): Promise<string>;

    getConversationHistory(patientId: string): Promise<ChatMessageDTO[]>;

    completeConversation(conversationId: string): Promise<void>;
}
