import type { IUserDocument } from "../../types/user.type";
import type { PatientListItem } from "../../types/common";

export function mapToPatientListItem(patient: IUserDocument): PatientListItem {
    return {
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone || undefined,
        profileImage: patient.profileImage || null,
        gender: patient.gender || undefined,
        dob: patient.dob || undefined,
        createdAt: patient.createdAt || new Date(),
        updatedAt: patient.updatedAt || new Date(),
        isActive: patient.isActive,
    };
}
