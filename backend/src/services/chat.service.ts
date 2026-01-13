import { IChatService, ConversationItem } from "./interfaces/IChatService";
import { IMessageRepository } from "../repositories/interfaces/IMessage.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IAppointmentPopulated } from "../types/appointment.type";
import { IMessage } from "../models/message.model";
import { LoggerService } from "./logger.service";
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
        private _logger: ILoggerService
    ) {
    }

    async saveMessage(
        appointmentId: string,
        senderId: string,
        senderModel: 'User' | 'Doctor',
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text',
        fileName?: string
    ): Promise<IMessage> {
        return await this._messageRepository.create({
            appointmentId: new Types.ObjectId(appointmentId),
            senderId: new Types.ObjectId(senderId),
            senderModel,
            content,
            fileName,
            type,
            read: false,
            isDeleted: false
        });
    }

    async sendMessage(
        appointmentId: string,
        userId: string,
        userRole: string,
        content: string,
        type: 'text' | 'image' | 'file' | 'system' = 'text',
        fileName?: string
    ): Promise<IMessage> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) {
            throw new AppError('Appointment not found', HttpStatus.NOT_FOUND);
        }

        let targetAppointment = appointment;
        const now = new Date();

        const isSessionActive = (apt: IAppointmentDocument) => {
            if (apt.sessionStatus !== SESSION_STATUS.ENDED && apt.status !== "completed") return true;
            const window = apt.postConsultationChatWindow;
            return window?.isActive && window.expiresAt && new Date(window.expiresAt) > now;
        };

        if (!isSessionActive(appointment)) {
            const pId = appointment.patientId.toString();
            const dId = appointment.doctorId.toString();
            const { appointments } = await this._appointmentRepository.findAll({ patientId: pId, doctorId: dId }, 0, 100);

            const activeApt = appointments.find(apt => isSessionActive(apt));
            if (activeApt) {
                targetAppointment = activeApt;
            } else {
                throw new AppError("This session and all other related sessions have ended. No further messages can be sent.", HttpStatus.BAD_REQUEST);
            }
        }

        const realAppointmentId = targetAppointment._id.toString();

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
            type,
            fileName
        );

        const patient = await this._appointmentRepository.findByIdPopulated(realAppointmentId);
        const patientUserId = patient?.patient?.id || patient?.patientId?.toString();
        const doctorUserId = patient?.doctor?.user?.id || patient?.doctor?.userId?.toString();

        console.log(`[CHAT_SERVICE] Broadcasting to users: ${patientUserId}, ${doctorUserId}`);


        const pId = patient?.patient?.id || patient?.patientId?.toString();
        const dId = patient?.doctor?.id || patient?.doctorId?.toString();
        let persistentRoomId = "";
        if (pId && dId) {
            persistentRoomId = `persistent-${pId}-${dId}`;
        }

        const messagePayload = {
            ...message.toObject(),
            id: message._id.toString(),
            persistentRoomId
        };

        if (patientUserId) socketService.emitToUser(patientUserId, "receive-message", messagePayload);
        if (doctorUserId) socketService.emitToUser(doctorUserId, "receive-message", messagePayload);

        if (persistentRoomId) {
            socketService.emitToRoom(persistentRoomId, "receive-message", messagePayload);
        }


        socketService.emitMessage(realAppointmentId, messagePayload);

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

        const allIds = appointments.map((a) => a._id.toString());
        return await this._messageRepository.findByAppointmentIds(allIds);
    }

    async markMessagesAsRead(appointmentId: string, userId: string, userModel: 'User' | 'Doctor'): Promise<void> {
        const appointment = await this._appointmentRepository.findById(appointmentId);
        if (!appointment) return;

        const patientId = appointment.patientId.toString();
        const doctorId = appointment.doctorId.toString();

        const { appointments } = await this._appointmentRepository.findAll({ patientId, doctorId }, 0, 1000);
        const allIds = appointments.map((a) => a._id.toString());

        let excludeSenderId = userId;
        if (userModel === 'Doctor') {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (doctor) {
                excludeSenderId = doctor._id.toString();
            }
        }

        await this._messageRepository.markAsReadByIds(allIds, excludeSenderId);
    }

    async getConversations(userId: string, userRole: string): Promise<ConversationItem[]> {
        let appointmentsResult: { appointments: IAppointmentPopulated[], total: number };

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


        const groups = new Map<string, IAppointmentPopulated[]>();
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

        return (conversations.filter((c): c is ConversationItem => c !== null))
            .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    }

    async editMessage(messageId: string, content: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) {
            throw new AppError('Message not found', HttpStatus.NOT_FOUND);
        }


        let actualUserId = userId;
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) {
            actualUserId = doctor._id.toString();
        }

        if (message.senderId.toString() !== actualUserId) {
            throw new AppError('Unauthorized to edit this message', HttpStatus.FORBIDDEN);
        }


        if (message.isDeleted) {
            throw new AppError('Cannot edit a deleted message', HttpStatus.BAD_REQUEST);
        }

        const updated = await this._messageRepository.updateById(messageId, {
            content,
            isEdited: true
        });

        if (!updated) {
            throw new AppError('Failed to update message', HttpStatus.INTERNAL_ERROR);
        }

        const appointmentId = updated.appointmentId.toString();
        socketService.emitToRoom(appointmentId, 'edit-message', updated);

        return updated;
    }

    async deleteMessage(messageId: string, userId: string): Promise<IMessage> {
        const message = await this._messageRepository.findById(messageId);
        if (!message) {
            throw new AppError('Message not found', HttpStatus.NOT_FOUND);
        }

        let actualUserId = userId;
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (doctor) {
            actualUserId = doctor._id.toString();
        }

        if (message.senderId.toString() !== actualUserId) {
            throw new AppError('Unauthorized to delete this message', HttpStatus.FORBIDDEN);
        }

        const updated = await this._messageRepository.updateById(messageId, {
            isDeleted: true,
            content: 'This message was deleted'
        });

        if (!updated) {
            throw new AppError('Failed to delete message', HttpStatus.INTERNAL_ERROR);
        }

        const appointmentId = updated.appointmentId.toString();
        socketService.emitToRoom(appointmentId, 'delete-message', {
            messageId: updated._id.toString(),
            appointmentId
        });

        return updated;
    }
}
