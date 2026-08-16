// Mock artists — separate from the real Supabase `artists` table.
// Used only by the new mock account-creation / role-dashboard system.
export const mockArtists = [
  {
    id: 'art-m01',
    userId: 'usr-a01',
    name: 'Damini Bhatla',
    genre: 'Sufi / Contemporary',
    city: 'Hyderabad',
    bio: 'Bridges Sufi tradition and contemporary acoustic soul.',
    status: 'approved',
    portfolio: ['soundcloud.com/daminibhatla'],
    upcomingPerformances: ['evt-vol4'],
    pastPerformances: ['evt-vol1', 'evt-vol2'],
    availability: 'Available for bookings',
    createdAt: '2023-01-10T10:00:00Z',
  },
  {
    id: 'art-m02',
    userId: 'usr-a02',
    name: 'Kabir Collective',
    genre: 'Folk Raga',
    city: 'Hyderabad',
    bio: 'A five-piece folk ensemble reviving Telangana raga traditions.',
    status: 'pending',
    portfolio: ['instagram.com/kabircollective'],
    upcomingPerformances: [],
    pastPerformances: [],
    availability: 'Under review',
    createdAt: '2026-07-20T10:00:00Z',
  },
];
