import { Request, Response, NextFunction } from "express";
import { IAIMatchingService } from "../services/interfaces/IAIMatching.service";
import { AIChatRequestDTO } from "../dtos/ai.dtos/aiMatching.dto";
import { AppError } from "../errors/AppError";

export class AIController {
    constructor(private aiMatchingService: IAIMatchingService) { }


    processChatMessage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError("User not authenticated", 401);
            }

            const { message } = req.body;
            if (!message) {
                throw new AppError("Message is required", 400);
            }

            const chatRequest: AIChatRequestDTO = {
                message,
                patientId,
            };

            const result = await this.aiMatchingService.processPatientMessage(chatRequest);

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };


    getConversationHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError("User not authenticated", 401);
            }

            const history = await this.aiMatchingService.getConversationHistory(patientId);

            return res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error) {
            next(error);
        }
    };


    resetConversation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const patientId = req.user?.userId;
            if (!patientId) {
                throw new AppError("User not authenticated", 401);
            }

            const conversationId = await this.aiMatchingService.getOrCreateConversation(patientId);
            await this.aiMatchingService.completeConversation(conversationId);

            return res.status(200).json({
                success: true,
                message: "Conversation reset successfully",
            });
        } catch (error) {
            next(error);
        }
    };
}
