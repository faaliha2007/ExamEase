# Automated Test Cases Specification (T1 – T12)
**Assessment:** College Software Engineering SAT II Practical Assessment  
**Testing Framework:** Vitest 2.1+ / Supertest 7.0+  
**Target File:** `server/tests/assessment.test.js`  

---

### Test Case T1: Repeated Resource Selection
* **Test ID:** T1
* **Linked Requirements:** FR3, FR4 | BR2, BR7
* **Objective:** Select the same resource twice and verify no incorrect duplicate record or unintended capacity update occurs. Two separate valid bookings are allowed if capacity permits.
* **Preconditions:** Resource `R101` seeded with initial availability = 10, rate = ₹499.
* **Inputs:**
  - Request 1: `resourceId: 'R101'`, `quantity: 2`, `candidateName: 'Alice Johnson'`
  - Request 2: `resourceId: 'R101'`, `quantity: 3`, `candidateName: 'Alice Johnson (Module 2)'`
* **Execution Steps:**
  1. POST Request 1 to `/api/reservations` using User 1 token.
  2. POST Request 2 to `/api/reservations` using User 1 token.
  3. Query MongoDB for `Reservation` records with `resourceId: 'R101'`.
  4. Query MongoDB for `Resource` `R101` availability.
* **Expected Result:**
  - Both requests return HTTP 201 Created.
  - Exactly two distinct reservations created with different `bookingReference` values.
  - Final `availability` of `R101` = `10 - 2 - 3 = 5`. No duplicate overwriting.

---

### Test Case T2: Quantity Boundaries (0, 1, 5, 6, 1.5)
* **Test ID:** T2
* **Linked Requirements:** FR4 | BR1
* **Objective:** Test quantities 0, 1, 5, 6, and 1.5; accept only valid integer boundary values (1 and 5), subject to availability.
* **Preconditions:** Resource `R103` has availability = 20.
* **Inputs:**
  - Case 1: `quantity: 0`
  - Case 2: `quantity: 6`
  - Case 3: `quantity: 1.5`
  - Case 4: `quantity: 1`
  - Case 5: `quantity: 5`
* **Execution Steps:** Submit each case to `POST /api/reservations`.
* **Expected Result:**
  - Quantities 0, 6, and 1.5 return HTTP 400 Bad Request with validation errors. No coercion.
  - Quantities 1 and 5 return HTTP 201 Created.

---

### Test Case T3: Booking Slot with Zero Availability
* **Test ID:** T3
* **Linked Requirements:** FR3, FR4 | BR2, BR6
* **Objective:** Attempt to book `R104` with availability 0; reject without a booking or capacity change.
* **Preconditions:** Resource `R104` has initial availability = 0.
* **Inputs:** `resourceId: 'R104'`, `quantity: 1`.
* **Execution Steps:** Submit request to `POST /api/reservations`.
* **Expected Result:**
  - Returns HTTP 409 Conflict.
  - Zero reservation records created for `R104`.
  - Resource `R104` availability remains 0.

---

### Test Case T4: Base Amounts and Booking Charge Calculation
* **Test ID:** T4
* **Linked Requirements:** FR4 | BR4
* **Objective:** Test base amounts ₹999, ₹1,000, and ₹1,001; verify charges ₹50, ₹0, and ₹0.
* **Preconditions:** `bookingCharge` = 50 when `baseAmount < 1000`, else 0.
* **Inputs:**
  - Rate = ₹999, Quantity = 1 (Base = ₹999)
  - Rate = ₹1000, Quantity = 1 (Base = ₹1000)
  - Rate = ₹1001, Quantity = 1 (Base = ₹1001)
* **Execution Steps:** Execute `calculateFare(rate, quantity)`.
* **Expected Result:**
  - ₹999 base -> Booking charge = ₹50, Grand total = ₹1,049.
  - ₹1,000 base -> Booking charge = ₹0, Grand total = ₹1,000.
  - ₹1,001 base -> Booking charge = ₹0, Grand total = ₹1,001.

---

### Test Case T5: Valid Confirmation Dossier Verification
* **Test ID:** T5
* **Linked Requirements:** FR4, FR5 | BR3, BR4, BR7
* **Objective:** Make one valid booking and verify unique reference, `CONFIRMED` status, fare snapshot, reduced capacity, and initial history.
* **Preconditions:** Resource `R105` has rate ₹1,000, availability = 3.
* **Inputs:** `resourceId: 'R105'`, `quantity: 2`, `candidateName: 'Alice Johnson'`.
* **Execution Steps:** POST to `/api/reservations`.
* **Expected Result:**
  - Returns HTTP 201 Created.
  - `bookingReference` matches format `EXM-[A-Z0-9]{6}`.
  - Status is `CONFIRMED`.
  - Fare snapshot: unitRate = 1000, baseAmount = 2000, bookingCharge = 0, grandTotal = 2000.
  - `R105` availability reduced to 1 (`3 - 2`).
  - Exactly one `BookingStatusHistory` record created with `newStatus: 'CONFIRMED'`, `oldStatus: null`.

