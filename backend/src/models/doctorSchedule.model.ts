import mongoose, { Schema, Model } from "mongoose";
import type { IDoctorScheduleDocument } from "../types/schedule.type";
import { IDGenerator } from "../utils/idGenerator.util";


const TimeSlotSchema = new Schema(
    {
        customId: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
        },
        startTime: {
            type: String, 
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        enabled: {
            type: Boolean,
            default: true,
        },
        booked: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const DayScheduleSchema = new Schema(
    {
        day: {
            type: String,
            enum: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            required: true,
        },
        enabled: {
            type: Boolean,
            default: false,
        },
        slots: {
            type: [TimeSlotSchema],
            default: [],
        },
    },
    { _id: false }
);

const DoctorScheduleSchema = new Schema<IDoctorScheduleDocument>(
    {
        customId: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
            index: true,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctor",
            required: true,
            unique: true,
            index: true,
        },

        
        weeklySchedule: {
            type: [DayScheduleSchema],
            default: [
                { day: "Monday", enabled: false, slots: [] },
                { day: "Tuesday", enabled: false, slots: [] },
                { day: "Wednesday", enabled: false, slots: [] },
                { day: "Thursday", enabled: false, slots: [] },
                { day: "Friday", enabled: false, slots: [] },
                { day: "Saturday", enabled: false, slots: [] },
                { day: "Sunday", enabled: false, slots: [] },
            ],
        },

        
        blockedDates: [
            {
                date: {
                    type: Date,
                    required: true,
                },
                reason: {
                    type: String,
                    default: null,
                    trim: true,
                },
            },
        ],

        
        defaultSlotDuration: {
            type: Number,
            default: 30,
            min: 15,
            max: 120,
        },

        
        bufferTime: {
            type: Number,
            default: 5,
            min: 0,
            max: 30,
        },

        
        maxPatientsPerSlot: {
            type: Number,
            default: 1,
            min: 1,
            max: 10,
        },

        
        isActive: {
            type: Boolean,
            default: true,
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


DoctorScheduleSchema.index({ doctorId: 1 }, { unique: true });
DoctorScheduleSchema.index({ isActive: 1 });


DoctorScheduleSchema.pre('save', async function (next) {

  if (this.isNew && !this.customId) {
    this.customId = IDGenerator.generateSlotId();
  }
  
  
  if (this.weeklySchedule) {
    for (const daySchedule of this.weeklySchedule) {
      if (daySchedule.slots) {
        for (const slot of daySchedule.slots) {
          if (!slot.customId) {
            slot.customId = IDGenerator.generateSlotId();
          }
        }
      }
    }
  }
  
  next();
});

DoctorScheduleSchema.virtual("doctor", {
    ref: "Doctor",
    localField: "doctorId",
    foreignField: "_id",
    justOne: true,
});

const DoctorScheduleModel: Model<IDoctorScheduleDocument> =
    mongoose.models.DoctorSchedule ||
    mongoose.model<IDoctorScheduleDocument>("DoctorSchedule", DoctorScheduleSchema);

export default DoctorScheduleModel;
