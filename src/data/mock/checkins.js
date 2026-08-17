// Mock check-in ledger — derived events from bookings.checkedIn, but kept as
// its own append-only log so the Check-In desk has a real audit trail
// (who checked in whom, and when) independent of the booking record itself.
import { loadOrSeed, persist } from './store';
import { mockBookings } from './bookings';

function buildSeed() {
  return mockBookings
    .filter((b) => b.checkedIn)
    .map((b, i) => ({
      id: `chk-${String(i + 1).padStart(3, '0')}`,
      bookingId: b.id,
      registrationCode: b.registrationCode,
      eventId: b.eventId,
      attendeeName: b.attendeeName,
      quantity: b.quantity,
      checkedInAt: b.checkedInAt,
      checkedInBy: 'Front Desk',
    }));
}

export const mockCheckins = loadOrSeed('checkins', buildSeed);
export const saveCheckins = () => persist('checkins', mockCheckins);
