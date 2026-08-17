// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockWaitlist, saveWaitlist } from '../data/mock/waitlist';
import { mockEvents } from '../data/mock/events';

export const waitlistService = {
  getAll: () => mockWaitlist.map((w) => ({ ...w, event: mockEvents.find((e) => e.id === w.eventId) })),
  getForEvent: (eventId) => mockWaitlist.filter((w) => w.eventId === eventId),

  join({ eventId, name, email, phone }) {
    const entry = { id: `wl-${Date.now()}`, eventId, name, email, phone, status: 'waiting', createdAt: new Date().toISOString() };
    mockWaitlist.push(entry);
    saveWaitlist();
    return entry;
  },

  notify(id) {
    const w = mockWaitlist.find((x) => x.id === id);
    if (!w) return null;
    w.status = 'notified';
    saveWaitlist();
    return w;
  },

  remove(id) {
    const idx = mockWaitlist.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    mockWaitlist.splice(idx, 1);
    saveWaitlist();
    return true;
  },

  convertToBooking(id) {
    const w = mockWaitlist.find((x) => x.id === id);
    if (!w) return null;
    w.status = 'converted';
    saveWaitlist();
    return w;
  },
};
