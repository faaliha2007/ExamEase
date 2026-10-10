import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { Schedule } from '../models/Schedule.js';

export const EXACT_SEED_RESOURCES = [
  {
    resourceId: 'R101',
    name: 'Exam Slot A',
    category: 'Computer Science & Engineering SAT II',
    rate: 499,
    availability: 10,
    status: 'ACTIVE',
  },
  {
    resourceId: 'R102',
    name: 'Exam Slot B',
    category: 'Advanced Data Structures & Algorithms SAT II',
    rate: 799,
    availability: 5,
    status: 'ACTIVE',
  },
  {
    resourceId: 'R103',
    name: 'Exam Slot C',
    category: 'General Engineering Aptitude SAT II',
    rate: 199,
    availability: 20,
    status: 'ACTIVE',
  },
  {
    resourceId: 'R104',
    name: 'Exam Slot D',
    category: 'Full-Stack Software Architecture SAT II',
    rate: 1299,
    availability: 0,
    status: 'ACTIVE',
  },
  {
    resourceId: 'R105',
    name: 'Exam Slot E',
    category: 'Database Systems & Cloud Engineering SAT II',
    rate: 1000,
    availability: 3,
    status: 'ACTIVE',
  },
];

export const SYNTHETIC_SCHEDULES = [
  {
    scheduleId: 'SCH-R101-01',
    resourceId: 'R101',
    examDate: '2026-10-25',
    startTime: '09:00 AM',
    endTime: '12:00 PM',
    category: 'Computer Science & Engineering SAT II',
    venue: 'Online Proctored Hall 1 (Demo Environment)',
    status: 'SCHEDULED',
    isDemoData: true,
  },
  {
    scheduleId: 'SCH-R102-01',
    resourceId: 'R102',
    examDate: '2026-10-26',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    category: 'Advanced Data Structures & Algorithms SAT II',
    venue: 'Online Proctored Hall 2 (Demo Environment)',
    status: 'SCHEDULED',
    isDemoData: true,
  },
  {
    scheduleId: 'SCH-R103-01',
    resourceId: 'R103',
    examDate: '2026-10-27',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    category: 'General Engineering Aptitude SAT II',
    venue: 'Virtual Assessment Lab C (Demo Environment)',
    status: 'SCHEDULED',
    isDemoData: true,
  },
  {
    scheduleId: 'SCH-R104-01',
    resourceId: 'R104',
    examDate: '2026-10-28',
    startTime: '09:30 AM',
    endTime: '12:30 PM',
    category: 'Full-Stack Software Architecture SAT II',
    venue: 'Capacity Exhausted Lab D (Demo Environment)',
    status: 'SCHEDULED',
    isDemoData: true,
  },
  {
    scheduleId: 'SCH-R105-01',
    resourceId: 'R105',
    examDate: '2026-10-29',
    startTime: '03:00 PM',
    endTime: '06:00 PM',
    category: 'Database Systems & Cloud Engineering SAT II',
    venue: 'Virtual Cloud Lab E (Demo Environment)',
    status: 'SCHEDULED',
    isDemoData: true,
  },
];

export const DEMO_USERS = [
  {
    name: 'Alice Johnson (Candidate 1)',
    email: 'user1@examease.demo',
    passwordRaw: 'DemoUser123!',
    role: 'USER',
    status: 'ACTIVE',
  },
  {
    name: 'Bob Smith (Candidate 2)',
    email: 'user2@examease.demo',
    passwordRaw: 'DemoUser123!',
    role: 'USER',
    status: 'ACTIVE',
  },
  {
    name: 'Dr. Evelyn Vance (Exam Controller)',
    email: 'admin@examease.demo',
    passwordRaw: 'DemoAdmin123!',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
];

export const seedDatabase = async ({ isReset = false } = {}) => {
  await connectDB();
  console.log(`[Seed] Starting ${isReset ? 'database RESET & seed' : 'idempotent seed'}...`);

  // 1. Seed Demo Users
  const salt = await bcrypt.genSalt(10);
  for (const demoUser of DEMO_USERS) {
    const existing = await User.findOne({ email: demoUser.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(demoUser.passwordRaw, salt);
      await User.create({
        name: demoUser.name,
        email: demoUser.email,
        password: hashedPassword,
        role: demoUser.role,
        status: demoUser.status,
      });
      console.log(`[Seed] Created demo user: ${demoUser.email} (${demoUser.role})`);
    } else {
      console.log(`[Seed] Demo user already exists: ${demoUser.email} (preserved)`);
    }
  }

  // 2. Seed Resources (Idempotent: preserve if exists, insert if missing)
  for (const item of EXACT_SEED_RESOURCES) {
    const existing = await Resource.findOne({ resourceId: item.resourceId });
    if (!existing) {
      await Resource.create(item);
      console.log(`[Seed] Created resource ${item.resourceId} (${item.name}) - Rate: ₹${item.rate}, Availability: ${item.availability}`);
    } else if (isReset) {
      // If explicit reset requested, restore exact initial seed state
      existing.rate = item.rate;
      existing.availability = item.availability;
      existing.status = item.status;
      existing.category = item.category;
      existing.name = item.name;
      await existing.save();
      console.log(`[Seed] Reset resource ${item.resourceId} to initial rate ₹${item.rate} and availability ${item.availability}`);
    } else {
      console.log(`[Seed] Resource ${item.resourceId} exists. Preserving current availability: ${existing.availability}`);
    }
  }

  // 3. Seed Realistic Synthetic Schedules (labeled as demo data)
  for (const sch of SYNTHETIC_SCHEDULES) {
    const existing = await Schedule.findOne({ scheduleId: sch.scheduleId });
    if (!existing) {
      await Schedule.create(sch);
      console.log(`[Seed] Created schedule: ${sch.scheduleId} for ${sch.resourceId} (Demo Data)`);
    } else if (isReset) {
      await Schedule.updateOne({ scheduleId: sch.scheduleId }, sch);
    }
  }

  console.log('[Seed] Database seeding completed successfully.');
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Error]', err);
      await disconnectDB();
      process.exit(1);
    });
}
