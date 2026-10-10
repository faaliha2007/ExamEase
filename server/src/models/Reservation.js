import mongoose from 'mongoose';

export const RESERVATION_STATUS = {
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  BOARDED: 'BOARDED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const reservationSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    resourceId: {
      type: String,
      required: [true, 'Resource ID is required'],
      ref: 'Resource',
      trim: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.CONFIRMED,
      required: true,
      index: true,
    },
    bookingDate: {
      type: String,
      required: [true, 'Booking date is required'],
      trim: true,
    },
    candidateName: {
      type: String,
      required: [true, 'Candidate name cannot be blank'],
      trim: true,
    },
    candidatePhone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Phone number must contain exactly 10 digits'],
    },
    candidateIdRef: {
      type: String,
      required: [true, 'Candidate identity reference is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Reservation = mongoose.model('Reservation', reservationSchema);
