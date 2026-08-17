import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'vnu-001', userId: 'usr-vn01', propertyName: 'Bansilalpet Stepwell', contactName: 'Trust Office', email: 'trust@bansilalpet.example', phone: '+91 94111 00555', location: 'Hyderabad', capacity: 250, status: 'active', hostingRequests: [], upcomingEvents: ['evt-vol4'], enquiries: [], createdAt: '2022-01-01T10:00:00Z' },
  { id: 'vnu-002', userId: 'usr-vn02', propertyName: 'Old City Haveli', contactName: 'Family Estate Office', email: 'estate@oldcityhaveli.example', phone: '+91 94222 11666', location: 'Hyderabad', capacity: 180, status: 'pending', hostingRequests: [{ id: 'req1', note: 'Interested in hosting Vol. 5' }], upcomingEvents: [], enquiries: [], createdAt: '2026-06-01T10:00:00Z' },
];

export const mockVenueHosts = loadOrSeed('venues', () => SEED);
export const saveVenueHosts = () => persist('venues', mockVenueHosts);
