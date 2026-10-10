import mongoose from 'mongoose';

const reservationItemSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation reference is required'],
      index: true,
    },
    bookingReference: {
      type: String,
      required: [true, 'Booking reference is required'],
      index: true,
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
      trim: true,
      uppercase: true,
      index: true,
    },
    resourceRefSnapshot: {
      resourceId: { type: String, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [5, 'Quantity cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    unitRateSnapshot: {
      type: Number,
      required: [true, 'Unit rate snapshot is required'],
      min: [0, 'Rate snapshot cannot be negative'],
    },
    baseAmount: {
      type: Number,
      required: [true, 'Base amount is required'],
      min: [0, 'Base amount cannot be negative'],
    },
    bookingCharge: {
      type: Number,
      required: [true, 'Booking charge is required'],
      min: [0, 'Booking charge cannot be negative'],
    },
    grandTotal: {
      type: Number,
      required: [true, 'Grand total is required'],
      min: [0, 'Grand total cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const ReservationItem = mongoose.model('ReservationItem', reservationItemSchema);
