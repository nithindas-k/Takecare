import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    appointmentId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderModel: 'User' | 'Doctor';
    content: string;
    type: 'text' | 'image' | 'file' | 'system'; // Added 'system' just in case
    read: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true,
            index: true
        },
        senderId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'senderModel'
        },
        senderModel: {
            type: String,
            required: true,
            enum: ['User', 'Doctor']
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['text', 'image', 'file', 'system'],
            default: 'text'
        },
        read: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        isEdited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (_doc, ret) {
                const { _id, __v, ...cleanedRet } = ret;
                return {
                    ...cleanedRet,
                    id: _id
                };
            }
        }
    }
);

// Indexes for faster retrieval of chat history
MessageSchema.index({ appointmentId: 1, createdAt: 1 });

const MessageModel: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default MessageModel;
