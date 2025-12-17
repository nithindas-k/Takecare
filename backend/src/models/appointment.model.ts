import mongoose, { Schema, Model } from "mongoose";
import type { IAppointmentDocument } from "../types/appointment.type";
import { IDGenerator } from "../utils/idGenerator.util";

const AppointmentSchema = new Schema<IAppointmentDocument>(
    {
        customId: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
            index: true,
        },
        
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

    
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            index: true,
        },

        
        appointmentType: {
            type: String,
            enum: ["video", "chat"],
            required: true,
        },

        
        appointmentDate: {
            type: Date,
            required: true,
            index: true,
        },
        appointmentTime: {
            type: String, 
            required: true,
        },
        slotId: {
            type: String,
            required: false,
        },

        
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "rejected"],
            default: "pending",
            required: true,
            index: true,
        },

        
        consultationFees: {
            type: Number,
            required: true,
            min: 0,
        },

        
        reason: {
            type: String,
            default: null,
            trim: true,
        },

        
        cancelledBy: {
            type: String,
            enum: ["patient", "doctor", "admin", null],
            default: null,
        },
        cancellationReason: {
            type: String,
            default: null,
            trim: true,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },

        
        rejectionReason: {
            type: String,
            default: null,
            trim: true,
        },

        
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "refunded", "failed"],
            default: "pending",
        },
        paymentId: {
            type: String,
            default: null,
        },
        paymentMethod: {
            type: String,
            enum: ["card", "upi", "wallet", "netbanking", null],
            default: null,
        },

        
        sessionStartTime: {
            type: Date,
            default: null,
        },
        sessionEndTime: {
            type: Date,
            default: null,
        },
        sessionDuration: {
            type: Number, 
            default: null,
        },

        
        doctorNotes: {
            type: String,
            default: null,
            trim: true,
        },

        
        prescriptionUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (_doc, ret: Record<string, unknown>) {
                const { _id, __v, ...cleanedRet } = ret;
                return {
                    ...cleanedRet,
                    id: _id as string,
                };
            },
        },
        toObject: { virtuals: true },
    }
);


AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1 });
AppointmentSchema.index({ appointmentDate: 1, doctorId: 1 });
AppointmentSchema.index({ status: 1, appointmentDate: 1 });


AppointmentSchema.pre('save', async function (next) {
  if (this.isNew && !this.customId) {
    this.customId = IDGenerator.generateAppointmentId();
  }
  next();
});

AppointmentSchema.virtual("patient", {
    ref: "User",
    localField: "patientId",
    foreignField: "_id",
    justOne: true,
});


AppointmentSchema.virtual("doctor", {
    ref: "Doctor",
    localField: "doctorId",
    foreignField: "_id",
    justOne: true,
});

const AppointmentModel: Model<IAppointmentDocument> =
    mongoose.models.Appointment ||
    mongoose.model<IAppointmentDocument>("Appointment", AppointmentSchema);

export default AppointmentModel;
