import Groq from "groq-sdk";
import { env } from "../configs/env";
import { IAIMatchingService } from "./interfaces/IAIMatching.service";
import { IAIConversationRepository } from "../repositories/interfaces/IAIConversation.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import {
    AIChatRequestDTO,
    AIChatResponseDTO,
    DoctorRecommendationDTO,
    ChatMessageDTO,
    DoctorMatchDTO,
} from "../dtos/ai.dtos/aiMatching.dto";
import { EMERGENCY_KEYWORDS } from "../types/aiMatching.type";
import { BadRequestError } from "../errors/AppError";

export class AIMatchingService implements IAIMatchingService {
    private groq: Groq;
    private readonly SYSTEM_PROMPT = `
You are MediMatch AI, an intelligent medical appointment assistant. Your job is to understand patient symptoms and find the most suitable doctors from our database.

## YOUR ROLE:
1. Listen to patient's health concerns
2. Identify the correct medical specialty needed
3. Match with best doctors from database based on specialty, experience, and ratings
4. Recommend top 3-5 doctors with clear reasoning

## CRITICAL RULES:

### Medical Safety:
- NEVER diagnose or prescribe treatment
- NEVER give medical advice - only match with doctors
- DO NOT use placeholders like "[Patient]", "[Your Name]" in any response.
- DO NOT use formal letter formatting (e.g. "Dear Patient").
- EMERGENCY KEYWORDS: chest pain, can't breathe, severe bleeding, stroke, unconscious, severe head injury, poisoning, severe allergic reaction
- If emergency detected: "⚠️ Call ambulance (102/108) immediately. Go to ER now. Don't wait for appointment."

### What You Need from Patient:
- Main health concern/symptoms
- How long they've had it
- Severity (if relevant)

### What You DON'T Ask:
- DO NOT ASK FOR LOCATION. This is a 100% online platform. All doctors are available virtually.
- Budget/fees
- Gender preference
- Language
- Timing

### Doctor Matching Priority:
1. Specialty match (most important)
2. Experience (years)
3. Patient ratings (ratingAvg)
4. Verification status (must be verified)

### Response Style:
- Warm and professional
- Simple language
- One clarifying question max
- Quick recommendations

## SPECIALTY MAPPING:
Heart/chest/BP → Cardiologist
Skin/acne/rash → Dermatologist
Bones/joints/back → Orthopedic
Mental health/anxiety → Psychiatrist
Stomach/digestion → Gastroenterologist
Women's health → Gynecologist
Children → Pediatrician
Fever/cold/general → General Physician
Diabetes/thyroid → Endocrinologist
Kidney/urinary → Nephrologist
Eyes → Ophthalmologist
ENT → ENT Specialist
Teeth → Dentist
Brain/nerves → Neurologist
Lungs/asthma → Pulmonologist
Cancer → Oncologist

## OUTPUT FORMAT (Always JSON):
{
  "intent": "gather_info" | "recommend_doctors" | "emergency",
  "patient_concern": "brief summary",
  "symptoms": ["symptom1", "symptom2"],
  "duration": "how long",
  "severity": "mild|moderate|severe",
  "specialty_required": "exact specialty name",
  "emergency_flag": true,
  "search_criteria": {
    "specialty": "specialty name",
    "min_experience": 0,
    "min_rating": 4.0
  },
  "message_to_patient": "your response",
  "next_question": "question if needed"
}
`;

    constructor(
        private aiConversationRepository: IAIConversationRepository,
        private doctorRepository: IDoctorRepository
    ) {
        this.groq = new Groq({
            apiKey: env.GROQ_API_KEY,
        });
    }

