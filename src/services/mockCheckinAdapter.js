// Adapts the mock check-in desk service (mockCheckinService/bookingService —
// flat, camelCase mock data) to the same async, snake_case, relationally
// shaped interface as the REAL src/lib/checkinService.js (Supabase-backed),
// so TangyWorldCheckInPage.jsx's UI needs no per-field branching — it just
// picks which service object to call based on isMockAuth.
import { mockCheckinService } from './mockCheckinService';
import { mockBookings } from '../data/mock/bookings';
import { mockEvents } from '../data/mock/events';
import { mockCheckins } from '../data/mock/checkins';

function toApiBooking(b) {
  if (!b) return null;
  const event = mockEvents.find((e) => e.id === b.eventId);
  return {
    id: b.id,
    registration_code: b.registrationCode,
    attendee_name: b.attendeeName,
    attendee_email: b.attendeeEmail,
    attendee_phone: '',
    quantity: b.quantity,
    status: b.status,
    event_id: b.eventId,
    events: event ? { id: event.id, name: event.name, event_date: event.date, venue: event.venue } : null,
    checkins: b.checkedIn ? [{ id: `chk-${b.id}`, checked_in_at: b.checkedInAt }] : [],
  };
}

export const mockCheckinAdapter = {
  async lookupByCode(code, eventId) {
    const normalized = (code || '').trim();
    const b = mockBookings.find((x) => x.registrationCode.toLowerCase() === normalized.toLowerCase());
    if (!b) return { found: false };
    if (eventId && b.eventId !== eventId) return { found: true, booking: toApiBooking(b), wrongEvent: true };
    return { found: true, booking: toApiBooking(b), alreadyCheckedIn: !!b.checkedIn };
  },

  async searchBookings(query, eventId) {
    const results = mockCheckinService.search(query);
    return results.filter((b) => !eventId || b.eventId === eventId).map(toApiBooking);
  },

  async checkIn(bookingId, _eventId, _staffUserId) {
    const res = mockCheckinService.checkIn(bookingId);
    if (!res.success) {
      return { success: false, alreadyCheckedIn: !!res.alreadyCheckedIn, error: res.error };
    }
    return { success: true, checkin: { id: `chk-${res.booking.id}`, checked_in_at: res.booking.checkedInAt } };
  },

  async getStats(eventId) {
    if (!eventId) return { totalAttendees: 0, checkedIn: 0 };
    const s = mockCheckinService.getStatsForEvent(eventId);
    return { totalAttendees: s.totalAttendees, checkedIn: s.checkedIn };
  },

  async getRecentCheckins(eventId, limit = 10) {
    return mockCheckins
      .filter((c) => c.eventId === eventId)
      .slice(0, limit)
      .map((c) => ({ id: c.id, checked_in_at: c.checkedInAt, bookings: { registration_code: c.registrationCode, attendee_name: c.attendeeName } }));
  },
};
