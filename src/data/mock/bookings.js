// Mock ticket bookings — single source of truth shared by patron dashboards,
// admin Bookings/Overview, and the mock Check-In desk.
import { loadOrSeed, persist } from './store';

const NAMES = [
  ['Ananya Reddy', 'ananya@example.com', 'usr-001'],
  ['Vikram Rao', 'vikram@example.com', 'usr-002'],
  ['Priya Nair', 'priya.nair@example.com', 'usr-003'],
  ['Arjun Mehta', 'arjun.mehta@example.com', 'usr-004'],
  ['Sanjana Iyer', 'sanjana.iyer@example.com', 'usr-005'],
  ['Rahul Verma', 'rahul.verma@example.com', null],
  ['Divya Krishnan', 'divya.krishnan@example.com', null],
  ['Karthik Subramaniam', 'karthik.s@example.com', null],
  ['Neha Bansal', 'neha.bansal@example.com', null],
  ['Amit Joshi', 'amit.joshi@example.com', null],
  ['Sneha Kapoor', 'sneha.kapoor@example.com', null],
  ['Rohan Malhotra', 'rohan.malhotra@example.com', null],
  ['Tanvi Shah', 'tanvi.shah@example.com', null],
  ['Varun Chowdary', 'varun.chowdary@example.com', null],
  ['Meghana Rao', 'meghana.rao@example.com', null],
];

const EVENTS = ['evt-vol4', 'evt-solstice27', 'evt-monsoon27', 'evt-vol3', 'evt-vol2', 'evt-vol1'];
const PRICES = { 'evt-vol4': 899, 'evt-solstice27': 1499, 'evt-monsoon27': 799, 'evt-vol3': 899, 'evt-vol2': 999, 'evt-vol1': 799 };

function code(i) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let s = '';
  for (let n = 0; n < 6; n++) s += chars[(i * 7 + n * 13) % chars.length];
  return `TNGY-2026-${String(i).padStart(5, '0')}`;
}

function buildSeed() {
  return NAMES.map(([name, email, userId], i) => {
    const eventId = EVENTS[i % EVENTS.length];
    const quantity = (i % 3) + 1;
    const isPast = eventId === 'evt-vol3' || eventId === 'evt-vol2' || eventId === 'evt-vol1';
    const checkedIn = isPast ? i % 4 !== 0 : i % 5 === 0;
    return {
      id: `bkg-${String(i + 1).padStart(3, '0')}`,
      userId,
      eventId,
      registrationCode: code(i + 100),
      attendeeName: name,
      attendeeEmail: email,
      quantity,
      ticketType: quantity > 1 ? 'Group' : 'Standard',
      amount: PRICES[eventId] * quantity,
      paymentStatus: i % 11 === 0 ? 'refunded' : 'paid',
      status: i % 13 === 0 ? 'cancelled' : 'confirmed',
      checkedIn,
      checkedInAt: checkedIn ? new Date(2026, 7, 15, 18, 30 + i).toISOString() : null,
      createdAt: new Date(2026, 6, 1 + i, 10, 0).toISOString(),
    };
  });
}

export const mockBookings = loadOrSeed('bookings', buildSeed);
export const saveBookings = () => persist('bookings', mockBookings);

export function getBookingsForUser(userId) {
  return mockBookings.filter((b) => b.userId === userId);
}
export function getBookingByCode(code) {
  return mockBookings.find((b) => b.registrationCode.toLowerCase() === String(code).toLowerCase());
}
