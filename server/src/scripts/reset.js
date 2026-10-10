import { connectDB, disconnectDB } from '../config/db.js';
import { Reservation } from '../models/Reservation.js';
import { ReservationItem } from '../models/ReservationItem.js';
import { BookingStatusHistory } from '../models/BookingStatusHistory.js';
import { seedDatabase } from './seed.js';

export const resetDatabase = async () => {
  await connectDB();
  console.log('[Reset] Performing explicit database reset...');

  // Clear existing operational transaction records
  await Reservation.deleteMany({});
  await ReservationItem.deleteMany({});
  await BookingStatusHistory.deleteMany({});
  console.log('[Reset] Cleared all reservations, reservation items, and booking status histories.');

  // Reset resources and demo users
  await seedDatabase({ isReset: true });
  console.log('[Reset] Database successfully restored to pristine initial seed state.');
};

if (process.argv[1]?.endsWith('reset.js')) {
  resetDatabase()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Reset Error]', err);
      await disconnectDB();
      process.exit(1);
    });
}
