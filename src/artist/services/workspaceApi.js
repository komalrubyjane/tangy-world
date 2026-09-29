import { supabase } from '../../lib/supabaseClient';
import { rpc, friendlyError } from '../../admin/api';
import { portalApi } from '../../portal/portalApi';

// Artist workspace data. Every read/write is authorized by the database:
// artist-only RLS on private tables, SECURITY DEFINER RPCs that scope to the
// signed-in artist (0018/0020). Nothing here decides access.

const must = ({ data, error }) => { if (error) throw friendlyError(error); return data; };

export const workspaceApi = {
  profileCompletion: () => rpc('artist_profile_completion'),

  privateProfile: async (artistId) =>
    must(await supabase.from('artist_private_profiles').select('*').eq('artist_id', artistId).maybeSingle()) || { artist_id: artistId },
  savePrivateProfile: async (artistId, fields) =>
    must(await supabase.from('artist_private_profiles').upsert({ artist_id: artistId, ...fields }, { onConflict: 'artist_id' }).select().single()),
  savePublicProfile: async (artistId, fields) =>
    must(await supabase.from('artists').update(fields).eq('id', artistId).select().single()),

  bookingRequests: () => rpc('my_booking_requests').then((r) => r || []),
  respondToRequest: (id, accept, reason) => rpc('respond_to_booking_request', { p_request_id: id, p_accept: accept, p_reason: reason || null }),

  availability: async (artistId, from, to) =>
    must(await supabase.from('artist_availability').select('date, status').eq('artist_id', artistId).gte('date', from).lte('date', to)) || [],
  setAvailability: async (artistId, date, status) => {
    if (!status) {
      must(await supabase.from('artist_availability').delete().eq('artist_id', artistId).eq('date', date));
      return;
    }
    must(await supabase.from('artist_availability').upsert({ artist_id: artistId, date, status }, { onConflict: 'artist_id,date' }));
  },

  media: async (artistId) =>
    must(await supabase.from('artist_media').select('*').eq('artist_id', artistId).order('created_at', { ascending: false })) || [],
  addMedia: async (row) => must(await supabase.from('artist_media').insert(row).select().single()),
  updateMedia: async (id, fields) => must(await supabase.from('artist_media').update(fields).eq('id', id).select().single()),
  deleteMedia: async (id) => must(await supabase.from('artist_media').delete().eq('id', id)),

  notificationPrefs: () => rpc('my_notification_preferences'),
  setNotificationPref: (key, inApp, email) => rpc('set_notification_preference', { p_pref: key, p_in_app: inApp, p_email: email }),

  // Everything the calendar shows, from real data only.
  async calendar(artistId, fromIso, toIso) {
    const [events, requests, availability] = await Promise.all([
      portalApi.myEvents(true),
      this.bookingRequests(),
      this.availability(artistId, fromIso, toIso),
    ]);
    return {
      performances: (events || []).filter((e) => e.member_kind === 'artist'),
      otherEvents: (events || []).filter((e) => e.member_kind !== 'artist'),
      requests: (requests || []).filter((r) => r.status === 'pending'),
      availability: availability || [],
    };
  },
};
