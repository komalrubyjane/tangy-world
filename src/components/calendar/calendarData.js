import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

// One artist's calendar — the same component and the same server data
// (artist_calendar, 0034) in the artist portal, on the admin artist page and in
// the event editor's artist drawer. `linkFor(entry)` decides where an entry
// leads for whoever is looking.
export function useArtistCalendar(artistId, from, to) {
  const [state, setState] = useState({ loading: true, entries: [] });
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (!artistId) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    supabase.rpc('artist_calendar', { p_artist_id: artistId, p_from: from, p_to: to }).then(({ data, error }) => {
      if (cancelled) return;
      setState(error ? { loading: false, entries: [], error } : { loading: false, entries: data || [] });
    });
    return () => { cancelled = true; };
  }, [artistId, from, to, key]);
  return { ...state, reload: useCallback(() => setKey((k) => k + 1), []) };
}

// Where an entry leads for the artist themselves.
export const artistLinkFor = (e) => (e.kind === 'pending' && e.request_id ? `/artist/requests/${e.request_id}`
  : e.event_id ? `/artist/sessions/${e.event_id}` : '/artist/availability');
// … and for the team.
export const adminLinkFor = (e) => (e.event_id ? `/admin-portal/events/${e.event_id}/artists` : null);
