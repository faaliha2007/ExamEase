import { BookingService } from '../services/bookingService.js';
import { AvailabilityService } from '../services/availabilityService.js';
import { Reservation } from '../models/Reservation.js';
import { ReservationItem } from '../models/ReservationItem.js';
import { Resource } from '../models/Resource.js';

export class AdminController {
  /**
   * POST /api/admin/slots
   * Create a new Examination Slot and Schedule
   */
  static async createSlot(req, res, next) {
    try {
      const slot = await AvailabilityService.createSlot(req.body);
      res.status(201).json({
        success: true,
        message: `Examination slot ${slot.resourceId} created successfully`,
        slot,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/slots/next-id
   * Fetch the next suggested Slot ID
   */
  static async getNextSlotId(req, res, next) {
    try {
      const nextSlotId = await AvailabilityService.getNextSlotId();
      res.status(200).json({
        success: true,
        nextSlotId,
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * GET /api/admin/reservations
   * List all reservations with search, status filtering, and pagination
   */
  static async getAllReservations(req, res, next) {
    try {
      const { search, status, resourceId, page, limit } = req.query;
      const result = await BookingService.getAllBookingsForAdmin({
        search,
        status,
        resourceId,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/reservations/:id
   * Admin booking detail view with fare snapshot and status history
   */
  static async getReservationById(req, res, next) {
    try {
      const { id } = req.params;
      const details = await BookingService.getBookingDetails(id, req.user);
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/reservations/:id/status
   * Advance operational status (BR8)
   */
  static async updateReservationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Target status is required in request body',
        });
      }

      const updated = await BookingService.advanceOperationalStatus(
        id,
        req.user,
        status
      );

      res.status(200).json({
        success: true,
        message: `Reservation status successfully advanced to '${status}'`,
        reservation: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   * Key system metrics and booking health summary
   */
  static async getDashboardStats(req, res, next) {
    try {
      const [
        totalBookings,
        confirmedCount,
        checkedInCount,
        boardedCount,
        completedCount,
        cancelledCount,
        items,
        resources,
      ] = await Promise.all([
        Reservation.countDocuments(),
        Reservation.countDocuments({ status: 'CONFIRMED' }),
        Reservation.countDocuments({ status: 'CHECKED_IN' }),
        Reservation.countDocuments({ status: 'BOARDED' }),
        Reservation.countDocuments({ status: 'COMPLETED' }),
        Reservation.countDocuments({ status: 'CANCELLED' }),
        ReservationItem.find(),
        Resource.find(),
      ]);

      const totalRevenue = items.reduce((acc, item) => acc + (item.grandTotal || 0), 0);
      const totalCapacity = resources.reduce((acc, r) => acc + (r.availability || 0), 0);

      res.status(200).json({
        success: true,
        stats: {
          totalBookings,
          confirmedCount,
          checkedInCount,
          boardedCount,
          completedCount,
          cancelledCount,
          activeOperationalCount: confirmedCount + checkedInCount + boardedCount,
          totalRevenue,
          totalAvailableCapacity: totalCapacity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
