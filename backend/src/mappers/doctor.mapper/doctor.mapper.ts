import { IUserDocument } from "../../types/user.type";
import { DoctorResponseDTO } from "../../dtos/doctor.dtos/doctor.dto";
import { IDoctorDocument } from "types/doctor.type";

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
