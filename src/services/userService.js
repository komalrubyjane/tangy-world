// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockUsers, savePatrons } from '../data/mock/users';
import { mockArtists, saveArtists } from '../data/mock/artists';
import { mockVendors, saveVendors } from '../data/mock/vendors';
import { mockCrew, saveCrew } from '../data/mock/crew';
import { mockVolunteers, saveVolunteers } from '../data/mock/volunteers';
import { mockSponsors, saveSponsors } from '../data/mock/sponsors';
import { mockVenueHosts, saveVenueHosts } from '../data/mock/venues';

const TABLES = {
  patron: mockUsers,
  artist: mockArtists,
  vendor: mockVendors,
  crew: mockCrew,
  volunteer: mockVolunteers,
  sponsor: mockSponsors,
  venue: mockVenueHosts,
};

const SAVERS = {
  patron: savePatrons,
  artist: saveArtists,
  vendor: saveVendors,
  crew: saveCrew,
  volunteer: saveVolunteers,
  sponsor: saveSponsors,
  venue: saveVenueHosts,
};

// Every profile row's "display name" field differs by role table
// (fullName / name / businessName / organizationName / propertyName).
function displayName(row) {
  return row.fullName || row.name || row.businessName || row.organizationName || row.propertyName || row.email;
}

export const userService = {
  getProfileTable(role) {
    return TABLES[role] || [];
  },
  getAllAccounts() {
    return Object.entries(TABLES).flatMap(([role, rows]) => rows.map((r) => ({ role, displayName: displayName(r), ...r })));
  },
  getById(role, id) {
    return (TABLES[role] || []).find((r) => r.id === id);
  },
  updateStatus(role, id, status) {
    const row = (TABLES[role] || []).find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    SAVERS[role]?.();
    return row;
  },
  updateProfile(role, id, patch) {
    const row = (TABLES[role] || []).find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    SAVERS[role]?.();
    return row;
  },
  // Submit a brand-new application for a crew/volunteer/etc. role — lands as
  // a 'pending' row in the matching profile table, visible to Admin → People.
  applyForRole(role, data) {
    const table = TABLES[role];
    if (!table) return null;
    const id = `${role.slice(0, 3)}-${Date.now()}`;
    const base = {
      id,
      userId: `usr-${Date.now()}`,
      fullName: data.fullName || data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      status: 'pending',
      assignedEvents: [],
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    const row = role === 'crew'
      ? { ...base, department: data.department || data.role || '', role: data.role || data.department || '', skills: data.skills || [], schedule: [], notes: data.notes || '' }
      : { ...base, interest: data.interest || '', interests: data.interests || (data.interest ? [data.interest] : []), availability: data.availability || 'Flexible', notes: data.notes || '' };
    table.push(row);
    SAVERS[role]?.();
    return row;
  },
};
