// Public reads for the archive: past sessions (with line-up, gallery, diary,
// Tangy TV and programme links), programmes (0031) and the gallery archive.
// RLS decides what visitors see (non-draft events, published content).
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ALBUM_FIELDS, DIARY_FIELDS, TV_FIELDS } from './contentService';

const offline = { data: null, error: new Error('Supabase is not configured.') };
const SESSION_FIELDS = 'id, slug, name, description, story, event_date, event_time, end_time, venue, image_url, page_background, capacity, status, tags, attendance_recorded';
const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

// { event_id: [artist, …] } for these events (public_artists: safe fields only).
async function lineups(eventIds) {
  if (!eventIds.length) return {};
  const { data: links } = await supabase.from('event_artists').select('event_id, artist_id').in('event_id', eventIds);
  const artistIds = [...new Set((links || []).map((l) => l.artist_id))];
  const { data: artists } = artistIds.length
    ? await supabase.from('public_artists').select('id, slug, name, stage_name, genre, avatar_url').in('id', artistIds)
    : { data: [] };
  const byId = Object.fromEntries((artists || []).map((a) => [a.id, a]));
  const out = {};
  for (const l of links || []) if (byId[l.artist_id]) (out[l.event_id] ||= []).push(byId[l.artist_id]);
  return out;
}

export const archive = {
  // Sessions dated before today (held, cancelled or postponed), newest first.
  listPastSessions: async () => {
    if (!isSupabaseConfigured) return offline;
    const { data, error } = await supabase.from('events').select(SESSION_FIELDS)
      .lt('event_date', today()).neq('status', 'draft').order('event_date', { ascending: false });
    if (error) return { data: null, error };
    const lineup = await lineups(data.map((e) => e.id));
    return { data: data.map((e) => ({ ...e, artists: lineup[e.id] || [] })), error: null };
  },

  // One past session and everything linked to it. `upcoming: true` when the
  // slug belongs to a session that hasn't happened yet (the page redirects).
  getPastSession: async (slug) => {
    if (!isSupabaseConfigured) return offline;
    const { data: e, error } = await supabase.from('events').select(SESSION_FIELDS).eq('slug', slug).neq('status', 'draft').maybeSingle();
    if (error || !e) return { data: null, error };
    if (e.event_date >= today()) return { data: { ...e, upcoming: true }, error: null };
    const [lineup, albums, diary, tv, progs] = await Promise.all([
      lineups([e.id]),
      supabase.from('gallery_albums').select(ALBUM_FIELDS).eq('event_id', e.id).eq('status', 'published').lte('published_at', nowIso()),
      supabase.from('diary_posts').select(DIARY_FIELDS).eq('event_id', e.id).eq('status', 'published').lte('published_at', nowIso()),
      supabase.from('tv_videos').select(TV_FIELDS).eq('event_id', e.id).eq('status', 'published').lte('published_at', nowIso()),
      supabase.from('programme_events').select('programmes(slug, title, year)').eq('event_id', e.id),
    ]);
    return {
      data: {
        ...e,
        artists: lineup[e.id] || [],
        albums: albums.data || [],
        diary: diary.data || [],
        tv: tv.data || [],
        programmes: (progs.data || []).map((p) => p.programmes).filter(Boolean),
      },
      error: null,
    };
  },

  listProgrammes: () => (isSupabaseConfigured
    ? supabase.from('programmes').select('id, slug, title, year, season, description, venue, cover_url, programme_events(count)')
      .eq('status', 'published').lte('published_at', nowIso()).order('year', { ascending: false }).order('sort_order')
    : Promise.resolve(offline)),

  getProgramme: async (slug) => {
    if (!isSupabaseConfigured) return offline;
    const { data: p, error } = await supabase.from('programmes').select('id, slug, title, year, season, description, venue, cover_url')
      .eq('slug', slug).eq('status', 'published').lte('published_at', nowIso()).maybeSingle();
    if (error || !p) return { data: null, error };
    const { data: links } = await supabase.from('programme_events').select('position, events(' + SESSION_FIELDS + ')').eq('programme_id', p.id).order('position');
    const sessions = (links || []).map((l) => l.events).filter(Boolean);
    const lineup = await lineups(sessions.map((s) => s.id));
    return { data: { ...p, sessions: sessions.map((s) => ({ ...s, artists: lineup[s.id] || [] })) }, error: null };
  },

  // Published albums with their session's date, venue and tags (for filters).
  listAlbums: async () => {
    if (!isSupabaseConfigured) return offline;
    const { data, error } = await supabase.from('gallery_albums').select(`${ALBUM_FIELDS}, gallery_photos(count)`)
      .eq('status', 'published').lte('published_at', nowIso()).order('taken_on', { ascending: false, nullsFirst: false });
    if (error) return { data: null, error };
    const ids = [...new Set(data.map((a) => a.event_id).filter(Boolean))];
    const { data: events } = ids.length ? await supabase.from('events').select('id, slug, name, venue, tags, event_date').in('id', ids) : { data: [] };
    const byId = Object.fromEntries((events || []).map((ev) => [ev.id, ev]));
    return { data: data.map((a) => ({ ...a, event: byId[a.event_id] || null, photoCount: a.gallery_photos?.[0]?.count ?? 0 })), error: null };
  },
};

// "Past / upcoming / featured" for an artist from their sessions.
export async function artistTimeline(artistIds) {
  if (!isSupabaseConfigured || !artistIds.length) return {};
  const { data } = await supabase.from('event_artists').select('artist_id, events!inner(event_date, status)').in('artist_id', artistIds);
  const out = {};
  for (const r of data || []) {
    if (r.events.status === 'draft') continue;
    const t = (out[r.artist_id] ||= { past: 0, upcoming: 0 });
    if (r.events.event_date < today()) t.past += 1; else if (r.events.status !== 'cancelled') t.upcoming += 1;
  }
  return out;
}
