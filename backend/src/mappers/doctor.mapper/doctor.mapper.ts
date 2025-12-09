import { IUserDocument } from "../../types/user.type";
import { DoctorResponseDTO, VerificationStatus } from "../../dtos/doctor.dtos/doctor.dto";
import { IDoctorDocument } from "types/doctor.type";
import type { DoctorRequestItem, DoctorRequestDetail } from "../../types/doctor.type";
import type { DoctorRequestDTO, DoctorRequestDetailDTO } from "../../dtos/admin.dtos/admin.dto";
import type { DoctorListItem } from "../../types/common";

export default function mapDoctorToResponse(
  user: IUserDocument,
  doctor: IDoctorDocument
): DoctorResponseDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    profileImage: user.profileImage || null,
    gender: user.gender || null,
    dob: user.dob ? user.dob.toISOString().split("T")[0] : null,
    verificationStatus: doctor.verificationStatus,
    rejectionReason: doctor.rejectionReason || null,
    licenseNumber: doctor.licenseNumber || null,
    qualifications: doctor.qualifications,
    specialty: doctor.specialty || null,
    experienceYears: doctor.experienceYears || null,
    VideoFees: doctor.VideoFees || null,
    ChatFees: doctor.ChatFees || null,
    languages: doctor.languages,
    ratingAvg: doctor.ratingAvg,
    ratingCount: doctor.ratingCount,
  };
}

export function mapToDoctorRequestDTO(doc: DoctorRequestItem): DoctorRequestDTO | null {
  if (!doc.userId) {
    console.warn(`Doctor request ${doc._id} has no associated user!`);
    return null;
  }

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

export function mapToDoctorRequestDetailDTO(doc: DoctorRequestDetail): DoctorRequestDetailDTO {
  return {
    id: doc._id.toString(),
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

export function mapToDoctorListItem(doc: IDoctorDocument, userId: IUserDocument): DoctorListItem {
  return {
    id: doc._id.toString(),
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
