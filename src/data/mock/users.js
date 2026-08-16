// Mock patron/user accounts — for the NEW mock account-creation flow only.
// Does not touch the existing real Supabase-backed patron login/session.
export const mockUsers = [
  {
    id: 'usr-001',
    role: 'patron',
    fullName: 'Ananya Reddy',
    email: 'ananya@example.com',
    passportId: 'TS-PASS-2201',
    memberSince: '2023-11-02',
    stampsCount: 6,
    savedSessions: ['evt-vol4', 'evt-solstice27'],
    createdAt: '2023-11-02T10:00:00Z',
  },
  {
    id: 'usr-002',
    role: 'patron',
    fullName: 'Vikram Rao',
    email: 'vikram@example.com',
    passportId: 'TS-PASS-1187',
    memberSince: '2022-06-14',
    stampsCount: 11,
    savedSessions: ['evt-monsoon27'],
    createdAt: '2022-06-14T10:00:00Z',
  },
];

export function findUserByEmail(email) {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
