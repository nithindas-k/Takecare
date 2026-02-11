import axiosInstance from "../api/axiosInstance";
import { AI_API_ROUTES } from "../utils/constants";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
    recommendations?: DoctorRecommendation;
}

export interface DoctorMatch {
    doctorId: string;
    matcherId?: string;
    name: string;
    specialty: string;
    profileImage?: string;
    matchScore: number;
    reasoning: string;
    pros?: string[];
    cons?: string[];
    availabilitySummary?: string;
}

export interface DoctorRecommendation {
    patientConcern: string;
    recommendedSpecialty: string;
    urgencyLevel: "low" | "medium" | "high" | "emergency";
    doctorMatches: DoctorMatch[];
    followUpQuestions?: string[];
    emergencyFlag: boolean;
}

export interface AIChatResponse {
    message: string;
    recommendations?: DoctorRecommendation;
    conversationId?: string;
    requiresAction: boolean;
}

export const aiService = {
    sendMessage: async (message: string) => {
        const response = await axiosInstance.post(AI_API_ROUTES.MATCH_DOCTOR, { message });
        return response.data;
    },

    getHistory: async () => {
        const response = await axiosInstance.get(AI_API_ROUTES.MATCH_HISTORY);
        return response.data;
    },

    resetConversation: async () => {
        const response = await axiosInstance.post(AI_API_ROUTES.MATCH_RESET);
        return response.data;
    },
};
