import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'vnd-001', userId: 'usr-v01', businessName: 'Irani Chai Collective', contactName: 'Zohair Ahmed', category: 'Chai & Food', status: 'approved', email: 'hello@iranichai.example', phone: '+91 96111 00333', location: 'Hyderabad', opportunitiesApplied: ['opp-food-vol4'], activeCollaborations: ['evt-vol4'], enquiries: [], createdAt: '2025-09-01T10:00:00Z' },
  { id: 'vnd-002', userId: 'usr-v02', businessName: 'Stepwell Print Press', contactName: 'Neha Kulkarni', category: 'Vintage Printmaking', status: 'pending', email: 'press@stepwellprint.example', phone: '+91 96222 11444', location: 'Hyderabad', opportunitiesApplied: ['opp-craft-vol4'], activeCollaborations: [], enquiries: [], createdAt: '2026-06-11T10:00:00Z' },
  { id: 'vnd-003', userId: 'usr-v03', businessName: 'Deccan Brew Co.', contactName: 'Ravi Teja', category: 'Coffee & Beverages', status: 'approved', email: 'ravi@deccanbrew.example', phone: '+91 96333 22555', location: 'Hyderabad', opportunitiesApplied: [], activeCollaborations: ['evt-solstice27'], enquiries: [], createdAt: '2025-11-20T10:00:00Z' },
];

export const mockVendors = loadOrSeed('vendors', () => SEED);
export const saveVendors = () => persist('vendors', mockVendors);
