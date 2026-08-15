import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { NotConfiguredState, StatusBadge } from '../AdminUI';

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c || 0;
}

export const OverviewSection = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    Promise.all([
      count('bookings', (q) => q.eq('status', 'confirmed')),
      count('events'),
      count('artists', (q) => q.eq('status', 'pending')),
      count('artists', (q) => q.eq('status', 'approved')),
      count('crew_applications', (q) => q.eq('status', 'pending')),
      count('collaborations', (q) => q.eq('status', 'pending')),
      count('private_enquiries', (q) => q.eq('status', 'pending')),
      count('contact_enquiries', (q) => q.eq('status', 'new')),
      count('waitlist'),
      count('checkins'),
      supabase.from('bookings').select('amount').eq('status', 'confirmed'),
    ]).then(([confirmedBookings, events, pendingArtists, approvedArtists, pendingCrew, pendingCollab, pendingPrivate, newContact, waitlist, checkins, revenueRes]) => {
      if (cancelled) return;
      const revenue = (revenueRes.data || []).reduce((sum, b) => sum + (b.amount || 0), 0);
      setStats({ confirmedBookings, events, pendingArtists, approvedArtists, pendingCrew, pendingCollab, pendingPrivate, newContact, waitlist, checkins, revenue });
    });

    supabase
      .from('bookings')
      .select('registration_code, attendee_name, attendee_email, amount, status, events(name)')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (!cancelled) setRecentBookings(data || []); });

    return () => { cancelled = true; };
  }, []);

  if (!isSupabaseConfigured) return <NotConfiguredState />;
  if (!stats) return <div className="text-xs text-[#E7D5A4]/60">LOADING OVERVIEW...</div>;

  const cards = [
    { label: 'TOTAL REVENUE', value: `₹${stats.revenue.toLocaleString()}`, sub: `${stats.confirmedBookings} confirmed bookings` },
    { label: 'LIVE EVENTS', value: stats.events, sub: 'sessions on the calendar' },
    { label: 'ARTIST ROSTER', value: stats.approvedArtists, sub: `${stats.pendingArtists} pending review` },
    { label: 'CHECK-INS', value: stats.checkins, sub: 'attendees checked in' },
    { label: 'CREW APPLICATIONS', value: stats.pendingCrew, sub: 'awaiting review' },
    { label: 'COLLABORATIONS', value: stats.pendingCollab, sub: 'awaiting review' },
    { label: 'PRIVATE ENQUIRIES', value: stats.pendingPrivate, sub: 'awaiting review' },
    { label: 'NEW MESSAGES', value: stats.newContact, sub: `${stats.waitlist} on waitlists` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#191410] border border-[#C99A2E]/60 p-5 rounded-sm">
            <div className="text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">{c.label}</div>
            <div className="text-3xl font-bold text-[#E7D5A4]">{c.value}</div>
            <div className="text-[9px] text-[#E7D5A4]/50 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">RECENT BOOKINGS</h3>
        {recentBookings.length === 0 ? (
          <div className="text-xs text-[#E7D5A4]/50">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                  <th className="py-2">CODE</th>
                  <th className="py-2">PATRON</th>
                  <th className="py-2">EVENT</th>
                  <th className="py-2">AMOUNT</th>
                  <th className="py-2">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.registration_code} className="border-b border-[#E7D5A4]/10">
                    <td className="py-2.5 font-bold text-[#C99A2E]">{b.registration_code}</td>
                    <td className="py-2.5">{b.attendee_name} ({b.attendee_email})</td>
                    <td className="py-2.5">{b.events?.name}</td>
                    <td className="py-2.5">₹{b.amount}</td>
                    <td className="py-2.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
