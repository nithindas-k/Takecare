import { IChatService } from "./interfaces/IChatService";
import { IMessageRepository } from "../repositories/interfaces/IMessage.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IMessage } from "../models/message.model";
import { LoggerService } from "./logger.service";
import { socketService } from "./socket.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";
import { Types } from "mongoose";

export class ChatService implements IChatService {
    private readonly logger: LoggerService;

    constructor(
        private _messageRepository: IMessageRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _doctorRepository: IDoctorRepository
    ) {
        this.logger = new LoggerService("ChatService");
    }

    async saveMessage(
        appointmentId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text'
    ): Promise<IMessage> {
        return await this._messageRepository.create({
            appointmentId: new Types.ObjectId(appointmentId) as any,
            senderId: new Types.ObjectId(senderId) as any,
            senderModel,
            content,
            type,
            read: false,
            isDeleted: false
        } as any);
    }

    async sendMessage(
        appointmentId: string,
        userId: string,
        userRole: string,
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text'
    ): Promise<IMessage> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError('Appointment not found', HttpStatus.NOT_FOUND);
        }
        const realAppointmentId = (appointment as any)._id.toString();

        let senderModel: 'User' | 'Doctor' = 'User';
        let actualSenderId = userId;

        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) {
                throw new AppError('Doctor profile not found', HttpStatus.NOT_FOUND);
            }
            actualSenderId = doctor._id.toString();
            senderModel = 'Doctor';
        }

        const message = await this.saveMessage(
            realAppointmentId,
            actualSenderId,
            senderModel,
            content,
            type
        );

        console.log(`[CHAT_SERVICE] Broadcasting saved message to room ${realAppointmentId}`);
        socketService.emitMessage(realAppointmentId, message);

        return message;
    }

    async getMessages(appointmentId: string): Promise<IMessage[]> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            return [];
        }
        const realId = (appointment as any)._id.toString();
        return await this._messageRepository.findByAppointmentId(realId);
    }

    async markMessagesAsRead(appointmentId: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) return;
        const realId = (appointment as any)._id.toString();

        let excludeSenderId = userId;
        if (userModel === 'Doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (doctor) {
                excludeSenderId = (doctor as any)._id.toString();
            }
        }

        await this._messageRepository.markAsRead(realId, excludeSenderId);
    }

    async getConversations(userId: string, userRole: string): Promise<any[]> {
        let appointmentsResult: { appointments: any[], total: number };

        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) {
                return [];
            }
            // Use specific doctor filter in repository
            appointmentsResult = await this._appointmentRepository.findAll({
                doctorId: doctor._id.toString(),
                status: 'confirmed' // Or whatever default is needed, Repository handles the rest
            }, 0, 100);

            // Note: If the repository only allows one status string, and we need multiple, 
            // we might need to adjust the repository or call it multiple times.
            // But usually 'confirmed' is enough for active chats.
        } else {
            appointmentsResult = await this._appointmentRepository.findAll({
                patientId: userId,
                status: 'confirmed'
            }, 0, 100);
        }

        const { appointments } = appointmentsResult;

        const conversationsWithMessages = await Promise.all(
            appointments.map(async (appointment: any) => {
                const appointmentIdStr = appointment._id.toString();
                const lastMessage = await this._messageRepository.findLastMessageByAppointmentId(appointmentIdStr);

                let excludeSenderId = userId;
                if (userRole === 'doctor') {
                    const doctor = await this._doctorRepository.findByUserId(userId);
                    excludeSenderId = doctor?._id?.toString() || userId;
                }

                const unreadCount = await this._messageRepository.countUnread(appointmentIdStr, excludeSenderId);

                return {
                    appointmentId: appointment._id,
                    customId: appointment.customId,
                    appointmentType: appointment.appointmentType,
                    status: appointment.status,
                    patient: appointment.patientId,
                    doctor: appointment.doctorId,
                    lastMessage: lastMessage ? {
                        content: lastMessage.isDeleted ? 'Message deleted' : lastMessage.content,
                        createdAt: lastMessage.createdAt,
                        senderModel: lastMessage.senderModel
                    } : null,
                    unreadCount
                };
            })
        );

        return conversationsWithMessages
            .filter(conv => conv.lastMessage !== null) // Only show active chats with messages
            .sort((a, b) => {
                const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                return timeB - timeA;
            });
    }

    async editMessage(messageId: string, content: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) {
            throw new AppError('Message not found', HttpStatus.NOT_FOUND);
        }

        // Verify if the user is the sender
        // We need to check both userId (from req.user) and doctorId if they are a doctor
        const isUserSender = message.senderId.toString() === userId;
        let isDoctorSender = false;

        console.log(`[CHAT_SERVICE] Verifying edit permission for user ${userId}. Message sender: ${message.senderId}`);

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) {
            isDoctorSender = message.senderId.toString() === doctor._id.toString();
            console.log(`[CHAT_SERVICE] User is a doctor. Doctor ID: ${doctor._id}. Match: ${isDoctorSender}`);
        }

        if (!isUserSender && !isDoctorSender) {
            this.logger.error(`Unauthorized edit attempt by user ${userId} for message ${messageId}`);
            throw new AppError('You are not authorized to edit this message', HttpStatus.FORBIDDEN);
        }

        if (message.isDeleted) {
            throw new AppError('Cannot edit a deleted message', HttpStatus.BAD_REQUEST);
        }

        const updatedMessage = await this._messageRepository.updateById(messageId, { content, isEdited: true });
        if (!updatedMessage) {
            throw new AppError('Failed to update message', HttpStatus.INTERNAL_ERROR);
        }

        socketService.emitToRoom(message.appointmentId.toString(), 'edit-message', updatedMessage);
        return updatedMessage;
    }

    async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) {
            throw new AppError('Message not found', HttpStatus.NOT_FOUND);
        }

        const isUserSender = message.senderId.toString() === userId;
        let isDoctorSender = false;

        console.log(`[CHAT_SERVICE] Verifying delete permission for user ${userId}. Message sender: ${message.senderId}`);

        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) {
            isDoctorSender = message.senderId.toString() === doctor._id.toString();
            console.log(`[CHAT_SERVICE] User is a doctor. Doctor ID: ${doctor._id}. Match: ${isDoctorSender}`);
        }

        if (!isUserSender && !isDoctorSender) {
            this.logger.error(`Unauthorized delete attempt by user ${userId} for message ${messageId}`);
            throw new AppError('You are not authorized to delete this message', HttpStatus.FORBIDDEN);
        }

        const deletedMessage = await this._messageRepository.deleteById(messageId);
        if (!deletedMessage) {
            throw new AppError('Failed to delete message', HttpStatus.INTERNAL_ERROR);
        }

        socketService.emitToRoom(message.appointmentId.toString(), 'delete-message', {
            messageId,
            appointmentId: message.appointmentId.toString()
        });
        return deletedMessage;
    }
}
