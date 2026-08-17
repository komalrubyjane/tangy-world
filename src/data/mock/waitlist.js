import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'wl-001', eventId: 'evt-solstice27', name: 'Ritu Chandra', email: 'ritu.chandra@example.com', phone: '+91 93111 00777', status: 'waiting', createdAt: '2026-07-10T09:00:00Z' },
  { id: 'wl-002', eventId: 'evt-solstice27', name: 'Yash Agarwal', email: 'yash.agarwal@example.com', phone: '+91 93222 11888', status: 'waiting', createdAt: '2026-07-12T11:30:00Z' },
  { id: 'wl-003', eventId: 'evt-vol4', name: 'Pooja Reddy', email: 'pooja.reddy@example.com', phone: '+91 93333 22999', status: 'notified', createdAt: '2026-07-05T14:00:00Z' },
  { id: 'wl-004', eventId: 'evt-monsoon27', name: 'Siddharth Rao', email: 'siddharth.rao@example.com', phone: '+91 93444 33000', status: 'waiting', createdAt: '2026-07-18T16:45:00Z' },
  { id: 'wl-005', eventId: 'evt-vol4', name: 'Anjali Menon', email: 'anjali.menon@example.com', phone: '+91 93555 44111', status: 'converted', createdAt: '2026-06-28T08:00:00Z' },
];

export const mockWaitlist = loadOrSeed('waitlist', () => SEED);
export const saveWaitlist = () => persist('waitlist', mockWaitlist);

export function getWaitlistPosition(eventId, entryId) {
  const list = mockWaitlist.filter((w) => w.eventId === eventId && w.status === 'waiting');
  return list.findIndex((w) => w.id === entryId) + 1;
}
