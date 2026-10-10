import { RESERVATION_STATUS } from '../models/Reservation.js';

/**
 * BR8 - Strict Status Transition State Machine
 * Initial status: CONFIRMED
 * Progression: CONFIRMED -> CHECKED_IN or BOARDED -> COMPLETED
 * Terminal: COMPLETED, CANCELLED
 * Skipping stages is strictly rejected.
 */
const ALLOWED_ADMIN_TRANSITIONS = {
  [RESERVATION_STATUS.CONFIRMED]: [
    RESERVATION_STATUS.CHECKED_IN,
    RESERVATION_STATUS.BOARDED,
  ],
  [RESERVATION_STATUS.CHECKED_IN]: [
    RESERVATION_STATUS.COMPLETED,
  ],
  [RESERVATION_STATUS.BOARDED]: [
    RESERVATION_STATUS.COMPLETED,
  ],
  [RESERVATION_STATUS.COMPLETED]: [],
  [RESERVATION_STATUS.CANCELLED]: [],
};

export const isValidAdminTransition = (currentStatus, targetStatus) => {
  if (!currentStatus || !targetStatus) {
    return {
      isValid: false,
      message: 'Current status and target status are both required',
    };
  }

  if (currentStatus === RESERVATION_STATUS.COMPLETED || currentStatus === RESERVATION_STATUS.CANCELLED) {
    return {
      isValid: false,
      message: `Cannot transition from terminal status '${currentStatus}' (BR8)`,
    };
  }

  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      message: `Reservation is already in '${currentStatus}' status. Repeated transition rejected (BR8)`,
    };
  }

  const allowedNext = ALLOWED_ADMIN_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      isValid: false,
      message: `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed next states are: ${
        allowedNext.length > 0 ? allowedNext.join(', ') : 'none (terminal state)'
      } (BR8)`,
    };
  }

  return { isValid: true };
};
