import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { events as mockEvents } from '../data/mockData';
import { isMockAuth } from '../config/auth';

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

// Live events from Supabase. The editorial mock events are used ONLY when the
// app runs fully offline (AUTH_MODE=mock or no Supabase configured). With a
// real backend, an empty table shows as empty and a failed query surfaces as
// `error` — never as fabricated sessions someone could try to book.
const OFFLINE = isMockAuth || !isSupabaseConfigured;

export function useEvents() {
  const [events, setEvents] = useState(OFFLINE ? mockEvents : []);
  const [source, setSource] = useState(OFFLINE ? 'mock' : 'live');
  const [loading, setLoading] = useState(!OFFLINE);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (OFFLINE) return;
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
          setEvents((data || []).map(mapDbEvent));
          setError(null);
        }
        setSource('live');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { events, source, loading, error };
}
