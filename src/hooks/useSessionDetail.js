import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { mapDbEvent } from './useEvents';
import { withResolvedMedia } from '../lib/contentService';

// One session's public page: the event (by slug, or id for old /book/:id
// links), server-computed availability and ticket types (0026/0027), the
// approved artist lineup, and the signed-in visitor's own waitlist entry.
// Prices and seat counts shown here are display only — checkout re-derives
// both on the server.
export function useSessionDetail(slugOrId, userId) {
  const [state, setState] = useState({ loading: true, error: null, session: null, availability: null, lineup: [] });
  const [waitlist, setWaitlist] = useState(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isSupabaseConfigured || !slugOrId) {
      setState({ loading: false, error: isSupabaseConfigured ? null : new Error('offline'), session: null, availability: null, lineup: [] });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const { data: row, error } = await supabase.from('events').select('*').eq(isUuid ? 'id' : 'slug', slugOrId).maybeSingle();
      if (cancelled) return;
      if (error || !row) {
        setState({ loading: false, error: error || null, session: null, availability: null, lineup: [] });
        return;
      }
      const [{ data: availability }, { data: links }] = await Promise.all([
        supabase.rpc('event_availability', { p_event_id: row.id }),
        supabase.from('event_artists').select('artist_id').eq('event_id', row.id),
      ]);
      const ids = (links || []).map((l) => l.artist_id);
      const { data: lineup } = ids.length
        ? await supabase.from('public_artists').select('id, slug, name, stage_name, genre, city, avatar_url').in('id', ids)
        : { data: [] };
      if (cancelled) return;
      const [session] = await withResolvedMedia([mapDbEvent(row)], ['image']);
      if (cancelled) return;
      setState({ loading: false, error: null, session: { ...session, image: session.image || '/media/gallery/tangy1.jpg' }, availability: availability || null, lineup: lineup || [] });
    })();
    return () => { cancelled = true; };
  }, [slugOrId, tick]);

  const eventId = state.session?.id;
  useEffect(() => {
    if (!eventId || !userId) { setWaitlist(null); return undefined; }
    let cancelled = false;
    supabase.rpc('my_waitlist').then(({ data }) => {
      if (cancelled) return;
      const mine = (data || []).find((w) => w.event_id === eventId && ['waiting', 'offered'].includes(w.status));
      setWaitlist(mine || null);
    });
    return () => { cancelled = true; };
  }, [eventId, userId, tick]);

  // Live seats: re-read only the counts whenever the session's availability
  // signal changes (0029, Supabase Realtime), and also on focus and every
  // two minutes as a fallback. The server still decides at checkout.
  const [live, setLive] = useState({ availability: null, at: null, connected: false });
  const refreshAvailability = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase.rpc('event_availability', { p_event_id: eventId });
    if (!error && data) setLive((l) => ({ ...l, availability: data, at: new Date() }));
  }, [eventId]);
  useEffect(() => {
    if (!eventId || !isSupabaseConfigured) return undefined;
    const channel = supabase.channel(`availability-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_availability_signal', filter: `event_id=eq.${eventId}` }, () => refreshAvailability())
      .subscribe((status) => setLive((l) => ({ ...l, connected: status === 'SUBSCRIBED' })));
    const onFocus = () => refreshAvailability();
    window.addEventListener('focus', onFocus);
    const id = window.setInterval(refreshAvailability, 120_000);
    return () => { supabase.removeChannel(channel); window.removeEventListener('focus', onFocus); window.clearInterval(id); };
  }, [eventId, refreshAvailability]);
  useEffect(() => { setLive({ availability: null, at: null, connected: false }); }, [eventId]);

  return {
    ...state,
    availability: live.availability || state.availability,
    availabilityAt: live.at,
    live: live.connected,
    waitlist,
    refresh: () => { refresh(); refreshAvailability(); },
  };
}

// The server's price for a ticket type × quantity (includes tax). Debounced
// so typing a quantity doesn't fire a request per keystroke.
export function useBookingQuote(eventId, tierId, quantity) {
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !eventId || !tierId || !(quantity > 0)) { setQuote(null); return undefined; }
    let cancelled = false;
    const t = window.setTimeout(() => {
      supabase.rpc('booking_quote', { p_event_id: eventId, p_ticket_type: tierId, p_quantity: quantity })
        .then(({ data, error }) => { if (!cancelled) setQuote(error ? null : data); });
    }, 200);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [eventId, tierId, quantity]);
  return quote;
}

// Waitlist RPC errors → words.
export function waitlistErrorMessage(error) {
  const msg = error?.message || '';
  const m = msg.match(/(?:WAITLIST_CLOSED|ALREADY_WAITLISTED|SEATS_AVAILABLE|INVALID_QUANTITY):\s*(.+)$/);
  if (m) return msg.includes('INVALID_QUANTITY') ? `Party size must be ${m[1]}.` : m[1];
  if (/sign in/i.test(msg)) return 'Please sign in to join the waitlist.';
  return 'We could not update your waitlist place — please try again.';
}
