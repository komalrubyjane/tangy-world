import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'spn-001', userId: 'usr-s01', organizationName: 'Deccan Heritage Foundation', contactName: 'Anand Prasad', tier: 'Cultural Partner', status: 'active', email: 'partnerships@deccanheritage.example', phone: '+91 95111 00444', activeCollaborations: ['evt-vol4'], proposals: [], requests: [], createdAt: '2024-02-01T10:00:00Z' },
  { id: 'spn-002', userId: 'usr-s02', organizationName: 'Nizam Arts Trust', contactName: 'Farah Baig', tier: 'Presenting Sponsor', status: 'pending', email: 'grants@nizamarts.example', phone: '+91 95222 11555', activeCollaborations: [], proposals: [{ id: 'prop1', note: 'Proposing season-long sponsorship for 2027' }], requests: [], createdAt: '2026-07-01T10:00:00Z' },
];

export const mockSponsors = loadOrSeed('sponsors', () => SEED);
export const saveSponsors = () => persist('sponsors', mockSponsors);
