import { ValidationError } from "../errors/AppError";
import type { DoctorRegistrationData } from "../types/doctor.type";
import type { SubmitVerificationDTO, UpdateDoctorProfileDTO } from "../dtos/doctor.dtos/doctor.dto";
import { MESSAGES, UPLOAD_DEFAULTS } from "../constants/constants";

export class DoctorValidator {
    static validateRegistrationData(data: DoctorRegistrationData): void {
        if (data.name && data.name.length < 3) {
            throw new ValidationError("Doctor name must be at least 3 characters");
        }

        if (data.email && data.email.includes("+")) {
            throw new ValidationError("Please use a professional email address");
        }

        if (data.dob) {
            const birthDate = new Date(data.dob);
            const age = this.calculateAge(birthDate);

            if (age < 24) {
                throw new ValidationError("Doctors must be at least 24 years old");
            }

            if (age > 80) {
                throw new ValidationError("Invalid date of birth");
            }
        }
    }

    static validateVerificationData(
        data: SubmitVerificationDTO,
        files: Express.Multer.File[],
        hasExistingDocuments: boolean = false
    ): void {
        if (!data.degree || data.degree.trim().length < 2) {
            throw new ValidationError("Medical degree is required");
        }

        const validDegrees = ["MBBS", "MD", "MS", "BDS", "MDS", "BAMS", "BHMS", "BPT", "MPT"];
        const degreeUpper = data.degree.toUpperCase();
        const isValidDegree = validDegrees.some((valid) => degreeUpper.includes(valid));

        if (!isValidDegree) {
            throw new ValidationError(MESSAGES.DOCTOR_INVALID_DEGREE);
        }

        if (data.experience < 0) {
            throw new ValidationError("Experience years cannot be negative");
        }

        if (data.experience > 60) {
            throw new ValidationError(MESSAGES.DOCTOR_INVALID_EXPERIENCE);
        }

        if (!data.speciality || data.speciality.trim().length < 2) {
            throw new ValidationError(MESSAGES.DOCTOR_INVALID_SPECIALITY);
        }

        const validSpecialities = [
            "General Physician",
            "Cardiologist",
            "Dermatologist",
            "Pediatrician",
            "Orthopedic",
            "Gynecologist",
            "Psychiatrist",
            "Neurologist",
            "ENT",
            "Ophthalmologist",
            "Dentist",
            "Physiotherapist",
            "Ayurvedic",
            "Homeopathy",
        ];

        validSpecialities.some((valid) =>
            valid.toLowerCase().includes(data.speciality.toLowerCase())
        );

        if (data.videoFees < 0) {
            throw new ValidationError("Video consultation fees cannot be negative");
        }

        if (data.chatFees < 0) {
            throw new ValidationError("Chat consultation fees cannot be negative");
        }

        if (data.videoFees < 100 || data.chatFees < 50) {
            throw new ValidationError(MESSAGES.DOCTOR_MIN_FEES);
        }

        if (data.videoFees > 10000 || data.chatFees > 5000) {
            throw new ValidationError(MESSAGES.DOCTOR_MAX_FEES);
        }

        if (data.licenseNumber && data.licenseNumber.length < 5) {
            throw new ValidationError(MESSAGES.DOCTOR_LICENSE_INVALID);
        }

        // Check if we have at least one document (new files OR existing documents)
        const hasDocuments = files.length > 0 || hasExistingDocuments;
        if (!hasDocuments) {
            throw new ValidationError(MESSAGES.DOCTOR_MISSING_DOCUMENTS);
        }

        // Only validate new files if any were uploaded
        if (files.length > 0) {
            if (files.length > 10) {
                throw new ValidationError(MESSAGES.DOCTOR_TOO_MANY_DOCUMENTS);
            }

            const allowedTypes = UPLOAD_DEFAULTS.ALLOWED_MIMETYPES as readonly string[];
            const maxFileSize = UPLOAD_DEFAULTS.MAX_FILE_SIZE_BYTES;

            for (const file of files) {
                if (!allowedTypes.includes(file.mimetype)) {
                    throw new ValidationError(MESSAGES.DOCTOR_INVALID_FILE_TYPE);
                }

                if (file.size > maxFileSize) {
                    throw new ValidationError(MESSAGES.DOCTOR_FILE_TOO_LARGE);
                }
            }
        }
    }

    static validateProfileUpdate(data: UpdateDoctorProfileDTO): void {
        if (data.experienceYears !== undefined) {
            if (data.experienceYears < 0) {
                throw new ValidationError("Experience years cannot be negative");
            }

            if (data.experienceYears > 60) {
                throw new ValidationError("Invalid experience years");
            }
        }

        if (data.dob) {
            const birthDate = new Date(data.dob);
            const age = DoctorValidator.calculateAge(birthDate);

            if (age < 24) {
                throw new ValidationError("Doctors must be at least 24 years old");
            }
            if (age > 80) {
                throw new ValidationError("Invalid date of birth");
            }
        }

        if (data.VideoFees !== undefined) {
            if (data.VideoFees < 0) {
                throw new ValidationError("Video consultation fees cannot be negative");
            }

            if (data.VideoFees < 100) {
                throw new ValidationError("Video consultation fees must be at least ₹100");
            }

            if (data.VideoFees > 10000) {
                throw new ValidationError("Video consultation fees cannot exceed ₹10,000");
            }
        }

        if (data.ChatFees !== undefined) {
            if (data.ChatFees < 0) {
                throw new ValidationError("Chat consultation fees cannot be negative");
            }

            if (data.ChatFees < 50) {
                throw new ValidationError("Chat consultation fees must be at least ₹50");
            }

            if (data.ChatFees > 5000) {
                throw new ValidationError("Chat consultation fees cannot exceed ₹5,000");
            }
        }

        if (data.name !== undefined) {
            if (data.name.trim().length < 2) {
                throw new ValidationError("Name must be at least 2 characters");
            }
            if (data.name.length > 100) {
                throw new ValidationError("Name cannot exceed 100 characters");
            }
        }

        if (data.phone !== undefined) {
            if (!/^\d{10}$/.test(data.phone)) {
                throw new ValidationError("Phone number must be 10 digits");
            }
        }

        if (data.specialty !== undefined && data.specialty.trim().length < 2) {
            throw new ValidationError("Specialty must be at least 2 characters");
        }

        if (data.qualifications !== undefined) {
            if (!Array.isArray(data.qualifications) || data.qualifications.length === 0) {
                throw new ValidationError("At least one qualification is required");
            }
        }

        if (data.languages !== undefined) {
            if (data.languages.length === 0) {
                throw new ValidationError("At least one language must be specified");
            }

            if (data.languages.length > 10) {
                throw new ValidationError("Maximum 10 languages can be specified");
            }

            const validLanguages = [
                "English",
                "Hindi",
                "Bengali",
                "Telugu",
                "Marathi",
                "Tamil",
                "Gujarati",
                "Kannada",
                "Malayalam",
                "Punjabi",
                "Urdu",
            ];

            for (const lang of data.languages) {
                if (!validLanguages.includes(lang)) {
                    throw new ValidationError(`Invalid language: ${lang}`);
                }
            }
        }
    }

    private static calculateAge(birthDate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }
}