import { Types, Document } from "mongoose";

/**
 * AI Conversation Types
 */

export interface IAIConversation {
    patientId: Types.ObjectId;
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
        timestamp: Date;
        recommendations?: Record<string, unknown>; // Using generic Record to avoid circular dependency with DTOs
    }[];
    extractedInfo?: {
        chiefComplaint?: string;
        symptoms?: string[];
        specialtyNeeded?: string;
        preferences?: Record<string, unknown>;
    };
    recommendedDoctors?: Types.ObjectId[];
    status: "active" | "completed" | "abandoned";
    lastActivity: Date;
}

export type IAIConversationDocument = IAIConversation & Document & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Emergency Keywords for Detection
 */
export const EMERGENCY_KEYWORDS = [
    "chest pain",
    "can't breathe",
    "cannot breathe",
    "difficulty breathing",
    "severe bleeding",
    "heavy bleeding",
    "stroke",
    "unconscious",
    "severe burns",
    "severe head injury",
    "head trauma",
    "poisoning",
    "severe allergic reaction",
    "anaphylaxis",
    "suicide",
    "suicidal thoughts",
    "heart attack",
    "seizure",
    "choking"
];

/**
 * Specialty Mapping for Symptoms
 */
export const SYMPTOM_SPECIALTY_MAP: Record<string, string> = {
    // Cardiology
    "chest pain": "Cardiologist",
    "heart": "Cardiologist",
    "palpitations": "Cardiologist",
    "irregular heartbeat": "Cardiologist",

    // Dermatology
    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "acne": "Dermatologist",
    "eczema": "Dermatologist",

    // Orthopedics
    "bone": "Orthopedic",
    "joint": "Orthopedic",
    "back pain": "Orthopedic",
    "fracture": "Orthopedic",
    "arthritis": "Orthopedic",

    // Psychiatry
    "anxiety": "Psychiatrist",
    "depression": "Psychiatrist",
    "mental health": "Psychiatrist",
    "stress": "Psychiatrist",

    // Gastroenterology
    "stomach": "Gastroenterologist",
    "digestive": "Gastroenterologist",
    "abdominal pain": "Gastroenterologist",
    "diarrhea": "Gastroenterologist",
    "constipation": "Gastroenterologist",

    // Gynecology
    "pregnancy": "Gynecologist",
    "menstrual": "Gynecologist",
    "pcos": "Gynecologist",

    // Pediatrics
    "child": "Pediatrician",
    "baby": "Pediatrician",
    "infant": "Pediatrician",

    // Endocrinology
    "diabetes": "Endocrinologist",
    "thyroid": "Endocrinologist",
    "hormone": "Endocrinologist",

    // Nephrology
    "kidney": "Nephrologist",
    "urinary": "Nephrologist",

    // General Physician
    "fever": "General Physician",
    "cold": "General Physician",
    "flu": "General Physician",
    "headache": "General Physician"
};
