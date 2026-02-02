import { Request, Response, NextFunction } from "express";
import aiService from "../services/ai.service";
import { HttpStatus } from "../constants/constants";

export class AiController {
    async analyzeSymptoms(req: Request, res: Response, next: NextFunction) {
        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Message is required",
                });
            }

            const result = await aiService.analyzeSymptoms(message, history || []);

            res.status(HttpStatus.OK).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error("Analyze Symptoms Error:", error.message);
            next(error);
        }
    }


    async summarizeChat(req: Request, res: Response, next: NextFunction) {
        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages)) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Messages array is required",
                });
            }

            const summary = await aiService.summarizeChat(messages);

            res.status(HttpStatus.OK).json({
                success: true,
                data: summary,
                message: "Consultation summarized successfully",
            });
        } catch (error: any) {
            console.error("Summarize Chat Controller Error:", error);
            res.status(HttpStatus.INTERNAL_ERROR).json({
                success: false,
                message: error.message || "Failed to summarize chat.",
            });
        }
    }

    async analyzeAdminQuery(req: Request, res: Response, next: NextFunction) {
        try {
            const { query, context } = req.body;

            if (!query) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Query is required",
                });
            }

            const result = await aiService.analyzeAdminQuery(query, context);

            res.status(HttpStatus.OK).json({
                success: true,
                data: result,
                message: "Query analyzed successfully",
            });
        } catch (error: any) {
            console.error("Analyze Admin Query Error:", error);
            res.status(HttpStatus.INTERNAL_ERROR).json({
                success: false,
                message: error.message || "Failed to analyze query.",
            });
        }
    }
}

export const aiController = new AiController();
