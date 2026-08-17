// Mock collaboration pipeline — vendor / sponsor / venue-host submissions
// tracked through a review pipeline, separate from their approved profile
// records in vendors.js / sponsors.js / venues.js.
import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'col-001', type: 'vendor', businessName: 'Irani Chai Collective', contactName: 'Zohair Ahmed', email: 'hello@iranichai.example', status: 'active', createdAt: '2025-09-01T10:00:00Z' },
  { id: 'col-002', type: 'vendor', businessName: 'Stepwell Print Press', contactName: 'Neha Kulkarni', email: 'press@stepwellprint.example', status: 'reviewing', createdAt: '2026-06-11T10:00:00Z' },
  { id: 'col-003', type: 'sponsor', businessName: 'Deccan Heritage Foundation', contactName: 'Anand Prasad', email: 'partnerships@deccanheritage.example', status: 'active', createdAt: '2024-02-01T10:00:00Z' },
  { id: 'col-004', type: 'sponsor', businessName: 'Nizam Arts Trust', contactName: 'Farah Baig', email: 'grants@nizamarts.example', status: 'new', createdAt: '2026-07-01T10:00:00Z' },
  { id: 'col-005', type: 'venue_host', businessName: 'Old City Haveli', contactName: 'Family Estate Office', email: 'estate@oldcityhaveli.example', status: 'contacted', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'col-006', type: 'vendor', businessName: 'Deccan Brew Co.', contactName: 'Ravi Teja', email: 'ravi@deccanbrew.example', status: 'active', createdAt: '2025-11-20T10:00:00Z' },
];

export const mockCollaborations = loadOrSeed('collaborations', () => SEED);
export const saveCollaborations = () => persist('collaborations', mockCollaborations);
