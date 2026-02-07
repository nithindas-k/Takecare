import { IUserDocument } from "../types/user.type";
import { BaseUserResponseDTO } from "../dtos/common.dto";
import { UserResponseDTO, UnifiedUserProfileResponseDTO } from "../dtos/user.dtos/user.dto";
import { IDoctorDocument } from "../types/doctor.type";

export class UserMapper {
    static toDTO(user: IUserDocument): BaseUserResponseDTO {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage,
            customId: user.customId,
        };
    }

    static toUserProfileDTO(user: IUserDocument): UserResponseDTO {
        const base = this.toDTO(user);
        return {
            ...base,
            gender: user.gender || null,
            dob: user.dob || null,
            customId: user.customId,
        };
    }

    static toUnifiedProfileDTO(user: IUserDocument, doctor?: IDoctorDocument | null): UnifiedUserProfileResponseDTO {
        const userProfile = this.toUserProfileDTO(user);

        if (doctor) {
            return {
                ...userProfile,
                doctorProfileId: doctor._id.toString(),
                specialty: doctor.specialty,
                qualifications: doctor.qualifications,
                experienceYears: doctor.experienceYears,
                VideoFees: doctor.VideoFees,
                ChatFees: doctor.ChatFees,
                languages: doctor.languages,
                licenseNumber: doctor.licenseNumber,
                about: doctor.about,
                verificationStatus: doctor.verificationStatus
            };
        }

        return userProfile;
    }


    static toPatientListItem(user: IUserDocument): {
        id: string;
        name: string;
        email: string;
        phone?: string;
        profileImage: string | null;
        gender?: string;
        dob?: Date;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    } {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone || undefined,
            profileImage: user.profileImage || null,
            gender: user.gender || undefined,
            dob: user.dob || undefined,
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date(),
            isActive: user.isActive,
        };
    }
}
