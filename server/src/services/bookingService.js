import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';
import { Reservation, RESERVATION_STATUS } from '../models/Reservation.js';
import { ReservationItem } from '../models/ReservationItem.js';
import { BookingStatusHistory } from '../models/BookingStatusHistory.js';
import { validateBookingPayload, calculateFare } from '../validators/bookingValidator.js';
import { isValidAdminTransition } from '../validators/statusValidator.js';
import { AvailabilityService } from './availabilityService.js';
import { canUseTransactions } from '../config/db.js';

export class BookingService {
  /**
   * Generates a collision-resistant unique booking reference: EXM-XXXXXX
   */
  static generateBookingReference() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `EXM-${code}`;
  }

  /**
   * BR1 - BR7: Create and confirm booking
   */
  static async createBooking(user, payload) {
    // 1. Validation (BR1, BR5)
    const validation = validateBookingPayload(payload);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join('; '));
      err.statusCode = 400;
      err.validationErrors = validation.errors;
      throw err;
    }

    const {
      resourceId,
      quantity,
      candidateName,
      candidatePhone,
      candidateIdRef,
      bookingDate,
    } = payload;

    const normalizedResourceId = resourceId.trim().toUpperCase();

    // 2. Initial availability check (BR2)
    const availCheck = await AvailabilityService.checkAvailability(
      normalizedResourceId,
      quantity
    );
    if (!availCheck.available) {
      const err = new Error(availCheck.message);
      err.statusCode = 409; // Conflict / insufficient availability
      throw err;
    }

    const resource = availCheck.resource;

    // 3. Fare snapshot calculation (BR3, BR4)
    const fare = calculateFare(resource.rate, quantity);

    // 4. Generate unique reference (BR7)
    let bookingReference = this.generateBookingReference();
    // Ensure uniqueness
    let existing = await Reservation.findOne({ bookingReference });
    while (existing) {
      bookingReference = this.generateBookingReference();
      existing = await Reservation.findOne({ bookingReference });
    }

    const useTxn = canUseTransactions();

    if (useTxn) {
      // Replica-set multi-document transaction path
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        // Concurrency-safe atomic decrement
        const updatedResource = await Resource.findOneAndUpdate(
          {
            resourceId: normalizedResourceId,
            status: 'ACTIVE',
            availability: { $gte: quantity },
          },
          { $inc: { availability: -quantity } },
          { session, new: true }
        );

        if (!updatedResource) {
          throw new Error(
            `Capacity for '${resource.name}' was consumed by another request during confirmation. Please try again (BR2)`
          );
        }

        const [reservation] = await Reservation.create(
          [
            {
              bookingReference,
              userId: user._id,
              resourceId: normalizedResourceId,
              status: RESERVATION_STATUS.CONFIRMED,
              bookingDate: bookingDate.trim(),
              candidateName: candidateName.trim(),
              candidatePhone: candidatePhone.trim(),
              candidateIdRef: candidateIdRef.trim(),
            },
          ],
          { session }
        );

        const [item] = await ReservationItem.create(
          [
            {
              reservationId: reservation._id,
              bookingReference,
              userId: user._id,
              resourceId: normalizedResourceId,
              resourceRefSnapshot: {
                resourceId: resource.resourceId,
                name: resource.name,
                category: resource.category,
              },
              quantity,
              unitRateSnapshot: fare.unitRate,
              baseAmount: fare.baseAmount,
              bookingCharge: fare.bookingCharge,
              grandTotal: fare.grandTotal,
            },
          ],
          { session }
        );

        await BookingStatusHistory.create(
          [
            {
              referenceId: bookingReference,
              reservationId: reservation._id,
              actorId: user._id,
              actorName: user.name,
              actorRole: user.role,
              oldStatus: null,
              newStatus: RESERVATION_STATUS.CONFIRMED,
              note: `Initial reservation confirmed for ${quantity} seat(s). Fare: ₹${fare.grandTotal.toFixed(2)}`,
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        return {
          reservation,
          item,
          fare,
          remainingAvailability: updatedResource.availability,
        };
      } catch (txnError) {
        await session.abortTransaction();
        session.endSession();
        txnError.statusCode = txnError.statusCode || 409;
        throw txnError;
      }
    } else {
      // Standalone MongoDB path with atomic conditional decrement and rollback compensation
      const updatedResource = await Resource.findOneAndUpdate(
        {
          resourceId: normalizedResourceId,
          status: 'ACTIVE',
          availability: { $gte: quantity },
        },
        { $inc: { availability: -quantity } },
        { new: true }
      );

      if (!updatedResource) {
        const err = new Error(
          `Capacity for '${resource.name}' was exhausted during confirmation. No capacity deducted (BR2, BR6)`
        );
        err.statusCode = 409;
        throw err;
      }

      let reservation;
      let item;
      try {
        reservation = await Reservation.create({
          bookingReference,
          userId: user._id,
          resourceId: normalizedResourceId,
          status: RESERVATION_STATUS.CONFIRMED,
          bookingDate: bookingDate.trim(),
          candidateName: candidateName.trim(),
          candidatePhone: candidatePhone.trim(),
          candidateIdRef: candidateIdRef.trim(),
        });

        item = await ReservationItem.create({
          reservationId: reservation._id,
          bookingReference,
          userId: user._id,
          resourceId: normalizedResourceId,
          resourceRefSnapshot: {
            resourceId: resource.resourceId,
            name: resource.name,
            category: resource.category,
          },
          quantity,
          unitRateSnapshot: fare.unitRate,
          baseAmount: fare.baseAmount,
          bookingCharge: fare.bookingCharge,
          grandTotal: fare.grandTotal,
        });

        await BookingStatusHistory.create({
          referenceId: bookingReference,
          reservationId: reservation._id,
          actorId: user._id,
          actorName: user.name,
          actorRole: user.role,
          oldStatus: null,
          newStatus: RESERVATION_STATUS.CONFIRMED,
          note: `Initial reservation confirmed for ${quantity} seat(s). Fare: ₹${fare.grandTotal.toFixed(2)}`,
        });

        return {
          reservation,
          item,
          fare,
          remainingAvailability: updatedResource.availability,
        };
      } catch (docErr) {
        // Rollback atomic capacity decrement to prevent capacity loss (BR6)
        await Resource.findOneAndUpdate(
          { resourceId: normalizedResourceId },
          { $inc: { availability: quantity } }
        );
        if (reservation) {
          await Reservation.deleteOne({ _id: reservation._id });
        }
        if (item) {
          await ReservationItem.deleteOne({ _id: item._id });
        }
        await BookingStatusHistory.deleteMany({ referenceId: bookingReference });
        docErr.statusCode = 500;
        throw docErr;
      }
    }
  }

  /**
   * BR9 - Cancellation workflow
   * Only owner of CONFIRMED booking can cancel.
   * Restores capacity exactly once.
   */
  static async cancelBooking(bookingIdOrRef, user) {
    const query = mongoose.Types.ObjectId.isValid(bookingIdOrRef)
      ? { _id: bookingIdOrRef }
      : { bookingReference: bookingIdOrRef.toUpperCase() };

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Ownership check (BR9, BR10)
    if (reservation.userId.toString() !== user._id.toString()) {
      const err = new Error('Access denied. You can only cancel your own bookings (BR10)');
      err.statusCode = 403;
      throw err;
    }

    // Status check (BR9)
    if (reservation.status !== RESERVATION_STATUS.CONFIRMED) {
      let msg = `Cannot cancel booking with status '${reservation.status}'.`;
      if (reservation.status === RESERVATION_STATUS.CANCELLED) {
        msg = 'Booking is already CANCELLED. Repeated cancellation rejected (BR9)';
      } else {
        msg = `Only CONFIRMED bookings may be cancelled. Booking is already ${reservation.status} (BR9)`;
      }
      const err = new Error(msg);
      err.statusCode = 400;
      throw err;
    }

    // Find reservation item to know quantity to restore
    const item = await ReservationItem.findOne({ reservationId: reservation._id });
    const quantityToRestore = item ? item.quantity : 1;

    // Atomically change status from CONFIRMED to CANCELLED (prevents concurrent double cancellations)
    const updatedReservation = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: RESERVATION_STATUS.CONFIRMED },
      { status: RESERVATION_STATUS.CANCELLED },
      { new: true }
    );

    if (!updatedReservation) {
      const err = new Error('Booking could not be cancelled or was concurrently cancelled (BR9)');
      err.statusCode = 409;
      throw err;
    }

    // Restore capacity exactly once (BR9)
    const updatedResource = await AvailabilityService.replenishAvailability(
      reservation.resourceId,
      quantityToRestore
    );

    // Record status history event
    await BookingStatusHistory.create({
      referenceId: reservation.bookingReference,
      reservationId: reservation._id,
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      oldStatus: RESERVATION_STATUS.CONFIRMED,
      newStatus: RESERVATION_STATUS.CANCELLED,
      note: `Booking cancelled by candidate. Restored ${quantityToRestore} seat(s) to capacity.`,
    });

    return {
      reservation: updatedReservation,
      restoredQuantity: quantityToRestore,
      newAvailability: updatedResource ? updatedResource.availability : null,
    };
  }

  /**
   * BR8 - Administrator status progression
   */
  static async advanceOperationalStatus(bookingIdOrRef, adminUser, targetStatus) {
    if (adminUser.role !== 'ADMIN') {
      const err = new Error('Only administrators can advance operational statuses (BR8, BR10)');
      err.statusCode = 403;
      throw err;
    }

    const query = mongoose.Types.ObjectId.isValid(bookingIdOrRef)
      ? { _id: bookingIdOrRef }
      : { bookingReference: bookingIdOrRef.toUpperCase() };

    const reservation = await Reservation.findOne(query);
    if (!reservation) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const check = isValidAdminTransition(reservation.status, targetStatus);
    if (!check.isValid) {
      const err = new Error(check.message);
      err.statusCode = 400;
      throw err;
    }

    const oldStatus = reservation.status;

    // Atomically transition status
    const updatedReservation = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: oldStatus },
      { status: targetStatus },
      { new: true }
    );

    if (!updatedReservation) {
      const err = new Error('Status transition conflict. Booking status changed concurrently.');
      err.statusCode = 409;
      throw err;
    }

    // Record audit history
    await BookingStatusHistory.create({
      referenceId: reservation.bookingReference,
      reservationId: reservation._id,
      actorId: adminUser._id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      oldStatus,
      newStatus: targetStatus,
      note: `Operational status advanced from ${oldStatus} to ${targetStatus} by Administrator.`,
    });

    return updatedReservation;
  }

  /**
   * Fetch complete booking details including item and status history
   */
  static async getBookingDetails(bookingIdOrRef, requestingUser) {
    const query = mongoose.Types.ObjectId.isValid(bookingIdOrRef)
      ? { _id: bookingIdOrRef }
      : { bookingReference: bookingIdOrRef.toUpperCase() };

    const reservation = await Reservation.findOne(query).populate('userId', 'name email role');
    if (!reservation) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    // Access check (BR10)
    const isOwner = reservation.userId._id
      ? reservation.userId._id.toString() === requestingUser._id.toString()
      : reservation.userId.toString() === requestingUser._id.toString();

    if (!isOwner && requestingUser.role !== 'ADMIN') {
      const err = new Error('Access denied. You cannot view another user\'s booking (BR10)');
      err.statusCode = 403;
      throw err;
    }

    const [item, history, resource] = await Promise.all([
      ReservationItem.findOne({ reservationId: reservation._id }),
      BookingStatusHistory.find({ referenceId: reservation.bookingReference }).sort({ eventAt: 1 }),
      Resource.findOne({ resourceId: reservation.resourceId }),
    ]);

    return {
      reservation,
      item,
      history,
      resource,
    };
  }

  /**
   * List bookings for current user (BR10)
   */
  static async getUserBookings(userId) {
    const reservations = await Reservation.find({ userId }).sort({ createdAt: -1 });
    const bookingIds = reservations.map((r) => r._id);
    const items = await ReservationItem.find({ reservationId: { $in: bookingIds } });

    const itemMap = new Map();
    items.forEach((item) => {
      itemMap.set(item.reservationId.toString(), item);
    });

    return reservations.map((res) => ({
      ...res.toObject(),
      item: itemMap.get(res._id.toString()) || null,
    }));
  }

  /**
   * List all bookings for admin dashboard with search and filters
   */
  static async getAllBookingsForAdmin({ search, status, resourceId, page = 1, limit = 50 } = {}) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (resourceId && resourceId !== 'ALL') {
      filter.resourceId = resourceId.toUpperCase();
    }
    if (search && search.trim().length > 0) {
      const term = search.trim();
      filter.$or = [
        { bookingReference: { $regex: term, $options: 'i' } },
        { candidateName: { $regex: term, $options: 'i' } },
        { candidatePhone: { $regex: term, $options: 'i' } },
        { candidateIdRef: { $regex: term, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email role'),
      Reservation.countDocuments(filter),
    ]);

    const bookingIds = reservations.map((r) => r._id);
    const items = await ReservationItem.find({ reservationId: { $in: bookingIds } });
    const itemMap = new Map();
    items.forEach((item) => {
      itemMap.set(item.reservationId.toString(), item);
    });

    const enriched = reservations.map((res) => ({
      ...res.toObject(),
      item: itemMap.get(res._id.toString()) || null,
    }));

    return {
      reservations: enriched,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }
}
