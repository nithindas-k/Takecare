import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICallSession extends Document {
    appointmentId: mongoose.Types.ObjectId;
    callStatus: 'INITIATING' | 'ACTIVE' | 'RECONNECTING' | 'ENDED';
    participants: {
        doctorId: mongoose.Types.ObjectId;
        patientId: mongoose.Types.ObjectId;
        doctorSocketId?: string;
        patientSocketId?: string;
    };
    startedAt: Date;
    lastActiveAt: Date;
    endedAt?: Date;
    reconnectionAttempts: number;
    canRejoinUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
    _id: mongoose.Types.ObjectId;
    id: string;
}

const CallSessionSchema = new Schema<ICallSession>(
    {
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: "Appointment",
            required: true,
            index: true,
        },
        callStatus: {
            type: String,
            enum: ['INITIATING', 'ACTIVE', 'RECONNECTING', 'ENDED'],
            default: 'INITIATING',
            required: true,
        },
        participants: {
            doctorId: {
                type: Schema.Types.ObjectId,
                ref: "Doctor",
                required: true,
            },
            patientId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            doctorSocketId: {
                type: String,
                default: null,
            },
            patientSocketId: {
                type: String,
                default: null,
            },
        },
        startedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        endedAt: {
            type: Date,
            default: null,
        },
        reconnectionAttempts: {
            type: Number,
            default: 0,
        },
        canRejoinUntil: {
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


CallSessionSchema.index({ appointmentId: 1, callStatus: 1 });
CallSessionSchema.index({ 'participants.doctorId': 1, callStatus: 1 });
CallSessionSchema.index({ 'participants.patientId': 1, callStatus: 1 });
CallSessionSchema.index({ canRejoinUntil: 1 });


CallSessionSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.lastActiveAt = new Date();
    }
    next();
});

const CallSessionModel: Model<ICallSession> =
    mongoose.models.CallSession ||
    mongoose.model<ICallSession>("CallSession", CallSessionSchema);

export default CallSessionModel;
