export const mockBookings = [
  {
    id: 'bkg-001',
    userId: 'usr-001',
    eventId: 'evt-vol4',
    registrationCode: 'TS-MOCK001',
    attendeeName: 'Ananya Reddy',
    quantity: 2,
    amount: 1798,
    status: 'confirmed',
    checkedIn: false,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'bkg-002',
    userId: 'usr-002',
    eventId: 'evt-vol1',
    registrationCode: 'TS-MOCK002',
    attendeeName: 'Vikram Rao',
    quantity: 1,
    amount: 799,
    status: 'confirmed',
    checkedIn: true,
    checkedInAt: '2025-08-15T19:10:00Z',
    createdAt: '2025-08-01T10:00:00Z',
  },
];

export function getBookingsForUser(userId) {
  return mockBookings.filter((b) => b.userId === userId);
}
