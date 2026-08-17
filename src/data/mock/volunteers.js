import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'vol-001', userId: 'usr-vl01', fullName: 'Meera Pillai', email: 'meera.pillai@example.com', phone: '+91 97111 00222', interest: 'Social Media', interests: ['Social Media', 'Photography'], status: 'approved', availability: 'Weekends', assignedEvents: ['evt-vol4'], tasks: [{ id: 't1', label: 'Cover stories during soundcheck', done: false }], createdAt: '2024-05-12T10:00:00Z' },
  { id: 'vol-002', userId: 'usr-vl02', fullName: 'Aditya Gupta', email: 'aditya.gupta@example.com', phone: '+91 97222 11333', interest: 'Guest Registration', interests: ['Guest Registration'], status: 'pending', availability: 'Evenings', assignedEvents: [], tasks: [], createdAt: '2026-07-30T10:00:00Z' },
  { id: 'vol-003', userId: 'usr-vl03', fullName: 'Kavya Suresh', email: 'kavya.suresh@example.com', phone: '+91 97333 22444', interest: 'Backstage Support', interests: ['Backstage Support', 'Artist Liaison'], status: 'approved', availability: 'Flexible', assignedEvents: ['evt-solstice27'], tasks: [], createdAt: '2025-03-18T10:00:00Z' },
];

export const mockVolunteers = loadOrSeed('volunteers', () => SEED);
export const saveVolunteers = () => persist('volunteers', mockVolunteers);
