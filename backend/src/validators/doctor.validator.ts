import { ValidationError } from "../errors/AppError";
import type { DoctorRegistrationData } from "../types/doctor.type";
import type { SubmitVerificationDTO, UpdateDoctorProfileDTO } from "../dtos/doctor.dtos/doctor.dto";

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

    static validateVerificationData(data: SubmitVerificationDTO, files: Express.Multer.File[]): void {
        if (!data.degree || data.degree.trim().length < 2) {
            throw new ValidationError("Medical degree is required");
        }

        const validDegrees = ["MBBS", "MD", "MS", "BDS", "MDS", "BAMS", "BHMS", "BPT", "MPT"];
        const degreeUpper = data.degree.toUpperCase();
        const isValidDegree = validDegrees.some((valid) => degreeUpper.includes(valid));

        if (!isValidDegree) {
            throw new ValidationError("Please provide a valid medical degree (MBBS, MD, MS, BDS, etc.)");
        }

        if (data.experience < 0) {
            throw new ValidationError("Experience years cannot be negative");
        }

        if (data.experience > 60) {
            throw new ValidationError("Invalid experience years");
        }

        if (!data.speciality || data.speciality.trim().length < 2) {
            throw new ValidationError("Medical speciality is required");
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

        const isValidSpeciality = validSpecialities.some((valid) =>
            valid.toLowerCase().includes(data.speciality.toLowerCase())
        );

        if (!isValidSpeciality) {
            console.warn(`Warning: Uncommon speciality provided: ${data.speciality}`);
        }

        if (data.videoFees < 0) {
            throw new ValidationError("Video consultation fees cannot be negative");
        }

        if (data.chatFees < 0) {
            throw new ValidationError("Chat consultation fees cannot be negative");
        }

        if (data.videoFees < 100 || data.chatFees < 50) {
            throw new ValidationError("Consultation fees seem too low. Please verify.");
        }

        if (data.videoFees > 10000 || data.chatFees > 5000) {
            throw new ValidationError("Consultation fees seem too high. Please verify.");
        }

        if (data.licenseNumber && data.licenseNumber.length < 5) {
            throw new ValidationError("Invalid medical license number format");
        }
        if (!files || files.length === 0) {
            throw new ValidationError("Please upload at least one verification document (degree certificate, license, etc.)");
        }

        if (files.length > 10) {
            throw new ValidationError("Maximum 10 documents can be uploaded");
        }

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        const maxFileSize = 5 * 1024 * 1024; // 5MB

        for (const file of files) {
            if (!allowedTypes.includes(file.mimetype)) {
                throw new ValidationError(`Invalid file type: ${file.originalname}. Only JPEG, PNG, and PDF files are allowed`);
            }

            if (file.size > maxFileSize) {
                throw new ValidationError(`File too large: ${file.originalname}. Maximum size is 5MB`);
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

        if (data.biography !== undefined) {
            if (data.biography.length > 1000) {
                throw new ValidationError("Biography cannot exceed 1000 characters");
            }

            if (data.biography.length < 50) {
                throw new ValidationError("Biography must be at least 50 characters");
            }

            const inappropriateWords = ["fake", "fraud", "scam"];
            const bioLower = data.biography.toLowerCase();

            for (const word of inappropriateWords) {
                if (bioLower.includes(word)) {
                    throw new ValidationError("Biography contains inappropriate content");
                }
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
