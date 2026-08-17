// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockBookings, saveBookings, getBookingsForUser, getBookingByCode } from '../data/mock/bookings';
import { mockCheckins, saveCheckins } from '../data/mock/checkins';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TNGY-${new Date().getFullYear()}-${code}`;
}

export const bookingService = {
  getAll: () => mockBookings,
  getForUser: (userId) => getBookingsForUser(userId),
  getByCode: (code) => getBookingByCode(code),
  getById: (id) => mockBookings.find((b) => b.id === id),

  create({ userId, eventId, attendeeName, attendeeEmail, quantity, amount, ticketType }) {
    const booking = {
      id: `bkg-${Date.now()}`,
      userId,
      eventId,
      registrationCode: generateCode(),
      attendeeName,
      attendeeEmail,
      quantity,
      ticketType: ticketType || (quantity > 1 ? 'Group' : 'Standard'),
      amount,
      paymentStatus: 'paid',
      status: 'confirmed',
      checkedIn: false,
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };
    mockBookings.unshift(booking);
    saveBookings();
    return booking;
  },

  updateStatus(id, status) {
    const b = mockBookings.find((x) => x.id === id);
    if (!b) return null;
    b.status = status;
    if (status === 'refunded') b.paymentStatus = 'refunded';
    saveBookings();
    return b;
  },

  checkIn(codeOrId, checkedInBy = 'Front Desk') {
    const b = mockBookings.find((x) => x.id === codeOrId || x.registrationCode.toLowerCase() === String(codeOrId).toLowerCase());
    if (!b) return { success: false, error: 'No booking found for that registration code.' };
    if (b.checkedIn) return { success: false, error: 'ALREADY CHECKED IN', booking: b, alreadyCheckedIn: true };
    b.checkedIn = true;
    b.checkedInAt = new Date().toISOString();
    saveBookings();
    mockCheckins.unshift({
      id: `chk-${Date.now()}`,
      bookingId: b.id,
      registrationCode: b.registrationCode,
      eventId: b.eventId,
      attendeeName: b.attendeeName,
      quantity: b.quantity,
      checkedInAt: b.checkedInAt,
      checkedInBy,
    });
    saveCheckins();
    return { success: true, booking: b };
  },

  undoCheckIn(codeOrId) {
    const b = mockBookings.find((x) => x.id === codeOrId || x.registrationCode.toLowerCase() === String(codeOrId).toLowerCase());
    if (!b) return { success: false, error: 'No booking found.' };
    b.checkedIn = false;
    b.checkedInAt = null;
    saveBookings();
    const idx = mockCheckins.findIndex((c) => c.bookingId === b.id);
    if (idx !== -1) mockCheckins.splice(idx, 1);
    saveCheckins();
    return { success: true, booking: b };
  },
};
