import { Request, Response } from 'express';
import { IContactService } from '../services/interfaces/IContactService';

import { ILoggerService } from '../services/interfaces/ILogger.service';

export class ContactController {
    constructor(
        private _contactService: IContactService,
        private logger: ILoggerService
    ) { }

    submitContactForm = async (req: Request, res: Response) => {
        try {
            const { name, email, phone, subject, message } = req.body;

            if (!name || !email || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, subject, and message are required'
                });
            }

            await this._contactService.createContactSubmission({
                name,
                email,
                phone,
                subject,
                message
            });

            return res.status(201).json({
                success: true,
                message: 'Thank you for contacting us! We will get back to you soon.'
            });
        } catch (error: unknown) {
            console.error('Error submitting contact form:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to submit contact form';
            return res.status(500).json({
                success: false,
                message
            });
        }
    };

    getStats = async (_req: Request, res: Response) => {
        try {
            const stats = await this._contactService.getStats();

            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error: unknown) {
            console.error('Error fetching stats:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch statistics';
            return res.status(500).json({
                success: false,
                message
            });
        }
    };

    getAllSubmissions = async (_req: Request, res: Response) => {
        try {
            const submissions = await this._contactService.getAllSubmissions();
            return res.status(200).json({
                success: true,
                data: submissions
            });
        } catch (error: unknown) {
            this.logger.error('Error fetching contact submissions:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to fetch messages';
            return res.status(500).json({
                success: false,
                message
            });
        }
    };

    replyToContact = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Reply message is required'
                });
            }

            await this._contactService.replyToContact(id, message);

            return res.status(200).json({
                success: true,
                message: 'Reply sent successfully'
            });
        } catch (error: unknown) {
            this.logger.error('Error replying to contact:', error);
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to send reply';
            return res.status(500).json({
                success: false,
                message
            });
        }
    };
}
