/**
 * Slot creation payload validator
 */
export const validateSlotPayload = (data) => {
  const errors = [];

  // Slot ID
  if (!data.resourceId || typeof data.resourceId !== 'string' || data.resourceId.trim().length === 0) {
    errors.push('Slot identifier (e.g. R106) is required');
  }

  // Examination Name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Examination name cannot be blank');
  }

  // Total Seat Capacity (Positive Integer)
  if (data.availability === undefined || data.availability === null || data.availability === '') {
    errors.push('Total seat capacity is required');
  } else if (typeof data.availability !== 'number') {
    errors.push('Total seat capacity must be a numeric value');
  } else if (!Number.isInteger(data.availability)) {
    errors.push('Total seat capacity must be a whole integer');
  } else if (data.availability <= 0) {
    errors.push('Total seat capacity must be a positive integer greater than zero');
  }

  // Registration Fee in INR (Non-negative)
  if (data.rate === undefined || data.rate === null || data.rate === '') {
    errors.push('Registration fee in INR is required');
  } else if (typeof data.rate !== 'number') {
    errors.push('Registration fee must be a numeric value');
  } else if (data.rate < 0) {
    errors.push('Registration fee cannot be negative');
  }

  // Examination Date
  if (!data.examDate || typeof data.examDate !== 'string' || data.examDate.trim().length === 0) {
    errors.push('Examination date is required');
  }

  // Start Time
  if (!data.startTime || typeof data.startTime !== 'string' || data.startTime.trim().length === 0) {
    errors.push('Examination start time is required');
  }

  // End Time
  if (!data.endTime || typeof data.endTime !== 'string' || data.endTime.trim().length === 0) {
    errors.push('Examination end time is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
