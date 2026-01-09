import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'pending' | 'responded' | 'closed';
    createdAt: Date;
    respondedAt?: Date;
    response?: string;
}

const contactSchema = new Schema<IContact>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'responded', 'closed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    response: {
        type: String
    }
});

export const ContactModel = mongoose.model<IContact>('Contact', contactSchema);
