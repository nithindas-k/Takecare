
export class AppointmentMapper {
    static toResponseDTO(apt: any): any {
        let patient = null;
        if (apt.patient) {
            patient = apt.patient;
        } else if (apt.patientId) {
            patient = apt.patientId;
        }

        let doctor = null;
        if (apt.doctor) {
            doctor = apt.doctor;
        } else if (apt.doctorId) {
            doctor = apt.doctorId;
        }

        let patientData = null;
        if (patient) {
            patientData = { ...patient };
            if (patient.customId) {
                patientData.id = patient.customId;
            } else {
                patientData.id = patient._id;
            }
        }

        let doctorData = null;
        if (doctor) {
            doctorData = { ...doctor };
            if (doctor.customId) {
                doctorData.id = doctor.customId;
            } else {
                doctorData.id = doctor._id;
            }

            let doctorUser = null;
            if (doctor.userId) {
                doctorUser = doctor.userId;
            }

            if (doctorUser && typeof doctorUser === "object") {
                doctorData.userId = { ...doctorUser };
                if (doctorUser.customId) {
                    doctorData.userId.id = doctorUser.customId;
                } else {
                    doctorData.userId.id = doctorUser._id;
                }
            } else {
                doctorData.userId = doctorUser;
            }
        }

        const response = { ...apt };
        response.id = apt._id;
        if (apt.customId) {
            response.customId = apt.customId;
        }

        response.patient = patientData;
        response.doctor = doctorData;

        return response;
    }
}
