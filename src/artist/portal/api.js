// Data for the Artist Portal. Everything goes through RLS / security-definer
// functions that scope it to the signed-in artist (migrations 0020, 0033).
import { supabase } from '../../lib/supabaseClient';
import { portalApi } from '../../portal/portalApi';
import { workspaceApi } from '../services/workspaceApi';

const must = ({ data, error }) => { if (error) throw error; return data; };
const today = () => new Date().toISOString().slice(0, 10);

export const artistApi = {
  // Sessions the artist is booked on (with logistics) — upcoming and past.
  sessions: () => portalApi.myEvents(true),
  requests: () => workspaceApi.bookingRequests(),
  // Awaited inside: a Supabase query only runs when it is awaited / then'd.
  markRequestViewed: async (id) => { await supabase.rpc('mark_artist_request_viewed', { p_id: id }); },
  respond: (id, accept, reason) => workspaceApi.respondToRequest(id, accept, reason),

  availability: async (artistId, from, to) => must(await supabase.from('artist_availability')
    .select('date, status, note, start_time, end_time').eq('artist_id', artistId).gte('date', from).lte('date', to).order('date')) || [],
  // When the calendar was last updated, whether that's stale, and the next 7 days (0034).
  availabilitySummary: async () => must(await supabase.rpc('artist_availability_summary')),
  setAvailability: async ({ from, to, status, note, start, end }) => must(await supabase.rpc('set_artist_availability', {
    p_from: from, p_to: to, p_status: status, p_note: note || null, p_start: start || null, p_end: end || null })),

  documents: async (artistId) => must(await supabase.from('artist_documents').select('*').eq('artist_id', artistId).order('created_at', { ascending: false })) || [],
  addDocument: async (row) => must(await supabase.from('artist_documents').insert(row).select().single()),
  deleteDocument: async (id) => must(await supabase.from('artist_documents').delete().eq('id', id)),

  completion: () => workspaceApi.profileCompletion(),
  conversations: () => portalApi.conversations(),
  unreadNotifications: () => portalApi.unreadCount(),
  media: (artistId) => workspaceApi.media(artistId),

  // The signed-in person's artist application (draft or submitted).
  myApplication: async () => must(await supabase.from('artist_applications').select('*').maybeSingle()),
  startApplication: async () => must(await supabase.from('artist_applications').insert({}).select().single()),
  saveApplication: async (id, fields) => must(await supabase.from('artist_applications').update(fields).eq('id', id).select().single()),
  submitApplication: async () => must(await supabase.rpc('submit_artist_application')),
  withdrawApplication: async () => must(await supabase.rpc('withdraw_artist_application')),
};

// Upcoming vs past by the event date (sessions have no time zone issue here:
// event_date is the local date of the night).
export const isPast = (date) => date < today();
export { today };

// A booking request's display state: pending requests the artist has opened
// read as "viewed"; accepted / confirmed requests for a past session as "completed".
export function requestState(r) {
  if (r.status === 'pending' && r.viewed_at) return 'viewed';
  if ((r.status === 'accepted' || r.status === 'confirmed') && r.event_date && isPast(r.event_date)) return 'completed';
  return r.status;
}
