// MOCK service — not connected to Supabase. Swap the internals for real
// calls later without changing any component that imports this file.
import { mockAnnouncements, saveAnnouncements, ANNOUNCEMENT_STATUSES, ANNOUNCEMENT_CATEGORIES } from '../data/mock/announcements';

export const announcementService = {
  getAll: () => mockAnnouncements,
  getPublished: () => mockAnnouncements.filter((a) => a.status === 'published'),

  create(data) {
    const announcement = {
      id: `ann-${Date.now()}`,
      status: 'draft',
      ...data,
    };
    mockAnnouncements.unshift(announcement);
    saveAnnouncements();
    return announcement;
  },

  update(id, updates) {
    const a = mockAnnouncements.find((x) => x.id === id);
    if (!a) return null;
    Object.assign(a, updates);
    saveAnnouncements();
    return a;
  },

  setStatus(id, status) {
    if (!ANNOUNCEMENT_STATUSES.includes(status)) return null;
    return announcementService.update(id, { status });
  },

  statuses: ANNOUNCEMENT_STATUSES,
  categories: ANNOUNCEMENT_CATEGORIES,
};
