import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isMockAuth } from '../config/auth';
import { bookingService as mockBookingServiceImpl } from '../services/bookingService';
import { eventService as mockEventServiceImpl } from '../services/eventService';

function generateRegistrationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TS-${code}`;
}

// The public site's session/event objects (src/data/mockData.js, via
// useEvents()) and the mock account system's own events (src/data/mock/events.js,
// via eventService — what Admin/Profile/Check-in all key off) are two
// separate hand-authored datasets with different ids. Their slugs mostly
// line up (vol-1/vol-2/vol-3), but a couple of newer sessions don't
// (solstice/solstice-2026 -> solstice-2027, monsoon-2026 -> monsoon-2027).
// This resolves whichever public session was booked to its best-matching
// mock/events.js id so the resulting booking shows up correctly attributed
// everywhere (Profile, Admin Bookings/Overview, Check-in).
function resolveMockEventId(eventIdOrSlug) {
  const all = mockEventServiceImpl.getAll();
  const bySlug = mockEventServiceImpl.getBySlug(eventIdOrSlug);
  if (bySlug) return bySlug.id;
  const base = String(eventIdOrSlug || '').split('-')[0];
  const fuzzy = base && all.find((e) => e.slug.startsWith(base));
  if (fuzzy) return fuzzy.id;
  return eventIdOrSlug;
}

function toApiBooking(mockBooking) {
  return {
    id: mockBooking.id,
    registration_code: mockBooking.registrationCode,
    user_id: mockBooking.userId,
    event_id: mockBooking.eventId,
    attendee_name: mockBooking.attendeeName,
    attendee_email: mockBooking.attendeeEmail,
    attendee_phone: mockBooking.attendeePhone || '',
    quantity: mockBooking.quantity,
    amount: mockBooking.amount,
    status: mockBooking.status,
    created_at: mockBooking.createdAt,
  };
}

export const bookingService = {
  // Creates a confirmed booking directly. Real Razorpay order creation/verification
  // needs a server-side secret key (a Supabase Edge Function), which isn't wired up
  // yet — until then this records the booking as confirmed without capturing payment,
  // so the rest of the pipeline (QR ticket, check-in, admin visibility) is fully real
  // and testable. Swap this for a payment-gated flow once the Edge Function exists.
  createBooking: async ({ userId, eventId, attendeeName, attendeeEmail, attendeePhone, quantity, amount }) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return { success: false, error: 'Ticket quantity must be between 1 and 10.' };
    }

    if (isMockAuth) {
      const mockEventId = resolveMockEventId(eventId);
      const booking = mockBookingServiceImpl.create({
        userId,
        eventId: mockEventId,
        attendeeName,
        attendeeEmail,
        quantity,
        amount,
        ticketType: quantity > 1 ? 'Group' : 'Standard',
      });
      return { success: true, booking: toApiBooking(booking) };
    }

    if (!isSupabaseConfigured) {
      return { success: false, error: 'Booking is not available right now — please try again shortly.' };
    }

    const registrationCode = generateRegistrationCode();
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        registration_code: registrationCode,
        user_id: userId,
        event_id: eventId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        quantity,
        amount,
        status: 'confirmed',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, booking: data };
  },

  getMyBookings: async (userId) => {
    if (isMockAuth) {
      const events = mockEventServiceImpl.getAll();
      return mockBookingServiceImpl.getForUser(userId).map((b) => {
        const event = events.find((e) => e.id === b.eventId);
        return {
          ...toApiBooking(b),
          events: event ? { name: event.name, event_date: event.date, venue: event.venue, image_url: event.image } : null,
        };
      });
    }
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, events(name, event_date, venue, image_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },
};
