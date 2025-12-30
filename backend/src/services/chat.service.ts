import { IChatService } from "./interfaces/IChatService";
import { IMessageRepository } from "../repositories/interfaces/IMessage.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IMessage } from "../models/message.model";
import { LoggerService } from "./logger.service";
import { socketService } from "./socket.service";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/constants";

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
            appointmentId,
            senderId,
            senderModel,
            content,
            type,
            read: false
        });
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
                        content: lastMessage.content,
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
}
