import { IChatService, ConversationItem } from "./interfaces/IChatService";
import { IMessageRepository } from "../repositories/interfaces/IMessage.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IConversationRepository } from "../repositories/interfaces/IConversationRepository";
import { IAppointmentPopulated } from "../types/appointment.type";
import { IMessage } from "../models/message.model";
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

    private _isSessionActive(apt: any): boolean {
        const now = new Date();
        if (apt.sessionStatus !== SESSION_STATUS.ENDED && apt.status !== "completed") return true;
        const window = apt.postConsultationChatWindow;
        return !!(window?.isActive && window.expiresAt && new Date(window.expiresAt) > now);
    }

    private async _getConversationForAppointment(appointmentId: string): Promise<any> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) return null;

        const pId = appointment.patientId.toString();
        const dId = appointment.doctorId.toString();

        const conv = await this._conversationRepository.findOrCreate([pId, dId], ['User', 'Doctor']);
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

        await this._conversationRepository.updateLastMessage(conversationId, (message._id as any).toString());
        return message;
    }

    async sendMessage(
        id: string, // Can be appointmentId or conversationId
        userId: string,
        userRole: string,
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text',
        fileName?: string
    ): Promise<IMessage> {
        let conversation: any;
        let appointment: any;

        // 1. Resolve logical context
        const possibleApt = await this._appointmentRepository.findById(id);
        if (possibleApt) {
            appointment = possibleApt;
            conversation = await this._getConversationForAppointment(id);
        } else {
            conversation = await this._conversationRepository.findById(id);
            if (!conversation) throw new AppError('Conversation or Appointment not found', HttpStatus.NOT_FOUND);

            // Resolve the current active appointment for this conversation
            const pId = conversation.participants.find((p: any, i: any) => conversation.participantModels[i] === 'User')?.toString();
            const dId = conversation.participants.find((p: any, i: any) => conversation.participantModels[i] === 'Doctor')?.toString();
            const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 100);
            appointment = appointments.find(apt => this._isSessionActive(apt)) || appointments[0];
        }

        if (!appointment) {
            throw new AppError('No appointment found for this chat context', HttpStatus.NOT_FOUND);
        }

        const conversationId = (conversation._id as any).toString();

        // 2. Access Control: Is the resolved session active?
        if (!this._isSessionActive(appointment)) {
            throw new AppError("The chat session has ended. No further messages can be sent.", HttpStatus.BAD_REQUEST);
        }

        // 3. Sender Identification
        let senderModel: 'User' | 'Doctor' = 'User';
        let actualSenderId = userId;
        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) throw new AppError('Doctor profile not found', HttpStatus.NOT_FOUND);
            actualSenderId = doctor._id.toString();
            senderModel = 'Doctor';
        }

        // 4. Save Message
        const message = await this.saveMessage(
            conversationId,
            actualSenderId,
            senderModel,
            content,
            type,
            fileName,
            appointment._id.toString()
        );

        // 5. Real-time Broadcasting
        const messagePayload = {
            ...message.toObject(),
            id: (message._id as any).toString(),
            conversationId,
            appointmentId: appointment._id.toString()
        };

        // Broadcast to conversation room
        socketService.emitToRoom(conversationId, "receive-message", messagePayload);

        return message;
    }

    async getMessages(id: string): Promise<IMessage[]> {
        let conversationId = id;
        let conversation: any;

        // Try to resolve conversation if id is an appointmentId
        const appointment = await this._appointmentRepository.findById(id);
        if (appointment) {
            conversation = await this._getConversationForAppointment(id);
            if (conversation) conversationId = (conversation._id as any).toString();
        } else {
            conversation = await this._conversationRepository.findById(id);
            conversationId = id; // Assuming id passed is conversationId
        }

        if (!conversation && !conversationId) return [];

        // If we found the conversation, let's gather all related appointment IDs for legacy history
        if (!conversation && conversationId) {
            conversation = await this._conversationRepository.findById(conversationId);
        }

        let legacyIds: string[] = [];
        if (conversation) {
            const pId = conversation.participants.find((p: any, i: number) => conversation.participantModels[i] === 'User')?.toString();
            const dId = conversation.participants.find((p: any, i: number) => conversation.participantModels[i] === 'Doctor')?.toString();

            if (pId && dId) {
                // Fetch all appointments for this pair to link legacy messages
                const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 1000);
                legacyIds = appointments.map(a => (a._id as any).toString());
            }
        }

        return await this._messageRepository.findByConversationId(conversationId, legacyIds);
    }

    async markMessagesAsRead(id: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void> {
        let conversationId = id;

        // If id is appointmentId, resolve conversation
        const appointment = await this._appointmentRepository.findById(id);
        if (appointment) {
            const conversation = await this._getConversationForAppointment(id);
            if (conversation) conversationId = (conversation._id as any).toString();
        }

        let actualUserId = userId;
        if (userModel === 'Doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (doctor) actualUserId = doctor._id.toString();
        }

        await this._messageRepository.markAsReadByConversation(conversationId, actualUserId);
    }

    async getConversation(id: string): Promise<any> {
        let conversation: any;
        const possibleApt = await this._appointmentRepository.findById(id);

        if (possibleApt) {
            conversation = await this._getConversationForAppointment(id);
        } else {
            conversation = await this._conversationRepository.findById(id);
        }

        if (!conversation) throw new AppError('Conversation not found', HttpStatus.NOT_FOUND);

        
        const pId = conversation.participants.find((p: any, i: any) => conversation.participantModels[i] === 'User')?.toString();
        const dId = conversation.participants.find((p: any, i: any) => conversation.participantModels[i] === 'Doctor')?.toString();

        const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 100);

   
        const activeApt = appointments.find(apt => this._isSessionActive(apt)) || appointments[0];

     
        let patientDetails: any = null;
        let doctorDetails: any = null;

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

        const convObj = conversation.toObject ? conversation.toObject() : conversation;

        // Attach details
        convObj.patient = patientDetails;
        convObj.doctor = doctorDetails;

        if (activeApt) {
            convObj.sessionStatus = activeApt.sessionStatus;
            convObj.isLocked = !this._isSessionActive(activeApt);
            convObj.activeAppointmentId = activeApt._id;
        } else {
            convObj.isLocked = true;
        }

        return convObj;
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

            // 1. Fetch Details Helper
            let patientDetails: any = null;
            let doctorDetails: any = null;

            // Fetch Patient (User) & Doctor - Try via Appointment first
            let latestApt: any;
            const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 1);

            if (appointments && appointments.length > 0) {
                latestApt = appointments[0];
                patientDetails = latestApt.patientId;
                doctorDetails = latestApt.doctorId;
            }

            // Fallback fetches if no common appointment found 
            if (!doctorDetails && dId) {
                doctorDetails = await this._doctorRepository.getDoctorRequestDetailById(dId);
            }

            if (!patientDetails && pId) {
                // Try to recover patient details from any appointment
                const pApts = await this._appointmentRepository.findAll({ patientId: pId }, 0, 1);
                if (pApts.appointments.length > 0) {
                    patientDetails = pApts.appointments[0].patientId;
                }
            }

            // If still no details, we can't display much, but we shouldn't crash
            // Ideally we should have UserRepository injected to just findById(pId)

            return {
                appointmentId: (conv._id as any).toString(), // Using conversationId as primary ID
                conversationId: (conv._id as any).toString(),
                realAppointmentId: latestApt ? latestApt._id.toString() : null, // keep track of real apt id
                customId: latestApt ? latestApt.customId : 'CHAT',
                appointmentType: latestApt ? latestApt.appointmentType : 'consultation',
                status: latestApt ? latestApt.status : 'active',
                patient: patientDetails || { name: 'Patient', _id: pId },
                doctor: doctorDetails || { name: 'Doctor', _id: dId },
                lastMessage: conv.lastMessage ? {
                    content: (conv.lastMessage as any).isDeleted ? 'Message deleted' : (conv.lastMessage as any).content,
                    createdAt: (conv.lastMessage as any).createdAt,
                    type: (conv.lastMessage as any).type
                } : null,
                unreadCount: await this._messageRepository.countUnreadByConversation((conv._id as any).toString(), actualUserId),
                isOnline: false // TODO: Real-time status
            };
        }));

        const validItems = items.filter((item): item is ConversationItem => item !== null);
        return validItems.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });
    }

    async getConversationByDoctorId(patientId: string, doctorId: string): Promise<any> {
        const doctor = await this._doctorRepository.findById(doctorId);
        if (!doctor) throw new AppError('Doctor not found', HttpStatus.NOT_FOUND);

        return await this._conversationRepository.findOrCreate([patientId, doctorId], ['User', 'Doctor']);
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
            messageId: (updated._id as any).toString(),
            conversationId: updated.conversationId.toString()
        });
        return updated;
    }
}
