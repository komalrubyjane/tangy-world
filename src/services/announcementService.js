// Public announcements for the site's character overlay. Backed by the
// `announcements` table (0017_admin_system.sql) — RLS only ever returns
// published, non-staff, currently-live rows to the public. Without Supabase
// configured there are no announcements — never bundled placeholder ones.
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// The values announcements.status accepts (0017 check constraint).
export const ANNOUNCEMENT_STATUSES = ['draft', 'scheduled', 'published', 'expired', 'archived'];
export const ANNOUNCEMENT_CATEGORIES = ['SESSION', 'ARTIST', 'TICKET', 'ARCHIVE', 'CULTURE', 'GENERAL'];

export const ANNOUNCEMENT_CHARACTERS = [
  { id: 'violinist', label: 'Violinist' },
  { id: 'guitarist', label: 'Guitarist' },
  { id: 'veena', label: 'Veena' },
  { id: 'kathak', label: 'Kathak' },
  { id: 'hiphop', label: 'Hip-Hop' },
];

// DB row → the camelCase shape AnnouncementCharacterOverlay renders.
export function toOverlayShape(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.body,
    category: row.category,
    character: row.character,
    destination: row.destination,
    audience: row.audience,
    priority: row.priority,
    publishAt: row.publish_at,
    expireAt: row.expire_at,
    status: row.status,
  };
}

export const announcementService = {
  async getPublished() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, category, character, destination, audience, priority, publish_at, expire_at, status')
      .eq('status', 'published')
      .in('audience', ['all', 'guest', 'patron', 'artist'])
      .order('publish_at', { ascending: false })
      .limit(20);
    if (error) return [];
    return (data || []).map(toOverlayShape);
  },

  statuses: ANNOUNCEMENT_STATUSES,
  categories: ANNOUNCEMENT_CATEGORIES,
};