---

### Test Case T6: Malformed Booking Details Rejection
* **Test ID:** T6
* **Linked Requirements:** FR4 | BR5, BR6
* **Objective:** Submit missing or invalid booking details (blank name, 9-digit phone); verify no reservation, no history, and no capacity change.
* **Preconditions:** Resource `R101` initial availability recorded.
* **Inputs:**
  - Input A: `candidateName: '   '` (blank spaces).
  - Input B: `candidatePhone: '123456789'` (9 digits instead of 10).
* **Execution Steps:** POST each input to `/api/reservations`.
* **Expected Result:**
  - Both return HTTP 400 Bad Request.
  - Zero reservations created.
  - Resource availability unchanged.
  - Zero history records generated.

---

### Test Case T7: Concurrency & Stale Capacity Rejection
* **Test ID:** T7
* **Linked Requirements:** FR3, FR4 | BR2, BR6, BR7
* **Objective:** Select a slot, consume capacity via another request before confirming; verify stale request rejected without partial updates.
* **Preconditions:** Resource `R102` has availability = 5.
* **Inputs:**
  - Request 1: Takes 4 seats (remaining = 1).
  - Request 2: Stale attempt to book 2 seats on `R102`.
* **Execution Steps:**
  1. POST Request 1 (4 seats) -> HTTP 201.
  2. POST Request 2 (2 seats) -> Fails availability check.
* **Expected Result:**
  - Request 2 rejected with HTTP 409 Conflict.
  - Availability remains 1 (`5 - 4`). Zero partial records.

---

### Test Case T8: Access Control & Role Boundary Isolation
* **Test ID:** T8
* **Linked Requirements:** FR6, FR8, FR10 | BR8, BR10
* **Objective:** Verify User 1 cannot view or cancel User 2's booking and cannot advance operational statuses.
* **Preconditions:** User 2 creates confirmed booking.
* **Inputs:** User 1 authentication token.
* **Execution Steps:**
  1. User 1 calls `GET /api/reservations/:user2BookingRef`.
  2. User 1 calls `POST /api/reservations/:user2BookingId/cancel`.
  3. User 1 calls `PATCH /api/admin/reservations/:user2BookingId/status`.
* **Expected Result:**
  - All three requests return HTTP 403 Forbidden.
  - User 2's booking remains intact with status `CONFIRMED`.

---

### Test Case T9: Administrator Status Progression Machine
* **Test ID:** T9
* **Linked Requirements:** FR8, FR9 | BR8
* **Objective:** Verify valid administrator status progression (`CONFIRMED → CHECKED_IN → COMPLETED`) and rejection of skipped, repeated, or terminal transitions.
* **Preconditions:** Booking in `CONFIRMED` status. Admin token.
* **Inputs:** Target status transitions.
* **Execution Steps:**
  1. Admin attempts skip: `CONFIRMED → COMPLETED`.
  2. Admin executes: `CONFIRMED → CHECKED_IN`.
  3. Admin repeats: `CHECKED_IN → CHECKED_IN`.
  4. Admin executes: `CHECKED_IN → COMPLETED`.
  5. Admin attempts transition from terminal: `COMPLETED → CHECKED_IN`.
* **Expected Result:**
  - Steps 1, 3, 5 return HTTP 400 Bad Request with strict error messages.
  - Steps 2 and 4 succeed with HTTP 200 OK.

---

### Test Case T10: Cancellation & Capacity Restoration Once
* **Test ID:** T10
* **Linked Requirements:** FR6 | BR9
* **Objective:** Cancel an eligible booking, verify capacity restoration once, and confirm second cancellation fails without another capacity change.
* **Preconditions:** Resource `R105` availability = 3. User 1 books 2 seats (capacity = 1).
* **Inputs:** Booking owner cancellation requests.
* **Execution Steps:**
  1. POST first cancellation to `/api/reservations/:id/cancel`.
  2. POST second cancellation to `/api/reservations/:id/cancel`.
* **Expected Result:**
  - First cancellation returns HTTP 200 OK. Capacity restored to 3 (`1 + 2`).
  - Second cancellation returns HTTP 400 Bad Request. Capacity remains 3 (not 5).

