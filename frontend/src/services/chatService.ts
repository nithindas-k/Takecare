import axiosInstance from "../api/axiosInstance";
import { APPOINTMENT_API_ROUTES, CHAT_API_ROUTES } from "../utils/constants";

export interface IMessage {
    id: string;
    appointmentId: string;
    senderId: string;
    senderModel: 'User' | 'Doctor';
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

export const chatService = {
    getMessages: async (appointmentId: string): Promise<IMessage[]> => {
        const response = await axiosInstance.get(CHAT_API_ROUTES.GET_MESSAGES(appointmentId));
        return response.data.data;
    },

    sendMessage: async (appointmentId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<IMessage> => {
        const response = await axiosInstance.post(CHAT_API_ROUTES.SEND_MESSAGE(appointmentId), { content, type });
        return response.data.data;
    },

    uploadAttachment: async (appointmentId: string, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(CHAT_API_ROUTES.UPLOAD_ATTACHMENT(appointmentId), formData, {
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
    }
};
