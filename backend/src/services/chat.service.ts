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

        if (appointment.sessionStatus === "ENDED" || appointment.status === "completed") {
            // Check if post-consultation window is active
            const window = appointment.postConsultationChatWindow;
            const now = new Date();
            const isWindowOpen = window?.isActive && window.expiresAt && new Date(window.expiresAt) > now;

            if (!isWindowOpen) {
                throw new AppError("This session has ended. No further messages can be sent.", HttpStatus.BAD_REQUEST);
            }
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

        const patientId = appointment.patientId.toString();
        const doctorId = appointment.doctorId.toString();
        const persistentRoomId = `persistent-${patientId}-${doctorId}`;

        console.log(`[CHAT_SERVICE] Broadcasting to room ${realAppointmentId} and ${persistentRoomId}`);
        socketService.emitMessage(realAppointmentId, message);
        socketService.emitMessage(persistentRoomId, message);

        return message;
    }

    async getMessages(appointmentId: string): Promise<IMessage[]> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            return [];
        }

        const patientId = appointment.patientId.toString();
        const doctorId = appointment.doctorId.toString();

        const { appointments } = await this._appointmentRepository.findAll({
            patientId,
            doctorId
        }, 0, 1000);

        const allIds = appointments.map((a: any) => a._id.toString());
        return await this._messageRepository.findByAppointmentIds(allIds);
    }

    async markMessagesAsRead(appointmentId: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) return;

        const patientId = appointment.patientId.toString();
        const doctorId = appointment.doctorId.toString();

        const { appointments } = await this._appointmentRepository.findAll({ patientId, doctorId }, 0, 1000);
        const allIds = appointments.map((a: any) => a._id.toString());

        let excludeSenderId = userId;
        if (userModel === 'Doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (doctor) {
                excludeSenderId = (doctor as any)._id.toString();
            }
        }

        await this._messageRepository.markAsReadByIds(allIds, excludeSenderId);
    }

    async getConversations(userId: string, userRole: string): Promise<any[]> {
        let appointmentsResult: { appointments: any[], total: number };

        if (userRole === 'doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor) return [];
            appointmentsResult = await this._appointmentRepository.findAll({
                doctorId: doctor._id.toString()
            }, 0, 1000);
        } else {
            appointmentsResult = await this._appointmentRepository.findAll({
                patientId: userId
            }, 0, 1000);
        }

        const { appointments } = appointmentsResult;


        const groups = new Map<string, any[]>();
        appointments.forEach(apt => {
            const pId = apt.patientId?._id?.toString() || apt.patientId?.toString();
            const dId = apt.doctorId?._id?.toString() || apt.doctorId?.toString();
            if (!pId || !dId) return;
            const key = [pId, dId].sort().join('-');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(apt);
        });

        const conversations = await Promise.all(
            Array.from(groups.values()).map(async (group) => {

                group.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
                const latestApt = group[0];
                const allAptIds = group.map(a => a._id.toString());

                const lastMessage = await this._messageRepository.findLastMessageByAppointmentIds(allAptIds);
                if (!lastMessage) return null;

                let excludeSenderId = userId;
                if (userRole === 'doctor') {
                    const doctor = await this._doctorRepository.findByUserId(userId);
                    excludeSenderId = doctor?._id?.toString() || userId;
                }

                const unreadCount = await this._messageRepository.countUnreadInAppointments(allAptIds, excludeSenderId);

                return {
                    appointmentId: latestApt._id,
                    customId: latestApt.customId,
                    appointmentType: latestApt.appointmentType,
                    status: latestApt.status,
                    patient: latestApt.patientId,
                    doctor: latestApt.doctorId,
                    lastMessage: {
                        content: lastMessage.isDeleted ? 'Message deleted' : lastMessage.content,
                        createdAt: lastMessage.createdAt,
                        senderModel: lastMessage.senderModel
                    },
                    unreadCount
                };
            })
        );

        return (conversations.filter(c => c !== null) as any[])
            .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    }

    async editMessage(messageId: string, content: string, userId: string): Promise<IMessage> {
        throw new AppError("Editing messages is not allowed in this consultation chat.", HttpStatus.FORBIDDEN);
    }

    async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
        throw new AppError("Deleting messages is not allowed in this consultation chat.", HttpStatus.FORBIDDEN);
    }
}
