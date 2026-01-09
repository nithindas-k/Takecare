import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';

export class ContactController {
    private _contactService: ContactService;

    constructor() {
        this._contactService = new ContactService();
    }

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
        } catch (error: any) {
            console.error('Error submitting contact form:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to submit contact form'
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
        } catch (error: any) {
            console.error('Error fetching stats:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch statistics'
            });
        }
    };
}
