import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    resourceId: {
      type: String,
      required: [true, 'Resource identifier is required (e.g., R101)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    rate: {
      type: Number,
      required: [true, 'Rate in INR is required'],
      min: [0, 'Rate cannot be negative'],
    },
    availability: {
      type: Number,
      required: [true, 'Availability count is required'],
      min: [0, 'Availability cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Availability must be an integer',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on status and availability for fast lookups
resourceSchema.index({ status: 1, availability: 1 });

export const Resource = mongoose.model('Resource', resourceSchema);
