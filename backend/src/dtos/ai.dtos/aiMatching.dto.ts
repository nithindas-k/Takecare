

export interface ChatMessageDTO {
    role: "system" | "user" | "assistant";
    content: string;
    recommendations?: DoctorRecommendationDTO;
}

export interface PatientPreferencesDTO {
    location?: string;
    maxBudget?: number;
    gender?: "male" | "female" | "any";
    language?: string;
    urgency?: "same_day" | "this_week" | "flexible";
}

export interface ExtractedInfoDTO {
    chiefComplaint?: string;
    symptoms?: string[];
    duration?: string;
    severity?: "mild" | "moderate" | "severe";
    specialtyNeeded?: string;
    preferences?: PatientPreferencesDTO;
}

export interface AIResponseDTO {
    intent: "gather_info" | "search_doctors" | "book_appointment" | "answer_question";
    extractedInfo: ExtractedInfoDTO;
    emergencyDetected: boolean;
    nextAction: "clarify" | "search" | "recommend" | "book";
    messageToPatient: string;
    searchCriteria?: Record<string, unknown>;
    followUpQuestions?: string[];
}

export interface DoctorMatchDTO {
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

export interface DoctorRecommendationDTO {
    patientConcern: string;
    recommendedSpecialty: string;
    urgencyLevel: "low" | "medium" | "high" | "emergency";
    doctorMatches: DoctorMatchDTO[];
    followUpQuestions?: string[];
    emergencyFlag: boolean;
}

export interface AIChatRequestDTO {
    message: string;
    conversationHistory?: ChatMessageDTO[];
    patientId: string;
}

export interface AIChatResponseDTO {
    message: string;
    recommendations?: DoctorRecommendationDTO;
    conversationId?: string;
    requiresAction: boolean;
}
