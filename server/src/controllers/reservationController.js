import { BookingService } from '../services/bookingService.js';

export class ReservationController {
  /**
   * POST /api/reservations
   * Create a new confirmed booking
   */
  static async createReservation(req, res, next) {
    try {
      const result = await BookingService.createBooking(req.user, req.body);
      res.status(201).json({
        success: true,
        message: 'Examination slot reservation confirmed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reservations/my
   * Get all reservations belonging to authenticated user
   */
  static async getMyReservations(req, res, next) {
    try {
      const bookings = await BookingService.getUserBookings(req.user._id);
      res.status(200).json({
        success: true,
        count: bookings.length,
        reservations: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/reservations/:id
   * Get single reservation details (with fare breakdown and audit trail)
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
   * POST /api/reservations/:id/cancel
   * Cancel an owned CONFIRMED booking and restore capacity
   */
  static async cancelReservation(req, res, next) {
    try {
      const { id } = req.params;
      const result = await BookingService.cancelBooking(id, req.user);
      res.status(200).json({
        success: true,
        message: `Reservation ${result.reservation.bookingReference} has been successfully cancelled. Capacity restored.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
