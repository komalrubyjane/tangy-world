// MOCK service — part of the new mock account/dashboard/AI system.
// Not connected to Supabase. Swap the internals for real calls later
// without changing any component that imports this file.
import { mockEvents, getUpcomingEvents, getPastEvents, getEventBySlug, getEventsByMonth } from '../data/mock/events';

export const eventService = {
  getAll: () => mockEvents,
  getUpcoming: (limit) => getUpcomingEvents(limit),
  getPast: () => getPastEvents(),
  getBySlug: (slug) => getEventBySlug(slug),
  getByMonth: (year, month) => getEventsByMonth(year, month),
};
