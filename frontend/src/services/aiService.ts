import axiosInstance from "../api/axiosInstance";

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

const AI_API_URL = "/ai";

export const aiService = {

    sendMessage: async (message: string): Promise<AIChatResponse> => {
        const response = await axiosInstance.post(`${AI_API_URL}/match-doctor`, { message });
        return response.data.data;
    },


    getHistory: async (): Promise<ChatMessage[]> => {
        const response = await axiosInstance.get(`${AI_API_URL}/match-history`);
        return response.data.data;
    },


    resetConversation: async (): Promise<void> => {
        await axiosInstance.post(`${AI_API_URL}/match-reset`);
    },
};
