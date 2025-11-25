import type { IDoctorService, UpdateDoctorProfileDTO, VerificationResponseDTO } from "./interfaces/IDoctorService";
import { SubmitVerificationDTO, VerificationStatus } from "../dtos/doctor.dtos/doctor.dto";
import { IDoctorRepository } from "../repositories/interfaces/IDoctor.repository";
import { IUserRepository } from "../repositories/interfaces/IUser.repository";

export class DoctorService implements IDoctorService {
  constructor(private _doctorRepository: IDoctorRepository, private _userRepository: IUserRepository) { }

  // ==================== DOCTOR VERIFICATION (with validation) ====================
  async submitVerification(
    userId: string,
    data: SubmitVerificationDTO,
    files: Express.Multer.File[]
  ): Promise<VerificationResponseDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.role !== "doctor") {
      throw new Error("Only doctors can submit verification");
    }
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new Error("Doctor profile not found");
    }
    this.validateVerificationData(data, files);
    const documentUrls: string[] = files.map((file) => file.path);
    await this._doctorRepository.updateById(doctor._id, {
      licenseNumber: data.licenseNumber || null,
      qualifications: [data.degree],
      experienceYears: data.experience,
      specialty: data.speciality,
      VideoFees: data.videoFees,
      ChatFees: data.chatFees,
      languages: data.languages || [],
      verificationDocuments: documentUrls,
      verificationStatus: VerificationStatus.Pending,
    });
    return {
      message: "Verification submitted successfully. Awaiting admin approval.",
      verificationStatus: "pending",
      verificationDocuments: documentUrls,
    };
  }

  // ==================== VALIDATION METHODS ====================
  validateDoctorRegistrationData(data: any): void {
    if (data.name && data.name.length < 3) {
      throw new Error("Doctor name must be at least 3 characters");
    }
    if (data.email && data.email.includes("+")) {
      throw new Error("Please use a professional email address");
    }
    if (data.dob) {
      const birthDate = new Date(data.dob);
      const age = this.calculateAge(birthDate);
      if (age < 24) {
        throw new Error("Doctors must be at least 24 years old");
      }
      if (age > 80) {
        throw new Error("Invalid date of birth");
      }
    }
  }

  validateVerificationData(data: SubmitVerificationDTO, files: Express.Multer.File[]): void {
    if (!data.degree || data.degree.trim().length < 2) {
      throw new Error("Medical degree is required");
    }
    const validDegrees = ["MBBS", "MD", "MS", "BDS", "MDS", "BAMS", "BHMS", "BPT", "MPT"];
    const degreeUpper = data.degree.toUpperCase();
    const isValidDegree = validDegrees.some((valid) => degreeUpper.includes(valid));
    if (!isValidDegree) {
      throw new Error("Please provide a valid medical degree (MBBS, MD, MS, BDS, etc.)");
    }
    if (data.experience < 0) {
      throw new Error("Experience years cannot be negative");
    }
    if (data.experience > 60) {
      throw new Error("Invalid experience years");
    }
    if (!data.speciality || data.speciality.trim().length < 2) {
      throw new Error("Medical speciality is required");
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
      throw new Error("Video consultation fees cannot be negative");
    }
    if (data.chatFees < 0) {
      throw new Error("Chat consultation fees cannot be negative");
    }
    if (data.videoFees < 100 || data.chatFees < 50) {
      throw new Error("Consultation fees seem too low. Please verify.");
    }
    if (data.videoFees > 10000 || data.chatFees > 5000) {
      throw new Error("Consultation fees seem too high. Please verify.");
    }
    if (data.licenseNumber && data.licenseNumber.length < 5) {
      throw new Error("Invalid medical license number format");
    }
    if (!files || files.length === 0) {
      throw new Error("Please upload at least one verification document (degree certificate, license, etc.)");
    }
    if (files.length > 10) {
      throw new Error("Maximum 10 documents can be uploaded");
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.originalname}. Only JPEG, PNG, and PDF files are allowed`);
      }
      if (file.size > maxFileSize) {
        throw new Error(`File too large: ${file.originalname}. Maximum size is 5MB`);
      }
    }
  }

  validateDoctorProfileUpdate(data: UpdateDoctorProfileDTO): void {
    if (data.experienceYears !== undefined) {
      if (data.experienceYears < 0) {
        throw new Error("Experience years cannot be negative");
      }
      if (data.experienceYears > 60) {
        throw new Error("Invalid experience years");
      }
    }
    if (data.VideoFees !== undefined) {
      if (data.VideoFees < 0) {
        throw new Error("Video consultation fees cannot be negative");
      }
      if (data.VideoFees < 100) {
        throw new Error("Video consultation fees must be at least ₹100");
      }
      if (data.VideoFees > 10000) {
        throw new Error("Video consultation fees cannot exceed ₹10,000");
      }
    }
    if (data.ChatFees !== undefined) {
      if (data.ChatFees < 0) {
        throw new Error("Chat consultation fees cannot be negative");
      }
      if (data.ChatFees < 50) {
        throw new Error("Chat consultation fees must be at least ₹50");
      }
      if (data.ChatFees > 5000) {
        throw new Error("Chat consultation fees cannot exceed ₹5,000");
      }
    }
    if (data.biography !== undefined) {
      if (data.biography.length > 1000) {
        throw new Error("Biography cannot exceed 1000 characters");
      }
      if (data.biography.length < 50) {
        throw new Error("Biography must be at least 50 characters");
      }
      const inappropriateWords = ["fake", "fraud", "scam"];
      const bioLower = data.biography.toLowerCase();
      for (const word of inappropriateWords) {
        if (bioLower.includes(word)) {
          throw new Error("Biography contains inappropriate content");
        }
      }
    }
    if (data.languages !== undefined) {
      if (data.languages.length === 0) {
        throw new Error("At least one language must be specified");
      }
      if (data.languages.length > 10) {
        throw new Error("Maximum 10 languages can be specified");
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
          throw new Error(`Invalid language: ${lang}`);
        }
      }
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
