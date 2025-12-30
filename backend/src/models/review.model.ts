import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
    appointmentId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            unique: true, // One review per appointment
        },
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
        },
    },
    {
        timestamps: true,
    }
);

// Indexing for faster queries
ReviewSchema.index({ doctorId: 1, createdAt: -1 });
ReviewSchema.index({ patientId: 1 });

export default mongoose.model<IReview>("Review", ReviewSchema);
