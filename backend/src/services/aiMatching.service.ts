import Groq from "groq-sdk";
import { env } from "../configs/env";
import { IAIMatchingService } from "./interfaces/IAIMatching.service";
import { IAIConversationRepository } from "../repositories/interfaces/IAIConversation.repository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IScheduleRepository } from "../repositories/interfaces/ISchedule.repository";
import type { IDoctorDocument } from "../types/doctor.type";
import {
    AIChatRequestDTO,
    AIChatResponseDTO,
    DoctorRecommendationDTO,
    ChatMessageDTO,
    DoctorMatchDTO,
    AvailableSlotDTO,
} from "../dtos/ai.dtos/aiMatching.dto";
import { EMERGENCY_KEYWORDS } from "../types/aiMatching.type";
import { BadRequestError } from "../errors/AppError";


const SPECIALTY_ALIASES: Record<string, string[]> = {
    "general physician": ["General Physician", "General Medicine", "General Practice", "Family Medicine", "GP", "General Practitioner"],
    "cardiologist": ["Cardiologist", "Cardiology"],
    "dermatologist": ["Dermatologist", "Dermatology"],
    "orthopedic": ["Orthopedic", "Orthopaedic", "Orthopaedics", "Orthopedics", "Orthopedic Surgeon"],
    "psychiatrist": ["Psychiatrist", "Psychiatry", "Mental Health"],
    "gastroenterologist": ["Gastroenterologist", "Gastroenterology"],
    "gynecologist": ["Gynecologist", "Gynaecologist", "Gynecology", "Gynaecology", "OB-GYN"],
    "pediatrician": ["Pediatrician", "Paediatrician", "Pediatrics", "Paediatrics"],
    "endocrinologist": ["Endocrinologist", "Endocrinology"],
    "nephrologist": ["Nephrologist", "Nephrology"],
    "ophthalmologist": ["Ophthalmologist", "Ophthalmology", "Eye Specialist"],
    "ent specialist": ["ENT Specialist", "ENT", "Otolaryngologist", "Ear Nose Throat"],
    "dentist": ["Dentist", "Dental Surgeon", "Dentistry"],
    "neurologist": ["Neurologist", "Neurology"],
    "pulmonologist": ["Pulmonologist", "Pulmonology", "Chest Physician", "Respiratory Medicine"],
    "oncologist": ["Oncologist", "Oncology"],
};

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
        private doctorRepository: IDoctorRepository,
        private scheduleRepository: IScheduleRepository
    ) {
        this.groq = new Groq({
            apiKey: env.GROQ_API_KEY,
        });
    }

    /**
     * Returns true if the doctor has at least one enabled day with at least
     * one enabled, unbooked slot — meaning they can still accept appointments.
     */
    private async _hasAvailableSlots(doctorId: string): Promise<boolean> {
        try {
            const schedule = await this.scheduleRepository.findByDoctorId(doctorId);
            if (!schedule || !schedule.isActive) return false;

            return schedule.weeklySchedule.some(
                (day) =>
                    day.enabled &&
                    day.slots.some((slot) => slot.enabled && !slot.booked)
            );
        } catch {
            // If we can't check, allow the doctor through rather than silently dropping them
            return true;
        }
    }

    /**
     * Returns up to `limit` available (enabled + unbooked) slots for a doctor,
     * grouped by day of the week.
     */
    private async _getAvailableSlots(doctorId: string, limit = 6): Promise<AvailableSlotDTO[]> {
        try {
            const schedule = await this.scheduleRepository.findByDoctorId(doctorId);
            if (!schedule || !schedule.isActive) return [];

            const slots: AvailableSlotDTO[] = [];
            for (const day of schedule.weeklySchedule) {
                if (!day.enabled) continue;
                for (const slot of day.slots) {
                    if (!slot.enabled || slot.booked) continue;
                    slots.push({ day: day.day, startTime: slot.startTime, endTime: slot.endTime });
                    if (slots.length >= limit) break;
                }
                if (slots.length >= limit) break;
            }
            return slots;
        } catch {
            return [];
        }
    }

    async processPatientMessage(request: AIChatRequestDTO): Promise<AIChatResponseDTO> {
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
            const specialtyRaw = aiAnalysis.specialty_required as string;

            // Build a flexible OR-regex from known aliases so "General Physician"
            // matches "General Medicine", "GP", "Family Medicine", etc.
            const aliasKey = specialtyRaw.toLowerCase().trim();
            const aliasVariants = SPECIALTY_ALIASES[aliasKey] ?? [specialtyRaw];
            const specialtyRegex = new RegExp(
                aliasVariants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
                'i'
            );

            const mongoQuery = {
                verificationStatus: "approved",
                isActive: true,
                specialty: { $regex: specialtyRegex },
            };

            const doctors = await this.doctorRepository.searchDoctors(mongoQuery);

            // Filter doctors who actually have at least one available (unbooked) slot
            const availabilityChecks = await Promise.all(
                doctors.map(async (d) => ({
                    doctor: d,
                    hasSlots: await this._hasAvailableSlots(d._id.toString()),
                }))
            );
            const availableDoctors = availabilityChecks
                .filter((r) => r.hasSlots)
                .map((r) => r.doctor);

            if (availableDoctors.length > 0) {
                // Step 4: Score and rank doctors using AI
                const rankedDoctors = await this.scoreDoctors(availableDoctors, aiAnalysis);

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
                // No doctors with available slots found — suggest other specialties
                const availableSpecialties = await this.doctorRepository.getAvailableSpecialties();

                if (doctors.length > 0 && availableDoctors.length === 0) {
                    // Doctors exist for the specialty but all are fully booked
                    finalMessage = `I found some ${aiAnalysis.specialty_required}s on our platform, but unfortunately all of them are fully booked at the moment. Please try again later or check back soon as new slots open up regularly.`;
                } else if (availableSpecialties.length > 0) {
                    finalMessage = `I understand you're looking for a ${aiAnalysis.specialty_required}. Currently, we don't have any verified doctors with available slots in that specific field.\n\nHowever, we do have specialists with open appointments in the following areas:\n${availableSpecialties.map(s => `- ${s}`).join('\n')}\n\nWould you like to consult any of these specialists, or perhaps describe your symptoms differently?`;
                } else {
                    finalMessage = `I understand you're looking for a ${aiAnalysis.specialty_required}. Currently, we don't have any verified doctors with available slots matching that criteria. Please check back later as we are onboarding new doctors regularly.`;
                }
            }
        }


        await this.aiConversationRepository.addMessage(
            conversationId,
            "assistant",
            finalMessage,
            recommendations as unknown as Record<string, unknown>
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
        } catch (error: unknown) {
            const messageText = error instanceof Error ? error.message : String(error);
            process.stderr.write(`CRITICAL: Error extracting patient info: ${messageText}\n`);
            return {
                intent: "gather_info",
                patient_concern: message,
                emergency_flag: false,
                message_to_patient: "I'm sorry, I'm having trouble processing that right now. Could you tell me more about your symptoms?",
            };
        }
    }

    async scoreDoctors(
        doctors: IDoctorDocument[],
        aiAnalysis: Record<string, unknown>
    ): Promise<DoctorMatchDTO[]> {
        try {
            const scoringPrompt = `
You are a medical specialist matcher. Score these doctors for a patient.

PATIENT CONCERN: ${aiAnalysis.patient_concern}
SYMPTOMS: ${Array.isArray(aiAnalysis.symptoms) ? aiAnalysis.symptoms.join(', ') : 'Not specified'}
REQUIRED SPECIALTY: ${aiAnalysis.specialty_required}

AVAILABLE DOCTORS:
${JSON.stringify(
                doctors.map(d => {
                    const user = (d.userId as unknown as { name?: string }) || {};
                    return {
                        id: d._id.toString(),
                        name: user.name ?? "Doctor",
                        specialty: d.specialty,
                        experience: d.experienceYears,
                        rating: d.ratingAvg,
                        reviewCount: d.ratingCount,
                        qualifications: d.qualifications,
                        about: d.about
                    };
                }),
                null,
                2
            )}

SCORING CRITERIA (0-100):
1. Specialty Match (50 points)
2. Experience (25 points)
3. Rating (15 points)
4. Qualifications (10 points)

Return JSON format: { "ranked_doctors": [{ "doctor_id": "id", "match_score": 95, "match_reason": "reason" }] }
`;

            const response = await this.groq.chat.completions.create({
                messages: [{ role: "user", content: scoringPrompt }] as Groq.Chat.ChatCompletionMessageParam[],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                response_format: { type: "json_object" }
            });

            const scoringResult = JSON.parse(response.choices[0].message.content || '{"ranked_doctors":[]}') as {
                ranked_doctors: Array<{ doctor_id: string; match_score: number; match_reason: string }>;
            };

            const mapped = scoringResult.ranked_doctors
                .map((score): DoctorMatchDTO | null => {
                    const doctor = doctors.find(d => d._id.toString() === score.doctor_id);
                    if (!doctor) return null;

                    const user = (doctor.userId as unknown as { name?: string; profileImage?: string | null }) || {};

                    return {
                        doctorId: doctor._id.toString(),
                        name: user.name ?? "Doctor",
                        specialty: (doctor.specialty as string | undefined) ?? "General Physician",
                        profileImage: user.profileImage ?? undefined,
                        matchScore: score.match_score,
                        reasoning: score.match_reason ?? "Recommended based on specialty and experience.",
                        pros: [
                            `${doctor.experienceYears ?? 0} years experience`,
                            `Rated ${doctor.ratingAvg ?? 0}/5`,
                        ],
                    };
                })
                .filter((m): m is DoctorMatchDTO => m !== null);

            // Enrich each match with live available slots
            const enriched = await Promise.all(
                mapped.map(async (m) => ({
                    ...m,
                    availableSlots: await this._getAvailableSlots(m.doctorId),
                }))
            );

            return enriched;

        } catch {
            // Fallback ranking with slots
            const fallback = doctors.map((d): DoctorMatchDTO => {
                const user = (d.userId as unknown as { name?: string; profileImage?: string | null }) || {};
                return {
                    doctorId: d._id.toString(),
                    name: user.name ?? "Doctor",
                    specialty: (d.specialty as string | undefined) ?? "General Physician",
                    profileImage: user.profileImage ?? undefined,
                    matchScore: 80,
                    reasoning: `Matched based on specialty: ${String(d.specialty ?? "")}`,
                };
            });

            const enrichedFallback = await Promise.all(
                fallback.map(async (m) => ({
                    ...m,
                    availableSlots: await this._getAvailableSlots(m.doctorId),
                }))
            );
            return enrichedFallback;
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
                messages: [{ role: "user", content: prompt } as Groq.Chat.ChatCompletionMessageParam],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
            });

            return response.choices[0].message.content || 'I have found some excellent doctors for you.';
        } catch {
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
