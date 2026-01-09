import mongoose, { Schema, Model } from "mongoose";
import { IPrescriptionDocument } from "../types/prescription.type";

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
    {
        appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
        doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        diagnosis: { type: String, required: true },
        medicines: [{
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            frequency: { type: String, required: true },
            duration: { type: String, required: true },
            instructions: { type: String }
        }],
        labTests: [{ type: String }],
        instructions: { type: String },
        followUpDate: { type: Date },
        prescriptionPdfUrl: { type: String },
        doctorSignature: { type: String },
        isDigitalSignatureVerified: { type: Boolean, default: true }
    },
    { timestamps: true }
);

const PrescriptionModel: Model<IPrescriptionDocument> = mongoose.models.Prescription || mongoose.model<IPrescriptionDocument>("Prescription", PrescriptionSchema);
export default PrescriptionModel;
