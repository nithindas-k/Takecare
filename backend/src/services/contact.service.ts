import { ILoggerService } from './interfaces/ILogger.service';
import { IContactRepository } from '../repositories/interfaces/IContact.repository';
import { IDoctorRepository } from '../repositories/interfaces/IDoctor.repository';
import { IUserRepository } from '../repositories/interfaces/IUser.repository';
import { IAppointmentRepository } from '../repositories/interfaces/IAppointmentRepository';
import { IContactService } from './interfaces/IContactService';

import { IEmailService } from './interfaces/IEmailService';

export class ContactService implements IContactService {
    constructor(
        private _contactRepository: IContactRepository,
        private _doctorRepository: IDoctorRepository,
        private _userRepository: IUserRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _logger: ILoggerService,
        private _emailService: IEmailService
    ) { }

    async createContactSubmission(data: any) {
        const contact = await this._contactRepository.create({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message,
            status: 'pending',
            createdAt: new Date()
        });

        this._emailService.sendContactNotification({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: data.subject,
            message: data.message
        }).catch(err => this._logger.error("Failed to send contact email notification", err));

        return contact;
    }

    async getStats() {
        try {
            const totalDoctors = await this._doctorRepository.countDocuments({
                verificationStatus: 'approved',
                isActive: true
            });

            const totalPatients = await this._userRepository.countDocuments({ role: 'patient' });

            const totalAppointments = await this._appointmentRepository.countDocuments({
                status: 'completed'
            });

            const doctors = await this._doctorRepository.find({
                verificationStatus: 'approved',
                isActive: true
            });

            const avgExperience = doctors.length > 0
                ? Math.round(doctors.reduce((sum: number, doc: any) => sum + (doc.experienceYears || 0), 0) / doctors.length)
                : 0;

            return {
                totalDoctors,
                totalPatients,
                totalAppointments,
                avgExperience
            };
        } catch (error) {
            this._logger.error('Error fetching stats:', error);
            throw error;
        }
    }

    async getAllSubmissions() {
        try {
            return await this._contactRepository.findAll();
        } catch (error) {
            this._logger.error('Error fetching all submissions:', error);
            throw error;
        }
    }

    async replyToContact(contactId: string, replyMessage: string) {
        try {
            const contact = await this._contactRepository.findById(contactId);
            if (!contact) {
                throw new Error('Contact message not found');
            }


            await this._emailService.sendContactReplyEmail(
                contact.email,
                contact.name,
                contact.subject,
                replyMessage
            );


            return await this._contactRepository.updateById(contactId, { status: 'responded' as any });
        } catch (error) {
            this._logger.error('Error replying to contact:', error);
            throw error;
        }
    }
}
