// MOCK check-in desk service — deliberately named differently from the real
// src/lib/checkinService.js (Supabase-backed) to avoid any import confusion.
// Not connected to Supabase; the real /check-in path is untouched.
import { mockCheckins } from '../data/mock/checkins';
import { mockBookings } from '../data/mock/bookings';
import { mockEvents } from '../data/mock/events';
import { bookingService } from './bookingService';

export const mockCheckinService = {
  search(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return mockBookings
      .filter((b) => b.status !== 'cancelled')
      .filter(
        (b) =>
          b.registrationCode.toLowerCase().includes(q) ||
          b.attendeeName.toLowerCase().includes(q) ||
          b.attendeeEmail.toLowerCase().includes(q)
      )
      .map((b) => ({ ...b, event: mockEvents.find((e) => e.id === b.eventId) }));
  },

  checkIn: (codeOrId) => bookingService.checkIn(codeOrId),
  undoCheckIn: (codeOrId) => bookingService.undoCheckIn(codeOrId),

  getStatsForEvent(eventId) {
    const bookings = mockBookings.filter((b) => b.eventId === eventId && b.status !== 'cancelled');
    const totalAttendees = bookings.reduce((sum, b) => sum + b.quantity, 0);
    const checkedInBookings = bookings.filter((b) => b.checkedIn);
    const checkedIn = checkedInBookings.reduce((sum, b) => sum + b.quantity, 0);
    return {
      totalAttendees,
      checkedIn,
      remaining: totalAttendees - checkedIn,
      checkInRate: totalAttendees ? Math.round((checkedIn / totalAttendees) * 100) : 0,
    };
  },

  getRecentCheckins(limit = 10) {
    return mockCheckins.slice(0, limit);
  },
};
