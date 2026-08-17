import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'crw-001', userId: 'usr-c01', fullName: 'Rohan Sinha', email: 'rohan.sinha@example.com', phone: '+91 98111 00111', department: 'Stage Operations', role: 'Stage Operations', status: 'active', skills: ['Rigging', 'Stage Management'], assignedEvents: ['evt-vol4'], tasks: [{ id: 't1', label: 'Stage rig check', done: true }, { id: 't2', label: 'Sound line walkthrough', done: false }], schedule: [{ event: 'evt-vol4', callTime: '4:00 PM' }], createdAt: '2024-03-01T10:00:00Z' },
  { id: 'crw-002', userId: 'usr-c02', fullName: 'Ishita Desai', email: 'ishita.desai@example.com', phone: '+91 98222 11222', department: 'Front of House', role: 'Front of House Lead', status: 'active', skills: ['Guest Registration', 'Ticketing'], assignedEvents: ['evt-vol4', 'evt-solstice27'], tasks: [{ id: 't1', label: 'Print check-in list', done: false }], schedule: [{ event: 'evt-vol4', callTime: '5:00 PM' }], createdAt: '2024-08-15T10:00:00Z' },
  { id: 'crw-003', userId: 'usr-c03', fullName: 'Farhan Ali', email: 'farhan.ali@example.com', phone: '+91 98333 22333', department: 'Sound', role: 'Sound Engineer', status: 'pending', skills: ['Live Mixing', 'Acoustic Setup'], assignedEvents: [], tasks: [], schedule: [], createdAt: '2026-07-05T10:00:00Z' },
];

export const mockCrew = loadOrSeed('crew', () => SEED);
export const saveCrew = () => persist('crew', mockCrew);
