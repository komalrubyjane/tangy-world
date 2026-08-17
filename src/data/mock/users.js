// Mock patron/user accounts — for the mock account-creation flow only.
// Does not touch the existing real Supabase-backed patron login/session.
import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'usr-001', role: 'patron', fullName: 'Ananya Reddy', email: 'ananya@example.com', phone: '+91 98480 11223', location: 'Hyderabad', avatar: '', bio: 'Collects vinyl and heritage-venue stamps in equal measure.', passportId: 'TS-PASS-2201', memberSince: '2023-11-02', stampsCount: 6, savedSessions: ['evt-vol4', 'evt-solstice27'], preferences: { music: ['Sufi', 'Carnatic Fusion'], notifications: true }, createdAt: '2023-11-02T10:00:00Z' },
  { id: 'usr-002', role: 'patron', fullName: 'Vikram Rao', email: 'vikram@example.com', phone: '+91 90000 22334', location: 'Hyderabad', avatar: '', bio: 'Been to every Vol. since the first stepwell session.', passportId: 'TS-PASS-1187', memberSince: '2022-06-14', stampsCount: 11, savedSessions: ['evt-monsoon27'], preferences: { music: ['Folk', 'Acoustic'], notifications: true }, createdAt: '2022-06-14T10:00:00Z' },
  { id: 'usr-003', role: 'patron', fullName: 'Priya Nair', email: 'priya.nair@example.com', phone: '+91 98765 44556', location: 'Secunderabad', avatar: '', bio: 'Sound designer by day, front-row regular by night.', passportId: 'TS-PASS-3390', memberSince: '2024-02-20', stampsCount: 3, savedSessions: ['evt-vol4'], preferences: { music: ['Ambient', 'Vocal'], notifications: false }, createdAt: '2024-02-20T10:00:00Z' },
  { id: 'usr-004', role: 'patron', fullName: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '+91 91234 55667', location: 'Hyderabad', avatar: '', bio: 'Brings a film camera to every session for the archive.', passportId: 'TS-PASS-1955', memberSince: '2021-09-05', stampsCount: 14, savedSessions: [], preferences: { music: ['Heritage', 'Live'], notifications: true }, createdAt: '2021-09-05T10:00:00Z' },
  { id: 'usr-005', role: 'patron', fullName: 'Sanjana Iyer', email: 'sanjana.iyer@example.com', phone: '+91 90987 66778', location: 'Gachibowli', avatar: '', bio: 'Discovered Tangy through a friend\'s Instagram story, never left.', passportId: 'TS-PASS-4021', memberSince: '2025-01-11', stampsCount: 1, savedSessions: ['evt-solstice27', 'evt-monsoon27'], preferences: { music: ['Sufi'], notifications: true }, createdAt: '2025-01-11T10:00:00Z' },
];

export const mockUsers = loadOrSeed('users', () => SEED);
export const savePatrons = () => persist('users', mockUsers);

export function findUserByEmail(email) {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
