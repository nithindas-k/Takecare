import mongoose, { Schema, Model } from "mongoose";
import type { IAppointmentDocument } from "../types/appointment.type";
import { IDGenerator } from "../utils/idGenerator.util";

import { APPOINTMENT_STATUS, APPOINTMENT_TYPE, CANCELED_BY, DOC_NOTE_CATEGORY, PAYMENT_METHOD, PAYMENT_STATUS, SESSION_STATUS } from "../constants/constants";

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
            enum: Object.values(APPOINTMENT_TYPE),
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
            enum: Object.values(APPOINTMENT_STATUS),
            default: APPOINTMENT_STATUS.PENDING,
            required: true,
            index: true,
        },


        consultationFees: {
            type: Number,
            required: true,
            min: 0,
        },
        adminCommission: {
            type: Number,
            required: true,
            default: 0,
        },
        doctorEarnings: {
            type: Number,
            required: true,
            default: 0,
        },


        reason: {
            type: String,
            default: null,
            trim: true,
        },

        rescheduleCount: {
            type: Number,
            default: 0,
        },


        cancelledBy: {
            type: String,
            enum: [...Object.values(CANCELED_BY), null],
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
        rescheduleRejectReason: {
            type: String,
            default: null,
            trim: true,
        },
        rescheduleRequest: {
            appointmentDate: { type: Date, default: null },
            appointmentTime: { type: String, default: null },
            slotId: { type: String, default: null },
        },


        paymentStatus: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PENDING,
        },
        paymentId: {
            type: String,
            default: null,
        },
        paymentMethod: {
            type: String,
            enum: [...Object.values(PAYMENT_METHOD), null],
            default: null,
        },
        razorpayOrderId: {
            type: String,
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


        doctorNotes: [
            {
                id: { type: String, required: true },
                title: { type: String, required: true },
                description: { type: String, required: false, default: '' },
                category: {
                    type: String,
                    enum: Object.values(DOC_NOTE_CATEGORY),
                    default: DOC_NOTE_CATEGORY.OBSERVATION
                },
                dosage: { type: String, default: null },
                frequency: { type: String, default: null },
                duration: { type: String, default: null },
                createdAt: { type: Date, default: Date.now },
            },
        ],


        prescriptionUrl: {
            type: String,
            default: null,
        },
        sessionStatus: {
            type: String,
            enum: Object.values(SESSION_STATUS),
            default: SESSION_STATUS.IDLE,
        },
        extensionCount: {
            type: Number,
            default: 0,
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
        startNotificationSent: {
            type: Boolean,
            default: false,
        },
        TEST_NEEDED: {
            type: Boolean,
            default: false,
        },
        postConsultationChatWindow: {
            isActive: { type: Boolean, default: false },
            expiresAt: { type: Date, default: null }
        },
        activeCall: {
            sessionId: { type: Schema.Types.ObjectId, ref: 'CallSession', default: null },
            status: {
                type: String,
                enum: ['ACTIVE', 'PAUSED', 'ENDED', null],
                default: null
            },
            canRejoinUntil: { type: Date, default: null }
        },
        checkoutLockUntil: {
            type: Date,
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
AppointmentSchema.index({ checkoutLockUntil: 1 }, { expireAfterSeconds: 0 });


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
