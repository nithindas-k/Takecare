import { IDoctorDocument, DoctorRequestItem, DoctorRequestDetail } from "../types/doctor.type";
import { IUserDocument } from "../types/user.type";
import { VerificationStatus, VerificationFormDataDTO } from "../dtos/doctor.dtos/doctor.dto";
import { DOCTOR_PUBLIC_DEFAULTS } from "../constants/constants";
import { DoctorRequestDTO, DoctorRequestDetailDTO } from "../dtos/admin.dtos/admin.dto";
import { DoctorListItem } from "../types/common";

export class DoctorMapper {
    static toProfileDTO(doctor: IDoctorDocument, user: IUserDocument) {
        return {
            id: doctor._id.toString(),
            userId: doctor.userId.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            licenseNumber: doctor.licenseNumber,
            qualifications: doctor.qualifications,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
            VideoFees: doctor.VideoFees,
            ChatFees: doctor.ChatFees,
            languages: doctor.languages,
            verificationStatus: doctor.verificationStatus,
            verificationDocuments: doctor.verificationDocuments,
            rejectionReason: doctor.rejectionReason,
            ratingAvg: doctor.ratingAvg,
            ratingCount: doctor.ratingCount,
            isActive: doctor.isActive,
            profileImage: user.profileImage,
            gender: user.gender,
            dob: user.dob,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt,
            about: doctor.about,
            signature: doctor.signature,
        };
    }

    static toPublicDTO(doctor: IDoctorDocument, user: IUserDocument) {
        const profileImage = user.profileImage ?? DOCTOR_PUBLIC_DEFAULTS.PROFILE_IMAGE;
        const rating = doctor.ratingAvg || DOCTOR_PUBLIC_DEFAULTS.RATING;
        const reviews = doctor.ratingCount || 0;
        const about = doctor.about || DOCTOR_PUBLIC_DEFAULTS.ABOUT;
        const gender = user.gender || DOCTOR_PUBLIC_DEFAULTS.GENDER;

        return {
            id: doctor._id.toString(),
            name: user.name,
            email: user.email,
            image: profileImage,
            speciality: doctor.specialty,
            specialty: doctor.specialty,
            experience: doctor.experienceYears,
            experienceYears: doctor.experienceYears,
            fees: doctor.VideoFees,
            videoFees: doctor.VideoFees,
            VideoFees: doctor.VideoFees,
            chatFees: doctor.ChatFees,
            ChatFees: doctor.ChatFees,
            location: DOCTOR_PUBLIC_DEFAULTS.LOCATION,
            rating: rating,
            ratingAvg: rating,
            reviews: reviews,
            ratingCount: reviews,
            available: doctor.isActive,
            isActive: doctor.isActive,
            qualifications: doctor.qualifications || [],
            languages: doctor.languages || [],
            about: about,
            gender: gender,
            phone: user.phone,
        };
    }

    static toListDTO(doctor: IDoctorDocument, user: IUserDocument) {
        return {
            id: doctor._id.toString(),
            name: user?.name || DOCTOR_PUBLIC_DEFAULTS.NAME,
            image: user?.profileImage || DOCTOR_PUBLIC_DEFAULTS.PROFILE_IMAGE,
            speciality: doctor.specialty || DOCTOR_PUBLIC_DEFAULTS.SPECIALTY,
            experience: doctor.experienceYears || 0,
            gender: user?.gender || DOCTOR_PUBLIC_DEFAULTS.GENDER,
            fees: doctor.VideoFees || 0,
            location: DOCTOR_PUBLIC_DEFAULTS.LOCATION,
            rating: doctor.ratingAvg || DOCTOR_PUBLIC_DEFAULTS.RATING,
            reviews: doctor.ratingCount || 0,
            available: doctor.isActive,
            customId: user?.customId || doctor._id.toString()
        };
    }

    static toVerificationFormData(doctor: IDoctorDocument): VerificationFormDataDTO {
        return {
            degree: doctor.qualifications?.[0] || "",
            experience: doctor.experienceYears || 0,
            speciality: doctor.specialty || "",
            videoFees: doctor.VideoFees || 0,
            chatFees: doctor.ChatFees || 0,
            licenseNumber: doctor.licenseNumber,
            languages: doctor.languages || [],
            verificationStatus: doctor.verificationStatus,
            rejectionReason: doctor.rejectionReason,
            verificationDocuments: doctor.verificationDocuments || [],
            canResubmit: doctor.verificationStatus === VerificationStatus.Rejected,
        };
    }

    static toDoctorRequestDTO(doc: DoctorRequestItem): DoctorRequestDTO | null {
        if (!doc.userId) return null;

        return {
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            department: doc.specialty || "",
            profileImage: doc.profileImage ?? null,
            createdAt: doc.createdAt,
            experienceYears: doc.experienceYears ?? undefined,
            status: doc.verificationStatus,
            rejectionReason: doc.rejectionReason ?? null,
        };
    }

    static toDoctorRequestDetailDTO(doc: DoctorRequestDetail): DoctorRequestDetailDTO {
        return {
            id: doc._id.toString(),
            customId: doc.customId || undefined,
            name: doc.name,
            email: doc.email,
            phone: doc.phone || "",
            department: doc.specialty || "",
            profileImage: doc.profileImage || null,
            gender: doc.gender || null,
            dob: doc.dob ? doc.dob.toISOString() : null,
            qualifications: doc.qualifications || [],
            experienceYears: doc.experienceYears ?? undefined,
            specialties: doc.specialty ? [doc.specialty] : [],
            biography: "",
            address: undefined,
            VideoFees: doc.VideoFees,
            ChatFees: doc.ChatFees,
            documents: doc.verificationDocuments || [],
            status: doc.verificationStatus,
            rejectionReason: doc.rejectionReason ?? undefined,
            isActive: doc.isActive,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    static toDoctorListItem(doc: IDoctorDocument, userId: IUserDocument): DoctorListItem {
        return {
            id: doc._id.toString(),
            customId: userId.customId || undefined,
            name: userId.name,
            email: userId.email,
            phone: userId.phone,
            specialty: doc.specialty || null,
            experienceYears: doc.experienceYears || null,
            VideoFees: doc.VideoFees || null,
            ChatFees: doc.ChatFees || null,
            profileImage: userId.profileImage || null,
            verificationStatus: doc.verificationStatus,
            isActive: doc.isActive,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
}
