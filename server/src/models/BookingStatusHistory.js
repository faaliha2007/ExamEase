import mongoose from 'mongoose';

const bookingStatusHistorySchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: [true, 'Reference ID is required'],
      index: true,
      trim: true,
      uppercase: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required'],
    },
    actorName: {
      type: String,
      default: 'System',
    },
    actorRole: {
      type: String,
      enum: ['USER', 'ADMIN', 'SYSTEM'],
      required: true,
    },
    oldStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      required: [true, 'New status is required'],
    },
    note: {
      type: String,
      default: '',
    },
    eventAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingStatusHistorySchema.index({ referenceId: 1, eventAt: 1 });

export const BookingStatusHistory = mongoose.model(
  'BookingStatusHistory',
  bookingStatusHistorySchema
);
