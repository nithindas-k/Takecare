import { IChatService, ConversationItem } from "./interfaces/IChatService";
import { IMessageRepository } from "../repositories/interfaces/IMessage.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IConversationRepository } from "../repositories/interfaces/IConversationRepository";
import { IAppointmentDocument, IAppointmentPopulated } from "../types/appointment.type";
import { IMessage } from "../models/message.model";
import { IConversationDocument } from "../models/conversation.model";
import { socketService } from "./socket.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";
import { Types } from "mongoose";
import { SESSION_STATUS } from "../utils/sessionStatus.util";
import { ILoggerService } from "./interfaces/ILogger.service";

export class ChatService implements IChatService {
    constructor(
        private _messageRepository: IMessageRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _doctorRepository: IDoctorRepository,
        private _conversationRepository: IConversationRepository,
        private _logger: ILoggerService
    ) {
    }

    private _isSessionActive(apt: Pick<IAppointmentDocument, 'sessionStatus' | 'status' | 'postConsultationChatWindow'>): boolean {
        const now = new Date();
        if (apt.sessionStatus !== SESSION_STATUS.ENDED && apt.status !== "completed") return true;
        const window = apt.postConsultationChatWindow;
        return !!(window?.isActive && window.expiresAt && new Date(window.expiresAt) > now);
    }