---

### Test Case T11: Database Persistence Across Reconnect
* **Test ID:** T11
* **Linked Requirements:** FR5 | BR7
* **Objective:** Verify database persistence after disconnecting and reconnecting to MongoDB.
* **Preconditions:** Create a confirmed booking with reference `EXM-XXXXXX`.
* **Inputs:** Database disconnect and reconnect cycle.
* **Execution Steps:**
  1. Verify booking created.
  2. Call `disconnectDB()` (connection state = 0).
  3. Call `connectDB(TEST_DB_URI)` (connection state = 1).
  4. Query `Reservation` and `ReservationItem` from MongoDB.
* **Expected Result:** All documents and fields persist identically.

---

### Test Case T12: Historical Fare Immutability
* **Test ID:** T12
* **Linked Requirements:** FR4, FR7 | BR3, BR4
* **Objective:** Change a resource's rate after booking and verify historical booking's saved rate and total remain unchanged.
* **Preconditions:** Resource `R101` initial rate = ₹499. User books 2 seats (base = ₹998, charge = ₹50, total = ₹1,048).
* **Inputs:** Admin updates rate of `R101` to ₹850.
* **Execution Steps:**
  1. Verify original booking fare item.
  2. PATCH `/api/resources/R101/rate` with `{ rate: 850 }`.
  3. Query historical booking via `GET /api/reservations/:id`.
* **Expected Result:**
  - `Resource` `R101` rate updated to ₹850.
  - Historical booking's `unitRateSnapshot` remains ₹499, and `grandTotal` remains ₹1,048.

---

### Test Case T13: Administrator Slot Creation
* **Test ID:** T13
* **Linked Feature:** Admin Portal Slot Creation
* **Objective:** Verify an Administrator can create a new examination slot and associated schedule with permanent MongoDB persistence.
* **Preconditions:** Administrator authenticated with valid JWT.
* **Inputs:** `resourceId: 'R106'`, `name: 'Exam Slot F'`, `availability: 12`, `rate: 750`, `examDate: '2026-11-15'`.
* **Execution Steps:** POST payload to `/api/admin/slots`.
* **Expected Result:** Status 201 Created; Resource and Schedule records created permanently in MongoDB.

---

### Test Case T14: Auto-Suggested Next Slot ID
* **Test ID:** T14
* **Linked Feature:** Admin Portal Slot Creation
* **Objective:** Verify system auto-suggests next unique Slot ID based on existing `R<number>` sequence.
* **Preconditions:** Seed resources `R101`–`R105` exist in database.
* **Execution Steps:** GET `/api/admin/slots/next-id`.
* **Expected Result:** Returns status 200 with `{ nextSlotId: 'R106' }`.

---

### Test Case T15: Slot Creation Input Validation
* **Test ID:** T15
* **Linked Feature:** Admin Portal Slot Creation
* **Objective:** Verify rejection of invalid slot data (missing name, capacity <= 0, decimal capacity, negative fee, missing date).
* **Execution Steps:** POST invalid payloads to `/api/admin/slots`.
* **Expected Result:** Status 400 Bad Request with descriptive validation errors.

---

### Test Case T16: Duplicate Slot ID Prevention
* **Test ID:** T16
* **Linked Feature:** Admin Portal Slot Creation
* **Objective:** Prevent creating a slot with a duplicate `resourceId`.
* **Inputs:** Payload with `resourceId: 'R101'` (already existing).
* **Execution Steps:** POST payload to `/api/admin/slots`.
* **Expected Result:** Status 409 Conflict; no duplicate records created.

---

### Test Case T17: Slot Creation Role Authorization
* **Test ID:** T17
* **Linked Feature:** Admin Portal Slot Creation
* **Objective:** Prevent unauthenticated or student (USER) access to slot creation.
* **Execution Steps:** POST to `/api/admin/slots` without token and with USER token.
* **Expected Result:** HTTP 401 Unauthorized (no token) and HTTP 403 Forbidden (student token).

---

### Test Case T18: Student Booking and Capacity Protection on Newly Created Slot
* **Test ID:** T18
* **Linked Feature:** Student Registration & Concurrency
* **Objective:** Verify student can book seats on newly created slot and overbooking when full is rejected.
* **Execution Steps:**
  1. Admin creates slot `R106` with 5 seats.
  2. Student books 2 seats on `R106` -> Status 201; remaining capacity becomes 3.
  3. Student attempts to book 4 seats (exceeding remaining 3) -> Status 409 Conflict.
* **Expected Result:** Booking succeeds, capacity decrements accurately, and overbooking is rejected.
