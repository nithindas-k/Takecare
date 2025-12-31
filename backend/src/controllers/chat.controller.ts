import { Request, Response, NextFunction } from "express";
import { IChatService } from "../services/interfaces/IChatService";
import { sendSuccess } from "../utils/response.util";
import { AppError } from "../errors/AppError";
import { HttpStatus, MESSAGES } from "../constants/constants";

export class ChatController {
    constructor(private _chatService: IChatService) { }

    getConversations = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const conversations = await this._chatService.getConversations(userId, userRole);

            sendSuccess(res, conversations);
        } catch (err: unknown) {
            next(err);
        }
    };

    getMessages = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const appointmentId = req.params.appointmentId;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const messages = await this._chatService.getMessages(appointmentId);

            sendSuccess(res, messages);
        } catch (err: unknown) {
            next(err);
        }
    };

    sendMessage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const appointmentId = req.params.appointmentId;
            const { content, type } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            if (!userId || !userRole) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const message = await this._chatService.sendMessage(
                appointmentId,
                userId,
                userRole,
                content,
                type || 'text'
            );

            sendSuccess(res, message);
        } catch (err: unknown) {
            next(err);
        }
    };

    editMessage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { messageId } = req.params;
            const { content } = req.body;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const updatedMessage = await this._chatService.editMessage(messageId, content, userId);
            sendSuccess(res, updatedMessage);
        } catch (err: unknown) {
            next(err);
        }
    };

    deleteMessage = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { messageId } = req.params;
            const userId = req.user?.userId;

            if (!userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
            }

            const deletedMessage = await this._chatService.deleteMessage(messageId, userId);
            sendSuccess(res, deletedMessage);
        } catch (err: unknown) {
            next(err);
        }
    };
}
