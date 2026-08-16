// MOCK service — part of the new mock account/dashboard/AI system.
// Not connected to Supabase. Swap the internals for real calls later
// without changing any component that imports this file.
import { mockUsers } from '../data/mock/users';
import { mockArtists } from '../data/mock/artists';
import { mockVendors } from '../data/mock/vendors';
import { mockCrew } from '../data/mock/crew';
import { mockVolunteers } from '../data/mock/volunteers';
import { mockSponsors } from '../data/mock/sponsors';
import { mockVenueHosts } from '../data/mock/venues';

const TABLES = {
  patron: mockUsers,
  artist: mockArtists,
  vendor: mockVendors,
  crew: mockCrew,
  volunteer: mockVolunteers,
  sponsor: mockSponsors,
  venue: mockVenueHosts,
};

export const userService = {
  getProfileTable(role) {
    return TABLES[role] || [];
  },
  getAllAccounts() {
    return Object.entries(TABLES).flatMap(([role, rows]) => rows.map((r) => ({ role, ...r })));
  },
};
