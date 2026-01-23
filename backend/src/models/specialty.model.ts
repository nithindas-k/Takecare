import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpecialty {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISpecialtyDocument extends ISpecialty, Document { }

const SpecialtySchema = new Schema<ISpecialtyDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


SpecialtySchema.index({ isActive: 1 });

const SpecialtyModel: Model<ISpecialtyDocument> =
  mongoose.models.Specialty || mongoose.model<ISpecialtyDocument>("Specialty", SpecialtySchema);

export default SpecialtyModel;
