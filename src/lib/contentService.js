// Public + admin access to the CMS tables (migration 0028). RLS decides what
// each caller sees: visitors get published items only; content editors see
// drafts. Nothing here grants access.
import { supabase, isSupabaseConfigured } from './supabaseClient';

const offline = { data: null, error: new Error('Supabase is not configured.') };

export const TV_FIELDS = 'id, slug, title, description, video_url, thumbnail_url, duration_seconds, category, event_id, in_player, featured, sort_order, status, published_at, updated_at';
export const DIARY_FIELDS = 'id, slug, title, excerpt, body, cover_url, location, author_name, tags, event_id, seo_description, status, published_at, updated_at';
export const ALBUM_FIELDS = 'id, slug, title, description, cover_url, event_id, taken_on, sort_order, status, published_at, updated_at';

export const content = {
  // Tangy TV --------------------------------------------------------------
  // For visitors RLS returns published videos only; editors also see drafts,
  // so public callers filter on status explicitly.
  listTv: ({ publicOnly = true } = {}) => {
    if (!isSupabaseConfigured) return Promise.resolve(offline);
    let q = supabase.from('tv_videos').select(TV_FIELDS).order('sort_order').order('published_at', { ascending: false });
    if (publicOnly) q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
    return q;
  },
  getTv: (slug) => (isSupabaseConfigured
    ? supabase.from('tv_videos').select(TV_FIELDS).eq('slug', slug).eq('status', 'published').maybeSingle()
    : Promise.resolve(offline)),

  // Diary --------------------------------------------------------------------
  listDiary: ({ publicOnly = true } = {}) => {
    if (!isSupabaseConfigured) return Promise.resolve(offline);
    let q = supabase.from('diary_posts').select(DIARY_FIELDS).order('published_at', { ascending: false, nullsFirst: true });
    if (publicOnly) q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
    return q;
  },
  getDiary: (slug) => (isSupabaseConfigured
    ? supabase.from('diary_posts').select(DIARY_FIELDS).eq('slug', slug).eq('status', 'published').maybeSingle()
    : Promise.resolve(offline)),

  // Gallery ------------------------------------------------------------------
  listAlbums: ({ publicOnly = true } = {}) => {
    if (!isSupabaseConfigured) return Promise.resolve(offline);
    let q = supabase.from('gallery_albums').select(`${ALBUM_FIELDS}, gallery_photos(count)`).order('sort_order').order('taken_on', { ascending: false });
    if (publicOnly) q = q.eq('status', 'published').lte('published_at', new Date().toISOString());
    return q;
  },
  getAlbum: (slug) => (isSupabaseConfigured
    ? supabase.from('gallery_albums').select(`${ALBUM_FIELDS}, gallery_photos(id, image_url, caption, alt_text, credit, sort_order)`)
      .eq('slug', slug).eq('status', 'published').order('sort_order', { referencedTable: 'gallery_photos' }).maybeSingle()
    : Promise.resolve(offline)),
  // A handful of recent published photos for home/section previews.
  recentPhotos: async (limit = 10) => {
    if (!isSupabaseConfigured) return offline;
    const { data, error } = await supabase.from('gallery_photos')
      .select('id, image_url, caption, alt_text, sort_order, gallery_albums!inner(slug, title, status)')
      .eq('gallery_albums.status', 'published').order('sort_order').limit(limit);
    return { data, error };
  },

  // Artists ------------------------------------------------------------------
  getArtist: (slug) => (isSupabaseConfigured
    ? supabase.from('public_artists').select('*').eq('slug', slug).maybeSingle()
    : Promise.resolve(offline)),
  listArtists: (limit = 50) => (isSupabaseConfigured
    ? supabase.from('public_artists').select('id, slug, name, stage_name, genre, city, avatar_url, bio').order('applied_at', { ascending: false }).limit(limit)
    : Promise.resolve(offline)),
  artistSessions: async (artistId) => {
    if (!isSupabaseConfigured) return offline;
    const { data, error } = await supabase.from('event_artists')
      .select('events!inner(id, slug, name, event_date, venue, status)').eq('artist_id', artistId);
    return { data: (data || []).map((r) => r.events).sort((a, b) => b.event_date.localeCompare(a.event_date)), error };
  },

  // Admin writes (RLS + content_guard_publish enforce permissions) ---------------
  save: (table, row) => {
    const { id, ...fields } = row;
    return id
      ? supabase.from(table).update(fields).eq('id', id).select().single()
      : supabase.from(table).insert(fields).select().single();
  },
  remove: (table, id) => supabase.from(table).delete().eq('id', id),

  // Uploads go to the content-media bucket under a random folder, so draft
  // files aren't guessable. Returns the public URL.
  upload: async (area, file) => {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${area}/${crypto.randomUUID()}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('content-media').upload(path, file, { contentType: file.type, upsert: false });
    if (error) return { error };
    return { url: supabase.storage.from('content-media').getPublicUrl(path).data.publicUrl };
  },
};

export function slugify(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

// Postgres / RLS errors from content writes → words for editors.
export function contentErrorMessage(error) {
  const msg = error?.message || '';
  if (/permission to publish/i.test(msg)) return 'You can save drafts, but publishing needs the content.publish permission.';
  if (/duplicate key.*slug/i.test(msg)) return 'That URL slug is already used — choose another.';
  if (/row-level security|permission denied/i.test(msg)) return 'You do not have permission to make this change.';
  if (/_slug_check|slug/i.test(msg) && /check constraint/i.test(msg)) return 'The slug may only contain lowercase letters, numbers and hyphens.';
  if (/_url_check|video_url|image_url|cover_url|thumbnail_url/i.test(msg)) return 'Links must start with https:// or be a path on this site (/…).';
  if (/alt_text/i.test(msg)) return 'Every photo needs a short description (alt text).';
  if (/title_check/i.test(msg)) return 'A title is required.';
  return msg || 'Could not save — please try again.';
}
