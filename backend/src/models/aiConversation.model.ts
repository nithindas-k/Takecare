import mongoose, { Schema, Model } from "mongoose";
import { IAIConversationDocument } from "../types/aiMatching.type";

const AIConversationSchema = new Schema<IAIConversationDocument>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        messages: [
            {
                role: {
                    type: String,
                    enum: ["system", "user", "assistant"],
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                recommendations: {
                    type: Schema.Types.Mixed,
                    required: false,
                },
            },
        ],
        extractedInfo: {
            chiefComplaint: String,
            symptoms: [String],
            specialtyNeeded: String,
            preferences: Schema.Types.Mixed,
        },
        recommendedDoctors: [
            {
                type: Schema.Types.ObjectId,
                ref: "Doctor",
            },
        ],
        status: {
            type: String,
            enum: ["active", "completed", "abandoned"],
            default: "active",
        },
        lastActivity: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (_doc, ret) {
                const { _id, __v, ...cleanedRet } = ret;
                return {
                    ...cleanedRet,
                    id: _id.toString(),
                };
            },
        },
        toObject: { virtuals: true },
    }
);

// Index for efficient queries
AIConversationSchema.index({ patientId: 1, status: 1 });
AIConversationSchema.index({ lastActivity: 1 });

// Update lastActivity on save
AIConversationSchema.pre("save", function (next) {
    this.lastActivity = new Date();
    next();
});

const AIConversationModel: Model<IAIConversationDocument> =
    (mongoose.models && (mongoose.models.AIConversation as Model<IAIConversationDocument>)) ||
    mongoose.model<IAIConversationDocument>("AIConversation", AIConversationSchema);

export default AIConversationModel;
