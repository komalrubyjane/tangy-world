import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function mapDbEvent(row) {
  const eventDate = new Date(`${row.event_date}T00:00:00`);
  return {
    id: row.id,
    slug: row.slug,
    title: row.name,
    artist: '',
    date: eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    rawDate: row.event_date,
    time: row.event_time || '',
    venue: row.venue || '',
    city: 'HYDERABAD',
    description: row.description || '',
    image: row.image_url || '/media/gallery/tangy1.jpg',
    status: row.status === 'sold-out' ? 'SOLD OUT' : row.status === 'past' ? 'PAST' : 'AVAILABLE',
    dbStatus: row.status,
    price: `₹${row.price}`,
    priceValue: row.price,
    tags: row.tags || [],
    capacity: row.capacity,
    story: row.story || '',
    background: row.page_background || null,
    featured: row.featured,
    // Booking form (0024): tickets per booking and the event's own questions.
    bookingMin: row.booking_min_quantity ?? 1,
    bookingMax: row.booking_max_quantity ?? 10,
    bookingQuestions: Array.isArray(row.booking_questions) ? row.booking_questions : [],
  };
}

// What the public sees as upcoming: dated today or later (the same "today" as
// the archive in lib/archiveService.js, so every session is in exactly one of
// the two lists) and still going ahead — a cancelled or past-status session is
// never offered, whatever its date.
const todayISO = () => new Date().toISOString().slice(0, 10);
export const isUpcomingEvent = (e) => {
  const parsed = e.date ? new Date(e.date) : null; // events without rawDate carry only a display date
  const day = e.rawDate || (parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : '');
  return day >= todayISO() && !['past', 'cancelled', 'draft'].includes(e.dbStatus);
};

// Live events from Supabase only. An empty table shows as empty, and a failed
// query — or a build without Supabase configured — surfaces as `error`, never
// as fabricated sessions someone could try to book.
const NOT_CONFIGURED = new Error('Supabase is not configured.');

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [source, setSource] = useState(isSupabaseConfigured ? 'live' : 'offline');
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(isSupabaseConfigured ? null : NOT_CONFIGURED);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err);
          setEvents([]);
        } else {
          const rows = (data || []).map(mapDbEvent);
          setEvents(rows);
          setError(null);
          // Covers uploaded to the private media bucket need signed URLs.
          if (rows.some((e) => e.image?.startsWith('/storage/'))) {
            import('../lib/contentService').then(({ withResolvedMedia }) => withResolvedMedia(rows, ['image']))
              .then((resolved) => { if (!cancelled) setEvents(resolved.map((e) => ({ ...e, image: e.image || '/media/gallery/tangy1.jpg' }))); });
          }
        }
        setSource('live');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { events, source, loading, error };
}
