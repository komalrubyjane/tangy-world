// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockEvents, saveEvents, getUpcomingEvents, getPastEvents, getEventBySlug, getEventsByMonth } from '../data/mock/events';

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const eventService = {
  getAll: () => mockEvents,
  getUpcoming: (limit) => getUpcomingEvents(limit),
  getPast: () => getPastEvents(),
  getBySlug: (slug) => getEventBySlug(slug),
  getByMonth: (year, month) => getEventsByMonth(year, month),
  getById: (id) => mockEvents.find((e) => e.id === id),

  create(data) {
    const event = {
      id: `evt-${Date.now()}`,
      slug: data.slug || slugify(data.name || ''),
      sold: 0,
      status: 'draft',
      featured: false,
      artists: [],
      tags: [],
      ...data,
    };
    mockEvents.unshift(event);
    saveEvents();
    return event;
  },

  update(id, patch) {
    const e = mockEvents.find((x) => x.id === id);
    if (!e) return null;
    Object.assign(e, patch);
    saveEvents();
    return e;
  },

  remove(id) {
    const idx = mockEvents.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    mockEvents.splice(idx, 1);
    saveEvents();
    return true;
  },

  toggleFeatured(id) {
    const e = mockEvents.find((x) => x.id === id);
    if (!e) return null;
    e.featured = !e.featured;
    saveEvents();
    return e;
  },
};