    async processPatientMessage(request: AIChatRequestDTO): Promise<AIChatResponseDTO> {
        // Step 1: Check for emergency using simple detection first
        const isEmergency = this.detectEmergency(request.message);
        if (isEmergency) {
            return {
                message: `⚠️ IMPORTANT: Based on what you're describing, this needs IMMEDIATE medical attention. Please do one of the following RIGHT NOW:

1. Call an ambulance: 102 or 108
2. Have someone drive you to the nearest emergency room
3. If alone, call emergency services immediately

This is NOT something to wait for a scheduled appointment. Please seek emergency care now. Your health and safety are the priority.`,
                requiresAction: true,
                recommendations: {
                    patientConcern: request.message,
                    recommendedSpecialty: "Emergency Medicine",
                    urgencyLevel: "emergency",
                    doctorMatches: [],
                    emergencyFlag: true,
                },
            };
        }

        // Get or create conversation
        const conversationId = await this.getOrCreateConversation(request.patientId);

        // Add user message to conversation
        await this.aiConversationRepository.addMessage(conversationId, "user", request.message);

        // Get conversation history
        const history = await this.aiConversationRepository.getConversationHistory(conversationId);
        const conversationHistory: ChatMessageDTO[] = history.map((msg) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
        }));

        // Step 2: AI Analysis / Extraction
        const aiAnalysis = await this.extractPatientInfo(request.message, conversationHistory);

        // Check for emergency in AI analysis too
        if (aiAnalysis.emergency_flag) {
            return {
                message: aiAnalysis.message_to_patient as string,
                requiresAction: true,
                recommendations: {
                    patientConcern: request.message,
                    recommendedSpecialty: "Emergency Medicine",
                    urgencyLevel: "emergency",
                    doctorMatches: [],
                    emergencyFlag: true,
                },
            };
        }

        // Update extracted info in conversation
        await this.aiConversationRepository.updateExtractedInfo(conversationId, aiAnalysis);

        let recommendations: DoctorRecommendationDTO | undefined;
        let finalMessage = aiAnalysis.message_to_patient as string;

        // Step 3: If AI is ready to recommend doctors
        if (aiAnalysis.intent === "recommend_doctors" && aiAnalysis.specialty_required) {
            // Map legacy 'Approved' status to the query
            const mongoQuery = {
                verificationStatus: "approved",
                isActive: true,
                specialty: { $regex: new RegExp(`^${aiAnalysis.specialty_required}$`, 'i') }
            };

            const doctors = await this.doctorRepository.searchDoctors(mongoQuery);

            if (doctors.length > 0) {
                // Step 4: Score and rank doctors using AI
                const rankedDoctors = await this.scoreDoctors(doctors, aiAnalysis);

                // Sort and take top 5
                const topMatches = rankedDoctors.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

                recommendations = {
                    patientConcern: (aiAnalysis.patient_concern as string) || request.message,
                    recommendedSpecialty: (aiAnalysis.specialty_required as string),
                    urgencyLevel: this.determineUrgencyLevel(aiAnalysis),
                    doctorMatches: topMatches,
                    emergencyFlag: false,
                    followUpQuestions: (aiAnalysis.followUpQuestions as string[]) || [],
                };

                // Track recommended doctors
                const doctorIds = topMatches.map((match) => match.doctorId);
                await this.aiConversationRepository.addRecommendedDoctors(conversationId, doctorIds);

                // Step 5: Generate final recommendation message
                finalMessage = await this.generateRecommendationMessage(topMatches, aiAnalysis);
            } else {
                // If no doctors found for the specific specialty, suggest available ones
                const availableSpecialties = await this.doctorRepository.getAvailableSpecialties();

                if (availableSpecialties.length > 0) {
                    finalMessage = `I understand you're looking for a ${aiAnalysis.specialty_required}. Currently, we don't have any verified doctors in that specific field available.

However, we do have excellent specialists in the following areas:
${availableSpecialties.map(s => `- ${s}`).join('\n')}

Would you like to consult any of these specialists, or perhaps describe your symptoms differently?`;
                } else {
                    finalMessage = `I understand you're looking for a ${aiAnalysis.specialty_required}. Currently, we don't have any verified doctors available on the platform matching that criteria. Please check back later as we are onboarding new doctors regularly.`;
                }
            }
        }

        
        await this.aiConversationRepository.addMessage(
            conversationId,
            "assistant",
            finalMessage,
            recommendations as any 
        );

        return {
            message: finalMessage,
            recommendations,
            conversationId,
            requiresAction: aiAnalysis.intent === "recommend_doctors",
        };
    }

    async getOrCreateConversation(patientId: string): Promise<string> {
        let conversation = await this.aiConversationRepository.findActiveByPatientId(patientId);
        if (!conversation) {
            conversation = await this.aiConversationRepository.create(patientId);
        }
        return conversation._id.toString();
    }

    async extractPatientInfo(
        message: string,
        conversationHistory: ChatMessageDTO[]
    ): Promise<Record<string, unknown>> {
        try {
            const messages: ChatMessageDTO[] = [
                { role: "system", content: this.SYSTEM_PROMPT },
                ...conversationHistory.slice(-10),
                { role: "user", content: message },
            ];

            const completion = await this.groq.chat.completions.create({
                messages: messages as Groq.Chat.ChatCompletionMessageParam[],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: "json_object" },
            });

            const responseContent = completion.choices[0]?.message?.content;
            if (!responseContent) throw new BadRequestError("No response from AI");

            return JSON.parse(responseContent);
        } catch (error: any) {
            console.error("CRITICAL: Error extracting patient info:", error.message || error);
            return {
                intent: "gather_info",
                patient_concern: message,
                emergency_flag: false,
                message_to_patient: "I'm sorry, I'm having trouble processing that right now. Could you tell me more about your symptoms?",
            };
        }
    }

    async scoreDoctors(
        doctors: any[],
        aiAnalysis: Record<string, unknown>
    ): Promise<DoctorMatchDTO[]> {
        try {
            const scoringPrompt = `
You are a medical specialist matcher. Score these doctors for a patient.

PATIENT CONCERN: ${aiAnalysis.patient_concern}
SYMPTOMS: ${Array.isArray(aiAnalysis.symptoms) ? aiAnalysis.symptoms.join(', ') : 'Not specified'}
REQUIRED SPECIALTY: ${aiAnalysis.specialty_required}

AVAILABLE DOCTORS:
${JSON.stringify(doctors.map(d => ({
                id: d._id,
                name: d.userId?.name,
                specialty: d.specialty,
                experience: d.experienceYears,
                rating: d.ratingAvg,
                reviewCount: d.ratingCount,
                qualifications: d.qualifications,
                about: d.about
            })), null, 2)}

SCORING CRITERIA (0-100):
1. Specialty Match (50 points)
2. Experience (25 points)
3. Rating (15 points)
4. Qualifications (10 points)

Return JSON format: { "ranked_doctors": [{ "doctor_id": "id", "match_score": 95, "match_reason": "reason" }] }
`;

            const response = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: scoringPrompt } as any],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                response_format: { type: "json_object" }
            });

            const scoringResult = JSON.parse(response.choices[0].message.content || '{"ranked_doctors":[]}');

            return scoringResult.ranked_doctors.map((score: any) => {
                const doctor = doctors.find(d => d._id.toString() === score.doctor_id);
                if (!doctor) return null;

                const user = doctor.userId as any; // Populated user object

                return {
                    doctorId: doctor._id.toString(),
                    name: user?.name,
                    specialty: doctor.specialty,
                    profileImage: user?.profileImage,
                    matchScore: score.match_score,
                    reasoning: score.match_reason,
                    pros: [
                        `${doctor.experienceYears} years experience`,
                        `Rated ${doctor.ratingAvg}/5`,
                    ],
                };
            }).filter(Boolean);

        } catch (error) {
            console.error('Scoring error:', error);
            // Fallback ranking
            return doctors.map(d => {
                const user = d.userId as any;
                return {
                    doctorId: d._id.toString(),
                    name: user?.name,
                    specialty: d.specialty,
                    profileImage: user?.profileImage,
                    matchScore: 80,
                    reasoning: `Matched based on specialty: ${d.specialty}`,
                };
            });
        }
    }

    async generateRecommendationMessage(
        topMatches: DoctorMatchDTO[],
        aiAnalysis: Record<string, unknown>
    ): Promise<string> {
        const prompt = `
Create a warm, professional recommendation message.

PATIENT CONCERN: ${aiAnalysis.patient_concern}
SPECIALTY NEEDED: ${aiAnalysis.specialty_required}

TOP DOCTORS SELECTED:
${JSON.stringify(topMatches.map(m => ({
            name: m.name,
            specialty: m.specialty,
            matchScore: m.matchScore,
            reason: m.reasoning
        })), null, 2)}


Create a summary message that:
1. Acknowledges the patient's concern naturally.
2. Mentions that you've found several suitable specialists.
3. Highlights why these doctors are a good fit (focus on expertise/experience, avoiding raw scores).
4. Encourages them to view the profiles in the sidebar.

CRITICAL RULES:
- DO NOT use placeholders like "[Patient]", "[Your Name]", or "[Date]".
- DO NOT use a formal letter format (e.g., no "Dear Patient").
- Start with a friendly greeting like "Hello," or "I'm here to help."
- SIGN OFF as "MediMatch AI".
- Keep it concise and friendly.
`;

        try {
            const response = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt } as any],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
            });

            return response.choices[0].message.content || 'I have found some excellent doctors for you.';
        } catch (error) {
            return `Based on your concern about ${aiAnalysis.patient_concern}, I have found some excellent ${aiAnalysis.specialty_required}s for you. You can see my top recommendations in the sidebar on the right.`;
        }
    }

    private determineUrgencyLevel(
        aiAnalysis: Record<string, unknown>
    ): "low" | "medium" | "high" | "emergency" {
        const severity = aiAnalysis.severity as string;
        if (severity === "severe") return "high";
        if (severity === "moderate") return "medium";
        return "low";
    }

    detectEmergency(message: string): boolean {
        const lowerMessage = message.toLowerCase();
        return EMERGENCY_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
    }

    async getConversationHistory(patientId: string): Promise<ChatMessageDTO[]> {
        const conversation = await this.aiConversationRepository.findActiveByPatientId(patientId);
        if (!conversation) return [];

        const history = await this.aiConversationRepository.getConversationHistory(
            conversation._id.toString()
        );

        return history.map((msg) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
            recommendations: msg.recommendations as unknown as DoctorRecommendationDTO, // Force cast the recommendations
        }));
    }

    async completeConversation(conversationId: string): Promise<void> {
        await this.aiConversationRepository.updateStatus(conversationId, "completed");
    }
}
