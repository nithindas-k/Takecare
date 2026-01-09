import { IPrescriptionService } from "./interfaces/IPrescriptionService";
import { IPrescriptionRepository } from "../repositories/interfaces/IPrescription.repository";
import { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { PrescriptionMapper } from "../mappers/prescription.mapper";
import { AppError } from "../errors/AppError";
import { HttpStatus, MESSAGES, ROLES, APPOINTMENT_STATUS } from "../constants/constants";

export class PrescriptionService implements IPrescriptionService {
    constructor(
        private _prescriptionRepository: IPrescriptionRepository,
        private _appointmentRepository: IAppointmentRepository,
        private _doctorRepository: IDoctorRepository
    ) { }

    async createPrescription(userId: string, data: any): Promise<any> {
        // 1. Validate Doctor
        const doctor = await this._doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new AppError(MESSAGES.DOCTOR_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // 2. Validate Appointment
        const appointment = await this._appointmentRepository.findById(data.appointmentId);
        if (!appointment) {
            throw new AppError(MESSAGES.APPOINTMENT_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // 3. Security Check: Is this doctor the one assigned?
        if (appointment.doctorId.toString() !== doctor._id.toString()) {
            throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
        }

        // 4. Status Check: Is appointment completed?
        if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
            throw new AppError("Prescription can only be added to completed appointments", HttpStatus.BAD_REQUEST);
        }

        // 5. Check if prescription already exists
        const existing = await this._prescriptionRepository.findByAppointmentId(data.appointmentId);
        if (existing) {
            throw new AppError("Prescription already exists for this appointment", HttpStatus.BAD_REQUEST);
        }

        // 6. Create Prescription with provided doctor's signature
        const prescriptionData = {
            appointmentId: appointment._id,
            doctorId: doctor._id,
            patientId: appointment.patientId,
            diagnosis: data.diagnosis,
            medicines: data.medicines,
            labTests: data.labTests,
            instructions: data.instructions,
            followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
            prescriptionPdfUrl: data.prescriptionPdfUrl,
            doctorSignature: data.doctorSignature  // Use signature provided in the request
        };

        const created = await this._prescriptionRepository.create(prescriptionData);

        // 7. Update Appointment with PDF link if provided
        if (data.prescriptionPdfUrl) {
            await this._appointmentRepository.updateById(appointment._id.toString(), {
                prescriptionUrl: data.prescriptionPdfUrl
            });
        }

        return PrescriptionMapper.toResponseDTO(await this._prescriptionRepository.findByAppointmentId(appointment._id.toString()));
    }

    async getPrescriptionByAppointment(userId: string, role: string, appointmentId: string): Promise<any> {
        const prescription = await this._prescriptionRepository.findByAppointmentId(appointmentId);
        if (!prescription) {
            throw new AppError("Prescription not found", HttpStatus.NOT_FOUND);
        }

        // Security Access Control
        if (role === ROLES.PATIENT) {
            // patientId in prescription is the User ID
            if (prescription.patientId._id.toString() !== userId && prescription.patientId.toString() !== userId) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }
        } else if (role === ROLES.DOCTOR) {
            const doctor = await this._doctorRepository.findByUserId(userId);
            if (!doctor || (prescription.doctorId._id.toString() !== doctor._id.toString() && prescription.doctorId.toString() !== doctor._id.toString())) {
                throw new AppError(MESSAGES.UNAUTHORIZED_ACCESS, HttpStatus.FORBIDDEN);
            }
        }

        return PrescriptionMapper.toResponseDTO(prescription);
    }
}
