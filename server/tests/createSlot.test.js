import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Resource } from '../src/models/Resource.js';
import { Schedule } from '../src/models/Schedule.js';
import { Reservation, RESERVATION_STATUS } from '../src/models/Reservation.js';
import { ReservationItem } from '../src/models/ReservationItem.js';
import { BookingStatusHistory } from '../src/models/BookingStatusHistory.js';
import { EXACT_SEED_RESOURCES } from '../src/scripts/seed.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/examease_create_slot_test_db';

describe('Admin Portal — Create Examination Slot Feature', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let candidateUser;

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
    } catch {
      // Ignore disconnect cleanup
    }
  });

  beforeEach(async () => {
    // Reset test collections
    await Reservation.deleteMany({});
    await ReservationItem.deleteMany({});
    await BookingStatusHistory.deleteMany({});
    await Schedule.deleteMany({});
    await Resource.deleteMany({});
    await User.deleteMany({});

    // Seed test users
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('DemoPass123!', salt);

    adminUser = await User.create({
      name: 'Dr. Evelyn Vance (Admin)',
      email: 'admin@examease.demo',
      password: hash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    candidateUser = await User.create({
      name: 'Alice Johnson (Candidate)',
      email: 'user1@examease.demo',
      password: hash,
      role: 'USER',
      status: 'ACTIVE',
    });

    // Seed standard resources R101 - R105
    for (const res of EXACT_SEED_RESOURCES) {
      await Resource.create({ ...res });
    }

    // Authenticate and get JWT tokens
    const adminLoginRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'admin@examease.demo' });
    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ email: 'user1@examease.demo' });
    userToken = userLoginRes.body.token;
  });

  // 1. Successful Slot Creation by Administrator
  it('should allow an Administrator to create a new examination slot with permanent MongoDB persistence', async () => {
    const payload = {
      resourceId: 'R106',
      name: 'Exam Slot F (Cloud Native Systems)',
      category: 'Database Systems & Cloud Engineering SAT II',
      examDate: '2026-11-15',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      venue: 'Virtual Assessment Hall 5 (Proctored)',
      availability: 12,
      rate: 750,
    };

    const res = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.slot.resourceId).toBe('R106');
    expect(res.body.slot.name).toBe('Exam Slot F (Cloud Native Systems)');
    expect(res.body.slot.availability).toBe(12);
    expect(res.body.slot.rate).toBe(750);
    expect(res.body.slot.schedule.examDate).toBe('2026-11-15');
    expect(res.body.slot.schedule.venue).toBe('Virtual Assessment Hall 5 (Proctored)');

    // Verify persisted directly in MongoDB
    const persistedResource = await Resource.findOne({ resourceId: 'R106' });
    expect(persistedResource).not.toBeNull();
    expect(persistedResource.availability).toBe(12);
    expect(persistedResource.rate).toBe(750);
    expect(persistedResource.status).toBe('ACTIVE');

    const persistedSchedule = await Schedule.findOne({ resourceId: 'R106' });
    expect(persistedSchedule).not.toBeNull();
    expect(persistedSchedule.examDate).toBe('2026-11-15');
    expect(persistedSchedule.startTime).toBe('10:00 AM');
  });

  // 2. Next suggested Slot ID endpoint
  it('should auto-suggest the next unique Slot ID (e.g. R106)', async () => {
    // Initial max is R105 -> should suggest R106
    const res1 = await request(app)
      .get('/api/admin/slots/next-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.nextSlotId).toBe('R106');

    // Create R106
    await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resourceId: 'R106',
        name: 'Slot F',
        category: 'Computer Science',
        examDate: '2026-11-01',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        venue: 'Lab F',
        availability: 10,
        rate: 500,
      });

    // Next suggestion should now be R107
    const res2 = await request(app)
      .get('/api/admin/slots/next-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res2.status).toBe(200);
    expect(res2.body.nextSlotId).toBe('R107');
  });

  // 3. Validation Errors on Invalid Data
  it('should reject slot creation when required fields are missing or invalid', async () => {
    const validBase = {
      resourceId: 'R107',
      name: 'Valid Name',
      category: 'General',
      examDate: '2026-11-01',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      venue: 'Lab',
      availability: 10,
      rate: 500,
    };

    // Case A: Missing examination name
    const resA = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, name: '' });
    expect(resA.status).toBe(400);

    // Case B: Zero seat capacity
    const resB = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, availability: 0 });
    expect(resB.status).toBe(400);

    // Case C: Negative seat capacity
    const resC = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, availability: -5 });
    expect(resC.status).toBe(400);

    // Case D: Non-integer seat capacity (decimal)
    const resD = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, availability: 7.5 });
    expect(resD.status).toBe(400);

    // Case E: Negative registration fee
    const resE = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, rate: -100 });
    expect(resE.status).toBe(400);

    // Case F: Missing exam date
    const resF = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validBase, examDate: '' });
    expect(resF.status).toBe(400);
  });

  // 4. Duplicate Slot ID Rejection
  it('should reject creation if the Slot ID already exists (duplicate key)', async () => {
    // R101 already exists in seed data
    const res = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resourceId: 'R101',
        name: 'Duplicate Slot Attempt',
        category: 'General',
        examDate: '2026-11-01',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        venue: 'Lab',
        availability: 10,
        rate: 500,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already exists");

    // Ensure R101 name was not mutated
    const r101 = await Resource.findOne({ resourceId: 'R101' });
    expect(r101.name).toBe('Exam Slot A');
  });

  // 5. Unauthorized Access Control
  it('should reject unauthorized attempts to create examination slots', async () => {
    const payload = {
      resourceId: 'R108',
      name: 'Unauthorized Slot',
      category: 'General',
      examDate: '2026-11-01',
      startTime: '09:00 AM',
      endTime: '12:00 PM',
      venue: 'Lab',
      availability: 10,
      rate: 500,
    };

    // Unauthenticated (no token) -> 401
    const resNoAuth = await request(app)
      .post('/api/admin/slots')
      .send(payload);
    expect(resNoAuth.status).toBe(401);

    // Candidate token (role: USER) -> 403 Forbidden
    const resUser = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);
    expect(resUser.status).toBe(403);
  });

  // 6. Student Booking of Newly Created Slot
  it('should make newly created slot available on Explore Slots and allow a student to register successfully', async () => {
    // 1. Admin creates slot R106 with 5 seats at ₹800
    const createRes = await request(app)
      .post('/api/admin/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resourceId: 'R106',
        name: 'Advanced Cloud Architecture SAT II',
        category: 'Database Systems & Cloud Engineering SAT II',
        examDate: '2026-11-20',
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        venue: 'Online Proctored Lab 6',
        availability: 5,
        rate: 800,
      });
    expect(createRes.status).toBe(201);

    // 2. Student queries public slots endpoint (GET /api/resources)
    const listRes = await request(app).get('/api/resources');
    expect(listRes.status).toBe(200);
    const foundSlot = listRes.body.resources.find((r) => r.resourceId === 'R106');
    expect(foundSlot).toBeDefined();
    expect(foundSlot.name).toBe('Advanced Cloud Architecture SAT II');
    expect(foundSlot.availability).toBe(5);
    expect(foundSlot.schedule.venue).toBe('Online Proctored Lab 6');

    // 3. Student books 2 seats on R106
    // Fare: 800 * 2 = 1600 base -> bookingCharge = 0 (since >= 1000) -> grandTotal = 1600
    const bookRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId: 'R106',
        quantity: 2,
        candidateName: 'Alice Johnson',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-CLOUD-01',
        bookingDate: '2026-11-20',
      });

    expect(bookRes.status).toBe(201);
    expect(bookRes.body.data.reservation.status).toBe(RESERVATION_STATUS.CONFIRMED);
    expect(bookRes.body.data.reservation.resourceId).toBe('R106');
    expect(bookRes.body.data.item.unitRateSnapshot).toBe(800);
    expect(bookRes.body.data.item.baseAmount).toBe(1600);
    expect(bookRes.body.data.item.grandTotal).toBe(1600);

    // 4. Verify remaining availability on R106 decremented: 5 - 2 = 3
    const updatedSlot = await Resource.findOne({ resourceId: 'R106' });
    expect(updatedSlot.availability).toBe(3);

    // 5. Attempting to book 4 seats on R106 (exceeding remaining 3) should be rejected
    const overbookRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        resourceId: 'R106',
        quantity: 4,
        candidateName: 'Alice Johnson (Extra)',
        candidatePhone: '9876543210',
        candidateIdRef: 'STU-CLOUD-02',
        bookingDate: '2026-11-20',
      });

    expect(overbookRes.status).toBe(409);
    expect(overbookRes.body.success).toBe(false);

    // Verify availability remains 3
    const finalSlot = await Resource.findOne({ resourceId: 'R106' });
    expect(finalSlot.availability).toBe(3);
  });
});
