import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { NotConfiguredState, StatusBadge, StatCard } from '../AdminUI';

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c || 0;
}

// The control room's front page — every number below is a real count query
// against the live tables (no fabricated stats). `onNavigate` lets a pending
// action jump straight to the section that resolves it.
export const OverviewSection = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingArtistRows, setPendingArtistRows] = useState([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    Promise.all([
      count('bookings', (q) => q.eq('status', 'confirmed')),
      count('bookings', (q) => q.eq('status', 'pending')),
      count('bookings', (q) => q.eq('status', 'failed')),
      count('events', (q) => q.neq('status', 'draft')),
      count('artists', (q) => q.eq('status', 'pending')),
      count('artists', (q) => q.eq('status', 'approved')),
      count('crew_applications', (q) => q.eq('status', 'pending')),
      count('collaborations', (q) => q.eq('status', 'pending')),
      count('private_enquiries', (q) => q.eq('status', 'pending')),
      count('contact_enquiries', (q) => q.eq('status', 'new')),
      count('waitlist'),
      count('checkins'),
      supabase.from('bookings').select('amount, quantity').eq('status', 'confirmed'),
    ]).then(([confirmedBookings, pendingBookings, failedBookings, events, pendingArtists, approvedArtists, pendingCrew, pendingCollab, pendingPrivate, newContact, waitlist, checkins, revenueRes]) => {
      if (cancelled) return;
      const revenue = (revenueRes.data || []).reduce((sum, b) => sum + (b.amount || 0), 0);
      const totalAttendees = (revenueRes.data || []).reduce((sum, b) => sum + (b.quantity || 0), 0);
      setStats({ confirmedBookings, pendingBookings, failedBookings, events, pendingArtists, approvedArtists, pendingCrew, pendingCollab, pendingPrivate, newContact, waitlist, checkins, revenue, totalAttendees });
    });

    supabase
      .from('bookings')
      .select('registration_code, attendee_name, attendee_email, amount, status, created_at, events(name)')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (!cancelled) setRecentBookings(data || []); });

    supabase
      .from('artists')
      .select('id, name, applied_at')
      .eq('status', 'pending')
      .order('applied_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (!cancelled) setPendingArtistRows(data || []); });

    return () => { cancelled = true; };
  }, []);

  if (!isSupabaseConfigured) return <NotConfiguredState />;
  if (!stats) return <div className="text-xs text-[#E7D5A4]/60 font-mono">LOADING OVERVIEW...</div>;

  const cards = [
    { label: 'TOTAL REVENUE', value: `₹${stats.revenue.toLocaleString('en-IN')}`, sub: `${stats.confirmedBookings} confirmed bookings` },
    { label: 'PENDING / FAILED PAYMENTS', value: `${stats.pendingBookings} / ${stats.failedBookings}`, sub: 'bookings awaiting or that failed payment' },
    { label: 'LIVE EVENTS', value: stats.events, sub: 'published on the calendar' },
    { label: 'ARTIST ROSTER', value: stats.approvedArtists, sub: `${stats.pendingArtists} pending review` },
    { label: 'CHECK-INS', value: `${stats.checkins} / ${stats.totalAttendees}`, sub: 'checked in / total confirmed attendees' },
    { label: 'APPLICATIONS', value: stats.pendingCrew + stats.pendingCollab, sub: 'crew + collaborations awaiting review' },
    { label: 'ENQUIRIES', value: stats.pendingPrivate + stats.newContact, sub: 'private + contact awaiting reply' },
    { label: 'WAITLIST', value: stats.waitlist, sub: 'entries across all sessions' },
  ];

  const pendingActions = [
    ...pendingArtistRows.map((a) => ({ id: `art-${a.id}`, label: `Review artist application — ${a.name}`, nav: 'artists' })),
    ...(stats.pendingCrew > 0 ? [{ id: 'crew-pending', label: `${stats.pendingCrew} crew/volunteer application(s) awaiting review`, nav: 'crew' }] : []),
    ...(stats.pendingCollab > 0 ? [{ id: 'collab-pending', label: `${stats.pendingCollab} collaboration(s) awaiting review`, nav: 'collab' }] : []),
    ...(stats.pendingPrivate > 0 ? [{ id: 'private-pending', label: `${stats.pendingPrivate} private session enquiry(ies) awaiting reply`, nav: 'private' }] : []),
    ...(stats.newContact > 0 ? [{ id: 'contact-new', label: `${stats.newContact} new contact message(s)`, nav: 'contact' }] : []),
  ].slice(0, 8);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
          <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PENDING ACTIONS</h3>
          {pendingActions.length === 0 ? (
            <div className="text-xs text-[#E7D5A4]/50">Nothing needs your attention right now.</div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pendingActions.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => onNavigate?.(a.nav)}
                    className="w-full flex items-center gap-2 text-xs bg-[#11100C] border border-[#C99A2E]/20 hover:border-[#C99A2E] px-3 py-2.5 rounded-sm text-left transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                    <span className="text-[#E7D5A4]/85">{a.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
          <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">RECENT BOOKINGS</h3>
          {recentBookings.length === 0 ? (
            <div className="text-xs text-[#E7D5A4]/50">No bookings yet.</div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recentBookings.map((b) => (
                <li key={b.registration_code} className="flex justify-between items-start gap-3 text-xs border-b border-[#E7D5A4]/10 pb-2.5 last:border-0">
                  <div className="min-w-0">
                    <span className="font-bold text-[#C99A2E]">{b.registration_code}</span>
                    <span className="text-[#E7D5A4]/70"> · {b.attendee_name} · {b.events?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold">₹{b.amount}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
