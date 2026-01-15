import axiosInstance from "../api/axiosInstance";
import { APPOINTMENT_API_ROUTES, CHAT_API_ROUTES } from "../utils/constants";

export interface IMessage {
    id: string;
    appointmentId: string;
    senderId: string;
    senderModel: 'User' | 'Doctor';
    content: string;
    fileName?: string;
    type: 'text' | 'image' | 'file' | 'system';
    read: boolean;
    isDeleted: boolean;
    isEdited?: boolean;
    _id?: string;
    conversationId?: string;
    createdAt: string;
    updatedAt: string;
}

export const chatService = {
    getMessages: async (id: string): Promise<IMessage[]> => {
        const response = await axiosInstance.get(CHAT_API_ROUTES.GET_MESSAGES(id));
        return response.data.data;
    },

    sendMessage: async (id: string, content: string, type: 'text' | 'image' | 'file' = 'text', fileName?: string): Promise<IMessage> => {
        const response = await axiosInstance.post(CHAT_API_ROUTES.SEND_MESSAGE(id), { content, type, fileName });
        return response.data.data;
    },

    editMessage: async (messageId: string, content: string): Promise<IMessage> => {
        const response = await axiosInstance.patch(CHAT_API_ROUTES.EDIT_MESSAGE(messageId), { content });
        return response.data.data;
    },

    deleteMessage: async (messageId: string): Promise<IMessage> => {
        const response = await axiosInstance.delete(CHAT_API_ROUTES.DELETE_MESSAGE(messageId));
        return response.data.data;
    },

    uploadAttachment: async (id: string, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(CHAT_API_ROUTES.UPLOAD_ATTACHMENT(id), formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data.url;
    },

    startConsultation: async (appointmentId: string) => {
        const response = await axiosInstance.put(APPOINTMENT_API_ROUTES.START_CONSULTATION(appointmentId));
        return response.data;
    },

    getAppointment: async (appointmentId: string) => {
        const response = await axiosInstance.get(APPOINTMENT_API_ROUTES.GET_BY_ID(appointmentId));
        return response.data;
    },

    getConversations: async () => {
        const response = await axiosInstance.get(CHAT_API_ROUTES.GET_CONVERSATIONS);
        return response.data;
    },

    getConversation: async (id: string) => {
        const response = await axiosInstance.get(CHAT_API_ROUTES.GET_CONVERSATION(id));
        return response.data.data;
    },

    getConversationByDoctorId: async (doctorId: string) => {
        const response = await axiosInstance.get(CHAT_API_ROUTES.GET_CONVERSATION_BY_DOCTOR(doctorId));
        return response.data.data;
    }
};
