import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Resource } from '../src/models/Resource.js';
import { Reservation, RESERVATION_STATUS } from '../src/models/Reservation.js';
import { ReservationItem } from '../src/models/ReservationItem.js';
import { BookingStatusHistory } from '../src/models/BookingStatusHistory.js';
import { calculateFare } from '../src/validators/bookingValidator.js';
import { EXACT_SEED_RESOURCES } from '../src/scripts/seed.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/examease_assessment_test_db';

describe('SAT II Assessment Test Suite (T1 - T12)', () => {
  let user1Token;
  let user2Token;
  let adminToken;
  let user1Doc;
  let user2Doc;
  let adminDoc;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase();
      }
      await disconnectDB();
    } catch (e) {
      // Ignore disconnect errors
    }
  });

  beforeEach(async () => {
    // Reset test collections
    await Reservation.deleteMany({});
    await ReservationItem.deleteMany({});
    await BookingStatusHistory.deleteMany({});
    await Resource.deleteMany({});
    await User.deleteMany({});

    // Seed test users
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('DemoPass123!', salt);

    user1Doc = await User.create({
      name: 'Alice Johnson',
      email: 'user1@examease.demo',
      password: hash,
      role: 'USER',
      status: 'ACTIVE',
    });

    user2Doc = await User.create({
      name: 'Bob Smith',
      email: 'user2@examease.demo',
      password: hash,
      role: 'USER',
      status: 'ACTIVE',
    });

    adminDoc = await User.create({
      name: 'Dr. Evelyn Vance',
      email: 'admin@examease.demo',
      password: hash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    // Seed exact resources
    for (const res of EXACT_SEED_RESOURCES) {
      await Resource.create({ ...res });
    }

    // Authenticate tokens via demo-login API
    const resUser1 = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'user1@examease.demo' });
    user1Token = resUser1.body.token;

    const resUser2 = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'user2@examease.demo' });
    user2Token = resUser2.body.token;

    const resAdmin = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'admin@examease.demo' });
    adminToken = resAdmin.body.token;
  });

  // T1: Repeated selection of same resource
  it('T1: Select the same resource twice and verify no incorrect duplicate record or unintended capacity update occurs', async () => {
    // Linked FR: FR3, FR4 | Linked BR: BR2, BR7
    // Resource R101 initial capacity: 10
    const payload1 = {
      resourceId: 'R101',
      quantity: 2,
      candidateName: 'Alice Johnson',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1001',
      bookingDate: '2026-10-25',
    };

    const res1 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(payload1);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    const booking1Ref = res1.body.data.reservation.bookingReference;

    // Second valid booking for same resource by same or another user
    const payload2 = {
      resourceId: 'R101',
      quantity: 3,
      candidateName: 'Alice Johnson (Module 2)',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1001-B',
      bookingDate: '2026-10-25',
    };

    const res2 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(payload2);

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
    const booking2Ref = res2.body.data.reservation.bookingReference;

    // Both bookings must be distinct with unique references
    expect(booking1Ref).not.toBe(booking2Ref);

    // Verify remaining capacity: 10 - 2 - 3 = 5
    const resource = await Resource.findOne({ resourceId: 'R101' });
    expect(resource.availability).toBe(5);

    // Verify exactly two distinct reservation items and two reservations created
    const count = await Reservation.countDocuments({ resourceId: 'R101' });
    expect(count).toBe(2);
  });

  // T2: Quantity boundaries (0, 1, 5, 6, 1.5)
  it('T2: Test quantities 0, 1, 5, 6, and 1.5; accept only valid integer boundary values (1 and 5)', async () => {
    // Linked FR: FR4 | Linked BR: BR1
    const basePayload = {
      resourceId: 'R103', // availability: 20
      candidateName: 'Alice Johnson',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1002',
      bookingDate: '2026-10-25',
    };

    // Quantity 0 -> Must reject (400)
    const res0 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ ...basePayload, quantity: 0 });
    expect(res0.status).toBe(400);

    // Quantity 6 -> Must reject (400)
    const res6 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ ...basePayload, quantity: 6 });
    expect(res6.status).toBe(400);

    // Quantity 1.5 (decimal) -> Must reject (400) without coercion
    const resDecimal = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ ...basePayload, quantity: 1.5 });
    expect(resDecimal.status).toBe(400);

    // Quantity 1 -> Must accept (201)
    const res1 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ ...basePayload, quantity: 1 });
    expect(res1.status).toBe(201);
    expect(res1.body.data.item.quantity).toBe(1);

    // Quantity 5 -> Must accept (201)
    const res5 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ ...basePayload, quantity: 5 });
    expect(res5.status).toBe(201);
    expect(res5.body.data.item.quantity).toBe(5);
  });

  // T3: Attempt to book R104 with availability 0
  it('T3: Attempt to book R104 with availability 0; reject without booking or capacity change', async () => {
    // Linked FR: FR3, FR4 | Linked BR: BR2, BR6
    const resourceBefore = await Resource.findOne({ resourceId: 'R104' });
    expect(resourceBefore.availability).toBe(0);

    const payload = {
      resourceId: 'R104',
      quantity: 1,
      candidateName: 'Alice Johnson',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1003',
      bookingDate: '2026-10-25',
    };

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);

    // Verify no booking was created
    const bookingCount = await Reservation.countDocuments({ resourceId: 'R104' });
    expect(bookingCount).toBe(0);

    // Verify availability remained 0
    const resourceAfter = await Resource.findOne({ resourceId: 'R104' });
    expect(resourceAfter.availability).toBe(0);
  });

  // T4: Base amounts ₹999, ₹1,000, and ₹1,001 (booking charge calculation)
  it('T4: Test base amounts ₹999, ₹1,000, and ₹1,001; verify charges ₹50, ₹0, and ₹0', () => {
    // Linked FR: FR4 | Linked BR: BR4
    // Fare rule: bookingCharge = 50 when baseAmount < 1000; otherwise 0
    const fare999 = calculateFare(999, 1);
    expect(fare999.baseAmount).toBe(999);
    expect(fare999.bookingCharge).toBe(50);
    expect(fare999.grandTotal).toBe(1049);

    const fare1000 = calculateFare(1000, 1);
    expect(fare1000.baseAmount).toBe(1000);
    expect(fare1000.bookingCharge).toBe(0);
    expect(fare1000.grandTotal).toBe(1000);

    const fare1001 = calculateFare(1001, 1);
    expect(fare1001.baseAmount).toBe(1001);
    expect(fare1001.bookingCharge).toBe(0);
    expect(fare1001.grandTotal).toBe(1001);
  });

  // T5: Make one valid booking and verify reference, CONFIRMED, fare snapshot, reduced capacity, history
  it('T5: Make one valid booking and verify unique reference, CONFIRMED status, fare snapshot, reduced capacity, and initial history', async () => {
    // Linked FR: FR4, FR5 | Linked BR: BR3, BR4, BR7
    // R105 has rate 1000, initial availability 3
    const initialRes = await Resource.findOne({ resourceId: 'R105' });
    expect(initialRes.availability).toBe(3);

    const payload = {
      resourceId: 'R105',
      quantity: 2,
      candidateName: 'Alice Johnson',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1005',
      bookingDate: '2026-10-25',
    };

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(payload);

    expect(res.status).toBe(201);
    const data = res.body.data;

    // 1. Unique booking reference
    expect(data.reservation.bookingReference).toMatch(/^EXM-[A-Z0-9]{6}$/);

    // 2. CONFIRMED status
    expect(data.reservation.status).toBe(RESERVATION_STATUS.CONFIRMED);

    // 3. Fare snapshot: rate 1000 * 2 = 2000, charge = 0, total = 2000
    expect(data.item.unitRateSnapshot).toBe(1000);
    expect(data.item.baseAmount).toBe(2000);
    expect(data.item.bookingCharge).toBe(0);
    expect(data.item.grandTotal).toBe(2000);

    // 4. Reduced capacity: 3 - 2 = 1
    const updatedRes = await Resource.findOne({ resourceId: 'R105' });
    expect(updatedRes.availability).toBe(1);

    // 5. Initial history entry
    const history = await BookingStatusHistory.find({
      referenceId: data.reservation.bookingReference,
    });
    expect(history.length).toBe(1);
    expect(history[0].newStatus).toBe(RESERVATION_STATUS.CONFIRMED);
    expect(history[0].oldStatus).toBeNull();
  });

  // T6: Submit missing or invalid booking details (blank name, invalid phone)
  it('T6: Submit missing or invalid booking details; verify no reservation, no history, and no capacity change', async () => {
    // Linked FR: FR4 | Linked BR: BR5, BR6
    const resInitial = await Resource.findOne({ resourceId: 'R101' });
    const availBefore = resInitial.availability;

    // Case A: Blank candidate name
    const invalidNamePayload = {
      resourceId: 'R101',
      quantity: 1,
      candidateName: '   ',
      candidatePhone: '9876543210',
      candidateIdRef: 'STU-1006',
      bookingDate: '2026-10-25',
    };

    const resA = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(invalidNamePayload);

    expect(resA.status).toBe(400);

    // Case B: Non-10-digit phone number (9 digits)
    const invalidPhonePayload = {
      resourceId: 'R101',
      quantity: 1,
      candidateName: 'Alice Johnson',
      candidatePhone: '123456789',
      candidateIdRef: 'STU-1006',
      bookingDate: '2026-10-25',
    };

    const resB = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send(invalidPhonePayload);

    expect(resB.status).toBe(400);

    // Verify zero reservations created for this candidateIdRef
    const count = await Reservation.countDocuments({ candidateIdRef: 'STU-1006' });
    expect(count).toBe(0);

    // Verify capacity did not change
    const resAfter = await Resource.findOne({ resourceId: 'R101' });
    expect(resAfter.availability).toBe(availBefore);

    // Verify no stray history records
    const historyCount = await BookingStatusHistory.countDocuments({ actorId: user1Doc._id });
    expect(historyCount).toBe(0);
  });

  // T7: Select a slot, consume capacity via another request, stale request rejected
  it('T7: Slot capacity consumed before confirmation; stale request rejected without partial updates', async () => {
    // Linked FR: FR3, FR4 | Linked BR: BR2, BR6, BR7
    // R102 has initial availability: 5
    // Request 1 takes 4 seats
    const res1 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resourceId: 'R102',
        quantity: 4,
        candidateName: 'Alice Johnson',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-1007-A',
        bookingDate: '2026-10-26',
      });
    expect(res1.status).toBe(201);

    // Now remaining availability is 1. Another concurrent/stale request attempts to book 2 seats
    const res2 = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        resourceId: 'R102',
        quantity: 2,
        candidateName: 'Bob Smith',
        candidatePhone: '9876543211',
        candidateIdRef: 'STU-1007-B',
        bookingDate: '2026-10-26',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);

    // Verify remaining capacity stayed exactly 1
    const resR102 = await Resource.findOne({ resourceId: 'R102' });
    expect(resR102.availability).toBe(1);

    // Verify no reservation created for user 2
    const user2Bookings = await Reservation.find({ userId: user2Doc._id });
    expect(user2Bookings.length).toBe(0);
  });

  // T8: Access control: User 1 cannot view or cancel User 2's booking and cannot advance status
  it("T8: Verify User 1 cannot view or cancel User 2's booking and cannot advance operational statuses", async () => {
    // Linked FR: FR6, FR8, FR10 | Linked BR: BR8, BR10
    // User 2 creates a booking
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        resourceId: 'R103',
        quantity: 1,
        candidateName: 'Bob Smith',
        candidatePhone: '9876543211',
        candidateIdRef: 'STU-1008',
        bookingDate: '2026-10-27',
      });
    expect(createRes.status).toBe(201);
    const bookingId = createRes.body.data.reservation._id;
    const bookingRef = createRes.body.data.reservation.bookingReference;

    // 1. User 1 attempts to view User 2's booking -> 403 Forbidden
    const viewRes = await request(app)
      .get(`/api/reservations/${bookingRef}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(viewRes.status).toBe(403);

    // 2. User 1 attempts to cancel User 2's booking -> 403 Forbidden
    const cancelRes = await request(app)
      .post(`/api/reservations/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(cancelRes.status).toBe(403);

    // 3. User 1 attempts to advance operational status via admin endpoint -> 403 Forbidden
    const adminAdvanceRes = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ status: RESERVATION_STATUS.CHECKED_IN });
    expect(adminAdvanceRes.status).toBe(403);

    // Booking status must still be CONFIRMED
    const intactBooking = await Reservation.findById(bookingId);
    expect(intactBooking.status).toBe(RESERVATION_STATUS.CONFIRMED);
  });

  // T9: Administrator status progression (CONFIRMED -> CHECKED_IN -> COMPLETED) and rejection of invalid jumps
  it('T9: Verify valid administrator status progression and rejection of skipped, repeated, or terminal transitions', async () => {
    // Linked FR: FR8, FR9 | Linked BR: BR8
    // User 1 creates booking
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resourceId: 'R101',
        quantity: 1,
        candidateName: 'Alice Johnson',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-1009',
        bookingDate: '2026-10-25',
      });
    const bookingId = createRes.body.data.reservation._id;

    // Step A: Attempt to SKIP stage (CONFIRMED -> COMPLETED directly) -> 400 Bad Request
    const skipRes = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: RESERVATION_STATUS.COMPLETED });
    expect(skipRes.status).toBe(400);
    expect(skipRes.body.message).toContain('Invalid transition');

    // Step B: Valid transition (CONFIRMED -> CHECKED_IN) -> 200 OK
    const step1Res = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: RESERVATION_STATUS.CHECKED_IN });
    expect(step1Res.status).toBe(200);
    expect(step1Res.body.reservation.status).toBe(RESERVATION_STATUS.CHECKED_IN);

    // Step C: Repeated transition (CHECKED_IN -> CHECKED_IN) -> 400 Bad Request
    const repeatRes = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: RESERVATION_STATUS.CHECKED_IN });
    expect(repeatRes.status).toBe(400);

    // Step D: Valid transition to terminal (CHECKED_IN -> COMPLETED) -> 200 OK
    const step2Res = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: RESERVATION_STATUS.COMPLETED });
    expect(step2Res.status).toBe(200);
    expect(step2Res.body.reservation.status).toBe(RESERVATION_STATUS.COMPLETED);

    // Step E: Attempt to transition out of terminal COMPLETED -> 400 Bad Request
    const terminalRes = await request(app)
      .patch(`/api/admin/reservations/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: RESERVATION_STATUS.CHECKED_IN });
    expect(terminalRes.status).toBe(400);
    expect(terminalRes.body.message).toContain('terminal');
  });

  // T10: Cancellation restores capacity once; repeated cancellation fails without extra capacity restore
  it('T10: Cancel an eligible booking, verify capacity restoration once, and confirm second cancellation fails', async () => {
    // Linked FR: FR6 | Linked BR: BR9
    // R105 has initial availability 3
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resourceId: 'R105',
        quantity: 2,
        candidateName: 'Alice Johnson',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-1010',
        bookingDate: '2026-10-25',
      });
    const bookingId = createRes.body.data.reservation._id;

    // After booking, capacity is 3 - 2 = 1
    const resAfterBook = await Resource.findOne({ resourceId: 'R105' });
    expect(resAfterBook.availability).toBe(1);

    // First cancellation -> 200 OK, capacity restored: 1 + 2 = 3
    const cancel1Res = await request(app)
      .post(`/api/reservations/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(cancel1Res.status).toBe(200);
    expect(cancel1Res.body.data.reservation.status).toBe(RESERVATION_STATUS.CANCELLED);

    const resAfterCancel1 = await Resource.findOne({ resourceId: 'R105' });
    expect(resAfterCancel1.availability).toBe(3);

    // Second cancellation -> Must fail (400)
    const cancel2Res = await request(app)
      .post(`/api/reservations/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(cancel2Res.status).toBe(400);

    // Verify capacity was NOT incremented again (must still be 3, not 5!)
    const resAfterCancel2 = await Resource.findOne({ resourceId: 'R105' });
    expect(resAfterCancel2.availability).toBe(3);
  });

  // T11: Persistence across reconnection / server restart
  it('T11: Verify database persistence after disconnecting and reconnecting to MongoDB', async () => {
    // Linked FR: FR5 | Linked BR: BR7
    // Create a confirmed booking
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resourceId: 'R103',
        quantity: 3,
        candidateName: 'Alice Johnson Persistence Test',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-1011-PERSIST',
        bookingDate: '2026-10-27',
      });
    const bookingRef = createRes.body.data.reservation.bookingReference;

    // Simulate server restart by disconnecting and reconnecting database connection
    await disconnectDB();
    expect(mongoose.connection.readyState).toBe(0);

    await connectDB(TEST_DB_URI);
    expect(mongoose.connection.readyState).toBe(1);

    // Query persisted reservation and item directly
    const persistedReservation = await Reservation.findOne({ bookingReference: bookingRef });
    expect(persistedReservation).not.toBeNull();
    expect(persistedReservation.candidateName).toBe('Alice Johnson Persistence Test');
    expect(persistedReservation.status).toBe(RESERVATION_STATUS.CONFIRMED);

    const persistedItem = await ReservationItem.findOne({ bookingReference: bookingRef });
    expect(persistedItem).not.toBeNull();
    expect(persistedItem.quantity).toBe(3);
  });

  // T12: Change resource rate after booking; historical booking saved rate and total remain unchanged
  it("T12: Change a resource's rate after booking and verify historical booking's saved rate and total remain unchanged", async () => {
    // Linked FR: FR4, FR7 | Linked BR: BR3, BR4
    // R101 initial rate: 499
    const createRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        resourceId: 'R101',
        quantity: 2,
        candidateName: 'Alice Johnson Historical Fare',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-1012',
        bookingDate: '2026-10-25',
      });

    const bookingRef = createRes.body.data.reservation.bookingReference;
    // Initial fare: rate 499 * 2 = 998, charge = 50, grandTotal = 1048
    const originalItem = createRes.body.data.item;
    expect(originalItem.unitRateSnapshot).toBe(499);
    expect(originalItem.baseAmount).toBe(998);
    expect(originalItem.bookingCharge).toBe(50);
    expect(originalItem.grandTotal).toBe(1048);

    // Admin updates resource rate to ₹850
    const updateRateRes = await request(app)
      .patch('/api/resources/R101/rate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rate: 850 });
    expect(updateRateRes.status).toBe(200);

    // Verify resource has new rate
    const updatedResource = await Resource.findOne({ resourceId: 'R101' });
    expect(updatedResource.rate).toBe(850);

    // Query historical booking details via API
    const bookingDetailsRes = await request(app)
      .get(`/api/reservations/${bookingRef}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(bookingDetailsRes.status).toBe(200);

    const historicalItem = bookingDetailsRes.body.data.item;
    // Saved snapshots must be completely preserved!
    expect(historicalItem.unitRateSnapshot).toBe(499);
    expect(historicalItem.baseAmount).toBe(998);
    expect(historicalItem.bookingCharge).toBe(50);
    expect(historicalItem.grandTotal).toBe(1048);
  });
});
