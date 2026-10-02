import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

// The archive's areas, each a real page, with live counts (RLS: what a
// visitor can see). Counts are omitted when they can't be loaded.
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const AREAS = [
  { to: '/sessions/archive', title: 'Previous sessions', text: 'Every night on record — line-ups, venues, attendance.', count: () => supabase.from('events').select('id', { count: 'exact', head: true }).lt('event_date', today()).neq('status', 'draft') },
  { to: '/archive/programmes', title: 'Programmes', text: 'Seasons and series, year by year.', count: () => supabase.from('programmes').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', now()) },
  { to: '/gallery/archive', title: 'Gallery', text: 'Photo albums from the sessions and the spaces.', count: () => supabase.from('gallery_albums').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', now()) },
  { to: '/tv', title: 'Tangy TV', text: 'Recordings and highlights.', count: () => supabase.from('tv_videos').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', now()) },
  { to: '/artists', title: 'Artists', text: 'Everyone who has played a Tangy night.', count: () => supabase.from('public_artists').select('id', { count: 'exact', head: true }) },
  { to: '/diary', title: 'Diary', text: 'Field notes, stories and behind the scenes.', count: () => supabase.from('diary_posts').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', now()) },
];

export const ArchiveIndex = () => {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    let cancelled = false;
    Promise.all(AREAS.map((a) => a.count().then(({ count }) => [a.to, count], () => [a.to, null])))
      .then((rows) => { if (!cancelled) setCounts(Object.fromEntries(rows)); });
    return () => { cancelled = true; };
  }, []);
  return (
    <nav aria-label="Archive" className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h2 className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold mb-4">Browse the archive</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none m-0 p-0">
        {AREAS.map((a) => (
          <li key={a.to}>
            <Link to={a.to} data-archive-area={a.to} className="flex flex-col h-full bg-[#EFE2C0] text-[#11100C] border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] p-5 hover:-translate-y-1 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
              <span className="font-condensed text-2xl font-bold uppercase leading-none">{a.title}</span>
              <span className="font-body text-sm text-[#11100C]/80 mt-2">{a.text}</span>
              {counts[a.to] != null && <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#7C2D18] mt-auto pt-3">{counts[a.to]} on record</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
