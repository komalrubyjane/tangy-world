import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { events as mockEvents } from '../data/mockData';

function mapDbEvent(row) {
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
    featured: row.featured,
  };
}

// Fetches live events from Supabase. Falls back to the site's existing
// editorial mock events whenever Supabase isn't configured, the query fails,
// or the table is simply empty (e.g. migrations not applied yet) — so every
// consumer keeps working exactly as before until the real backend is live.
export function useEvents() {
  const [events, setEvents] = useState(mockEvents);
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data && data.length > 0) {
          setEvents(data.map(mapDbEvent));
          setSource('live');
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { events, source, loading };
}
