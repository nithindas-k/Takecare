export interface DoctorResponseDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "doctor";
  profileImage?: string | null;
  gender?: "male" | "female" | "other" | null;
  dob?: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  licenseNumber?: string | null;
  qualifications: string[];
  specialty?: string | null;
  experienceYears?: number | null;
  VideoFees?: number | null;
  ChatFees?: number | null;
  languages?: string[];
  ratingAvg?: number;
  ratingCount?: number;
}



export interface SubmitVerificationDTO {
  degree: string;
  experience: string;
  speciality: string;
  videoFees: string;
  chatFees: string;
  certificateFile?: File | null;
}