    private async _getConversationForAppointment(appointmentId: string): Promise<IConversationDocument | null> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) return null;

        const pId = appointment.patientId.toString();
        const dId = appointment.doctorId.toString();

        const conv = await this._conversationRepository.findOrCreate([pId, dId], ['User', 'Doctor']);

        if (conv._id) {
            await this._conversationRepository.updateActiveAppointment(conv._id.toString(), appointmentId);
        }

        return conv;
    }

    async saveMessage(
        conversationId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text',
        fileName?: string,
        appointmentId?: string
    ): Promise<IMessage> {
        const message = await this._messageRepository.create({
            conversationId: new Types.ObjectId(conversationId),
            appointmentId: appointmentId ? new Types.ObjectId(appointmentId) : undefined,
            senderId: new Types.ObjectId(senderId),
            senderModel,
            content,
            fileName,
            type,
            read: false,
            isDeleted: false
        });

        await this._conversationRepository.updateLastMessage(conversationId, String(message._id));
        return message;
    }

    async sendMessage(
        id: string,
        userId: string,
        userRole: string,
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text',
        fileName?: string
    ): Promise<IMessage> {
        let conversation: IConversationDocument | null = null;
        let appointment: IAppointmentDocument | null = null;

        const possibleApt = await this._appointmentRepository.findById(id);
        if (possibleApt) {
            appointment = possibleApt;
            conversation = await this._getConversationForAppointment(id);
        } else {
            conversation = await this._conversationRepository.findById(id);
            if (!conversation) throw new AppError('Conversation or Appointment not found', HttpStatus.NOT_FOUND);

            const pId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'User')?.toString();
            const dId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'Doctor')?.toString();
            const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 100);
            const foundApt = appointments.find(apt => this._isSessionActive(apt));
            appointment = (foundApt || appointments[0]) as unknown as IAppointmentDocument;
        }

        if (!appointment) {
            throw new AppError('No appointment found for this chat context', HttpStatus.NOT_FOUND);
        }

        if (!conversation) {
            throw new AppError('No conversation found', HttpStatus.NOT_FOUND);
        }

        const conversationId = String(conversation._id);

        if (!this._isSessionActive(appointment)) {
            throw new AppError("The chat session has ended. No further messages can be sent.", HttpStatus.BAD_REQUEST);
        }

        let senderModel: 'User' | 'Doctor' = 'User';
        let actualSenderId = userId;
        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) throw new AppError('Doctor profile not found', HttpStatus.NOT_FOUND);
            actualSenderId = doctor._id.toString();
            senderModel = 'Doctor';
        }

        const message = await this.saveMessage(
            conversationId,
            actualSenderId,
            senderModel,
            content,
            type,
            fileName,
            String(appointment._id)
        );

        const messagePayload = {
            ...message.toObject(),
            id: String(message._id),
            conversationId,
            appointmentId: String(appointment._id)
        };

        socketService.emitToRoom(conversationId, "receive-message", messagePayload);

        return message;
    }

    async getMessages(id: string): Promise<IMessage[]> {
        let conversationId = id;
        let conversation: IConversationDocument | null = null;

        const appointment = await this._appointmentRepository.findById(id);
        if (appointment) {
            conversation = await this._getConversationForAppointment(id);
            if (conversation) conversationId = String(conversation._id);
        } else {
            conversation = await this._conversationRepository.findById(id);
            conversationId = id;
        }

        if (!conversation && !conversationId) return [];

        if (!conversation && conversationId) {
            conversation = await this._conversationRepository.findById(conversationId);
        }

        let legacyIds: string[] = [];
        if (conversation) {
            const pId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'User')?.toString();
            const dId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'Doctor')?.toString();

            if (pId && dId) {
                const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 1000);
                legacyIds = appointments.map(a => a._id.toString());
            }
        }

        return await this._messageRepository.findByConversationId(conversationId, legacyIds);
    }

    async markMessagesAsRead(id: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void> {
        let conversationId = id;

        const appointment = await this._appointmentRepository.findById(id);
        if (appointment) {
            const conversation = await this._getConversationForAppointment(id);
            if (conversation) conversationId = String(conversation._id);
        }

        let actualUserId = userId;
        if (userModel === 'Doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (doctor) actualUserId = doctor._id.toString();
        }

        await this._messageRepository.markAsReadByConversation(conversationId, actualUserId);
    }

    async getConversation(id: string): Promise<ConversationItem> {
        let conversation: IConversationDocument | null = null;
        const possibleApt = await this._appointmentRepository.findById(id);

        if (possibleApt) {
            conversation = await this._getConversationForAppointment(id);
        } else {
            conversation = await this._conversationRepository.findById(id);
        }

        if (!conversation) throw new AppError('Conversation not found', HttpStatus.NOT_FOUND);

        const pId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'User')?.toString();
        const dId = conversation.participants.find((p, i) => conversation!.participantModels[i] === 'Doctor')?.toString();

        const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 100);

        const activeApt = appointments.find(apt => this._isSessionActive(apt)) || appointments[0];

        let patientDetails: unknown = null;
        let doctorDetails: unknown = null;

        if (activeApt) {
            patientDetails = activeApt.patientId;
            doctorDetails = activeApt.doctorId;
        } else {
            if (dId) doctorDetails = await this._doctorRepository.getDoctorRequestDetailById(dId);
            if (pId) {
                const pApts = await this._appointmentRepository.findAll({ patientId: pId }, 0, 1);
                if (pApts.appointments.length > 0) patientDetails = pApts.appointments[0].patientId;
            }
        }

        const convObj = (conversation.toObject ? conversation.toObject() : conversation) as Record<string, unknown>;

        convObj.patient = patientDetails;
        convObj.doctor = doctorDetails;

        if (activeApt) {
            convObj.sessionStatus = activeApt.sessionStatus;
            convObj.isLocked = !this._isSessionActive(activeApt);
            convObj.activeAppointmentId = activeApt._id.toString();
        } else {
            convObj.isLocked = true;
        }

        return convObj as unknown as ConversationItem;
    }

    async getConversations(userId: string, userRole: string): Promise<ConversationItem[]> {
        let actualUserId = userId;
        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) return [];
            actualUserId = doctor._id.toString();
        }

        const conversations = await this._conversationRepository.findAllForUser(actualUserId);

        const items = await Promise.all(conversations.map(async (conv) => {
            const pId = conv.participants.find((p, i) => conv.participantModels[i] === 'User')?.toString();
            const dId = conv.participants.find((p, i) => conv.participantModels[i] === 'Doctor')?.toString();

            if (!pId || !dId) return null;

            let patientDetails: unknown = null;
            let doctorDetails: unknown = null;

            let latestApt: IAppointmentPopulated | undefined;
            const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 1);

            if (appointments && appointments.length > 0) {
                latestApt = appointments[0];
                patientDetails = latestApt.patientId;
                doctorDetails = latestApt.doctorId;
            }

            if (!doctorDetails && dId) {
                doctorDetails = await this._doctorRepository.getDoctorRequestDetailById(dId);
            }

            if (!patientDetails && pId) {
                const pApts = await this._appointmentRepository.findAll({ patientId: pId }, 0, 1);
                if (pApts.appointments.length > 0) {
                    patientDetails = pApts.appointments[0].patientId;
                }
            }

            const patientData = patientDetails;
            const doctorData = doctorDetails;

            return {
                appointmentId: String(conv._id),
                conversationId: String(conv._id),
                realAppointmentId: latestApt ? String(latestApt._id) : null,
                customId: latestApt ? latestApt.customId : 'CHAT',
                appointmentType: latestApt ? latestApt.appointmentType : 'consultation',
                status: latestApt ? latestApt.status : 'active',
                patient: patientData || { name: 'Patient', _id: pId },
                doctor: doctorData || { name: 'Doctor', _id: dId },
                lastMessage: conv.lastMessage ? {
                    content: conv.lastMessage.isDeleted ? 'Message deleted' : conv.lastMessage.content,
                    createdAt: conv.lastMessage.createdAt,
                    type: conv.lastMessage.type as 'text' | 'image' | 'file' | 'system'
                } : null,
                unreadCount: await this._messageRepository.countUnreadByConversation(String(conv._id), actualUserId),
                isOnline: false
            };
        }));

        const validItems = items.filter((item): item is ConversationItem => item !== null);
        return validItems.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });
    }

    async getConversationByDoctorId(patientId: string, doctorId: string): Promise<ConversationItem> {
        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) throw new AppError('Doctor not found', HttpStatus.NOT_FOUND);

        const conv = await this._conversationRepository.findOrCreate([patientId, doctorId], ['User', 'Doctor']);
        return this.getConversation(String(conv._id));
    }

    async editMessage(messageId: string, content: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) throw new AppError('Message not found', HttpStatus.NOT_FOUND);

        let actualUserId = userId;
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) actualUserId = doctor._id.toString();

        if (message.senderId.toString() !== actualUserId) throw new AppError('Unauthorized', HttpStatus.FORBIDDEN);
        if (message.isDeleted) throw new AppError('Cannot edit deleted message', HttpStatus.BAD_REQUEST);

        const updated = await this._messageRepository.updateById(messageId, { content, isEdited: true });
        if (!updated) throw new AppError('Update failed', HttpStatus.INTERNAL_ERROR);

        socketService.emitToRoom(updated.conversationId.toString(), 'edit-message', updated);
        return updated;
    }

    async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) throw new AppError('Message not found', HttpStatus.NOT_FOUND);

        let actualUserId = userId;
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) actualUserId = doctor._id.toString();

        if (message.senderId.toString() !== actualUserId) throw new AppError('Unauthorized', HttpStatus.FORBIDDEN);

        const updated = await this._messageRepository.updateById(messageId, { isDeleted: true, content: 'This message was deleted' });
        if (!updated) throw new AppError('Delete failed', HttpStatus.INTERNAL_ERROR);

        socketService.emitToRoom(updated.conversationId.toString(), 'delete-message', {
            messageId: String(updated._id),
            conversationId: updated.conversationId.toString()
        });
        return updated;
    }

    async sendSystemMessage(appointmentId: string, content: string): Promise<IMessage> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) throw new AppError('Appointment not found', HttpStatus.NOT_FOUND);

        const conversation = await this._getConversationForAppointment(appointmentId);
        if (!conversation) throw new AppError('Conversation could not be created', HttpStatus.INTERNAL_ERROR);

        const conversationId = String(conversation._id);

        const drId = appointment.doctorId.toString();

        const message = await this.saveMessage(
            conversationId,
            drId,
            'Doctor',
            content,
            'system',
            undefined,
            appointmentId
        );

        const messagePayload = {
            ...message.toObject(),
            id: String(message._id),
            conversationId,
            appointmentId
        };

        socketService.emitToRoom(conversationId, "receive-message", messagePayload);

        return message;
    }
}
