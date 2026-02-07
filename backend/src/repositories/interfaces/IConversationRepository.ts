import { IConversationDocument, IConversationPopulated } from "../../models/conversation.model";
import { IBaseRepository } from "./IBase.repository";

export interface IConversationRepository extends IBaseRepository<IConversationDocument> {
    findOrCreate(participantIds: string[], participantModels: ('User' | 'Doctor')[]): Promise<IConversationDocument>;
    findByParticipantIds(participantIds: string[]): Promise<IConversationDocument | null>;
    findAllForUser(userId: string): Promise<IConversationPopulated[]>;
    updateLastMessage(conversationId: string, messageId: string): Promise<void>;
    updateActiveAppointment(conversationId: string, appointmentId: string): Promise<void>;
}
