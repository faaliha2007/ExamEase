import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: String,
      required: [true, 'Schedule ID is required'],
      unique: true,
      trim: true,
    },
    resourceId: {
      type: String,
      required: [true, 'Resource ID reference is required'],
      ref: 'Resource',
      trim: true,
      uppercase: true,
    },
    examDate: {
      type: String,
      required: [true, 'Exam date is required (YYYY-MM-DD)'],
      trim: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (e.g. 09:30 AM)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (e.g. 12:30 PM)'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      default: 'Online Examination Portal / Lab A',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    isDemoData: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleSchema.index({ resourceId: 1, examDate: 1 });

export const Schedule = mongoose.model('Schedule', scheduleSchema);
