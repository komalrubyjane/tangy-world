// MOCK service — part of the new mock account/dashboard/AI system.
// Not connected to Supabase. Swap the internals for real calls later
// without changing any component that imports this file.
import { mockBookings, getBookingsForUser } from '../data/mock/bookings';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TS-MOCK-${code}`;
}

export const bookingService = {
  getForUser: (userId) => getBookingsForUser(userId),
  create({ userId, eventId, attendeeName, quantity, amount }) {
    const booking = {
      id: `bkg-${Date.now()}`,
      userId,
      eventId,
      registrationCode: generateCode(),
      attendeeName,
      quantity,
      amount,
      status: 'confirmed',
      checkedIn: false,
      createdAt: new Date().toISOString(),
    };
    mockBookings.push(booking);
    return booking;
  },
  getAll: () => mockBookings,
};
