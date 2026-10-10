/**
 * Booking validator enforcing BR1 and BR5
 */
export const validateBookingPayload = (data) => {
  const errors = [];

  // BR1 - Quantity: Integer only, 1 through 5. Reject 0, negative, decimals, missing, > 5. No silent coercion.
  if (data.quantity === undefined || data.quantity === null || data.quantity === '') {
    errors.push('Quantity is required');
  } else if (typeof data.quantity !== 'number') {
    errors.push('Quantity must be a valid number, not string or empty value');
  } else if (!Number.isInteger(data.quantity)) {
    errors.push('Quantity must be an integer. Decimals are not permitted (BR1)');
  } else if (data.quantity < 1 || data.quantity > 5) {
    errors.push('Quantity must be between 1 and 5 inclusive (BR1)');
  }

  // BR5 - Required Details: Name cannot be blank
  if (!data.candidateName || typeof data.candidateName !== 'string' || data.candidateName.trim().length === 0) {
    errors.push('Candidate name cannot be blank (BR5)');
  }

  // BR5 - Phone must contain exactly 10 digits
  if (!data.candidatePhone || typeof data.candidatePhone !== 'string') {
    errors.push('Candidate phone number is required (BR5)');
  } else {
    const trimmedPhone = data.candidatePhone.trim();
    if (!/^\d{10}$/.test(trimmedPhone)) {
      errors.push('Phone number must contain exactly 10 numeric digits (BR5)');
    }
  }

  // BR5 - Identity / Reference Field
  if (!data.candidateIdRef || typeof data.candidateIdRef !== 'string' || data.candidateIdRef.trim().length === 0) {
    errors.push('Candidate identity/reference (e.g. Student ID or Roll No) is required (BR5)');
  }

  // Booking Date
  if (!data.bookingDate || typeof data.bookingDate !== 'string' || data.bookingDate.trim().length === 0) {
    errors.push('Booking date is required (BR5)');
  }

  // Resource identifier
  if (!data.resourceId || typeof data.resourceId !== 'string' || data.resourceId.trim().length === 0) {
    errors.push('Resource ID (e.g. R101) is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * BR4 - Fare calculation
 * baseAmount = currentRate * quantity
 * bookingCharge = 50 when baseAmount < 1000; otherwise 0
 * grandTotal = baseAmount + bookingCharge
 */
export const calculateFare = (rate, quantity) => {
  const safeRate = Math.round((Number(rate) + Number.EPSILON) * 100) / 100;
  const baseAmount = Math.round((safeRate * quantity + Number.EPSILON) * 100) / 100;
  const bookingCharge = baseAmount < 1000 ? 50 : 0;
  const grandTotal = Math.round((baseAmount + bookingCharge + Number.EPSILON) * 100) / 100;

  return {
    unitRate: safeRate,
    quantity,
    baseAmount,
    bookingCharge,
    grandTotal,
  };
};
