import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useUserAuth } from '../../context/UserAuthContext';

const STATUS_LABEL = {
  waiting: 'Waiting',
  offered: 'Seats held for you',
  converted: 'Booked',
  expired: 'Offer expired',
  cancelled: 'Left',
  skipped: 'Skipped',
};

// The waitlist lives on each session's page (join / position / offer). This
// section lists upcoming sessions with live availability and, for signed-in
// visitors, their own waitlist places.
export function WaitlistDirectory({ events }) {
  const { user, openLoginModal } = useUserAuth();
  const [availability, setAvailability] = useState({});
  const [mine, setMine] = useState([]);

  const upcoming = events.filter((e) => !['past', 'cancelled', 'draft'].includes(e.dbStatus) && (!e.rawDate || e.rawDate >= new Date().toISOString().slice(0, 10)));
  const ids = upcoming.map((e) => e.id).join(',');

  useEffect(() => {
    if (!isSupabaseConfigured || !ids) return undefined;
    let cancelled = false;
    Promise.all(ids.split(',').map((id) => supabase.rpc('event_availability', { p_event_id: id }).then(({ data }) => [id, data])))
      .then((pairs) => { if (!cancelled) setAvailability(Object.fromEntries(pairs)); });
    return () => { cancelled = true; };
  }, [ids]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setMine([]); return undefined; }
    let cancelled = false;
    supabase.rpc('my_waitlist').then(({ data }) => { if (!cancelled) setMine(data || []); });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="flex flex-col gap-6 font-mono text-xs" data-waitlist-directory>
      {user && mine.length > 0 && (
        <section aria-labelledby="my-waitlist-h" className="border-2 border-[#11100C] p-4 bg-[#F5E9C9]">
          <h3 id="my-waitlist-h" className="font-bold uppercase tracking-widest text-[10px] text-[#B94717] m-0 mb-2">Your waitlist places</h3>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {mine.map((w) => (
              <li key={w.id} className="flex flex-wrap justify-between gap-2">
                <Link to={`/sessions/${w.event_slug}`} className="font-bold underline">{w.event_name}</Link>
                <span>
                  {STATUS_LABEL[w.status] || w.status}
                  {w.status === 'waiting' && w.queue_position ? ` · position ${w.queue_position}` : ''}
                  {w.status === 'offered' && w.offer_expires_at ? ` · until ${new Date(w.offer_expires_at).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length === 0 ? (
        <p className="text-center py-8 border-2 border-dashed border-[#11100C]/40 text-[#11100C]/60 m-0">
          No upcoming sessions right now — check back soon.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {upcoming.map((evt) => {
            const a = availability[evt.id];
            const soldOut = evt.status === 'SOLD OUT' || a?.sold_out;
            return (
              <li key={evt.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#11100C] p-3 bg-[#EFE2C0]">
                <span>
                  <span className="font-bold block">{evt.title}</span>
                  <span className="text-[#11100C]/70">{[evt.date, evt.venue].filter(Boolean).join(' · ')}</span>
                </span>
                <Link to={`/sessions/${evt.slug || evt.id}`}
                  className={`px-3 py-2 border-2 border-[#11100C] font-bold uppercase tracking-wider ${soldOut ? 'bg-[#181614] text-[#E7D5A4]' : 'bg-[#B5532A] text-[#E7D5A4]'}`}>
                  {soldOut ? `Join waitlist${a?.waitlist ? ` (${a.waitlist} waiting)` : ''} →` : a ? `${a.remaining} seats left — book →` : 'View session →'}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!user && (
        <p className="text-[#11100C]/70 m-0">
          Joining a waitlist needs a free Tangy account.{' '}
          <button type="button" className="underline font-bold" onClick={() => openLoginModal('TO USE THE WAITLIST')}>Sign in</button>
        </p>
      )}
      <p className="text-[10px] text-[#11100C]/60 m-0">
        When seats are released they're offered in waitlist order and held for you for a limited time. You'll get an in-app notification (and an email once email is enabled).
      </p>
    </div>
  );
}
