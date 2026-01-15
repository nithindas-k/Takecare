import { IMessage } from "../../models/message.model";
import { IBaseRepository } from "./IBase.repository";

export interface IMessageRepository extends IBaseRepository<IMessage> {
    findByConversationId(conversationId: string, legacyAppointmentIds?: string[]): Promise<IMessage[]>;
    markAsReadByConversation(conversationId: string, excludeSenderId: string): Promise<void>;
    findLastMessageByConversationId(conversationId: string): Promise<IMessage | null>;
    countUnreadByConversation(conversationId: string, excludeSenderId: string): Promise<number>;
}
