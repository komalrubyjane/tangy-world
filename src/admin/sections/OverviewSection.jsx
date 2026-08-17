import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { isMockAuth } from '../../config/auth';
import { adminStatsService } from '../../services/adminStatsService';
import { NotConfiguredState, StatusBadge } from '../AdminUI';

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c || 0;
}

const MockOverview = () => {
  const stats = adminStatsService.getOverview();
  const recentBookings = adminStatsService.getRecentBookings(5);
  const upcomingSessions = adminStatsService.getUpcomingSessions(4);
  const pendingActions = adminStatsService.getPendingActions();
  const activity = adminStatsService.getRecentActivity(8);

  const cards = [
    { label: 'TOTAL USERS', value: stats.totalUsers.toLocaleString('en-IN') },
    { label: 'UPCOMING EVENTS', value: stats.upcomingEvents },
    { label: 'TICKETS SOLD', value: stats.ticketsSold.toLocaleString('en-IN') },
    { label: 'REVENUE', value: `₹${stats.revenue.toLocaleString('en-IN')}` },
    { label: 'ARTISTS', value: stats.artists, sub: `${stats.pendingArtists} pending` },
    { label: 'CREW', value: stats.crew, sub: `${stats.pendingCrew} pending` },
    { label: 'VOLUNTEERS', value: stats.volunteers, sub: `${stats.pendingVolunteers} pending` },
    { label: 'OPEN ENQUIRIES', value: stats.openEnquiries },
    { label: 'PENDING AGENTS', value: stats.pendingAgents },
    { label: 'WAITLIST', value: stats.waitlist },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <div key={c.label} className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-5 rounded-sm hover:border-[#C99A2E] transition-colors" style={{ animation: `cardIn 0.3s ease ${i * 0.03}s both` }}>
            <div className="text-[9px] sm:text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">{c.label}</div>
            <div className="text-xl sm:text-3xl font-bold text-[#E7D5A4]">{c.value}</div>
            {c.sub && <div className="text-[9px] text-[#E7D5A4]/50 mt-1">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
          <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">RECENT ACTIVITY</h3>
          {activity.length === 0 ? (
            <div className="text-xs text-[#E7D5A4]/50">No activity yet.</div>
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between items-start gap-3 text-xs border-b border-[#E7D5A4]/10 pb-2.5 last:border-0">
                  <span className="text-[#E7D5A4]/85">{a.text}</span>
                  <span className="text-[#E7D5A4]/40 whitespace-nowrap text-[10px]">{a.timeAgo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
          <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PENDING ACTIONS</h3>
          {pendingActions.length === 0 ? (
            <div className="text-xs text-[#E7D5A4]/50">Nothing needs your attention right now.</div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pendingActions.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-xs bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2.5 rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
                  <span className="text-[#E7D5A4]/85">{a.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
        <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">UPCOMING SESSIONS</h3>
        {upcomingSessions.length === 0 ? (
          <div className="text-xs text-[#E7D5A4]/50">No sessions scheduled.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {upcomingSessions.map((ev) => (
              <div key={ev.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-3.5 rounded-sm">
                <div className="text-[9px] text-[#C99A2E] font-bold">{ev.date}</div>
                <div className="font-display font-bold text-sm text-[#E7D5A4] mt-1">{ev.name}</div>
                <div className="text-[10px] text-[#E7D5A4]/60 mt-1">{ev.venue}</div>
                <div className="text-[10px] text-[#E7D5A4]/50 mt-2">{ev.sold}/{ev.capacity} sold</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 sm:p-6 rounded-sm">
        <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">RECENT BOOKINGS</h3>
        {recentBookings.length === 0 ? (
          <div className="text-xs text-[#E7D5A4]/50">No bookings yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-b border-[#E7D5A4]/10 pb-2.5 last:border-0">
                <div>
                  <span className="font-bold text-[#C99A2E]">{b.registrationCode}</span>
                  <span className="text-[#E7D5A4]/70"> · {b.attendeeName} · {b.event?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">₹{b.amount}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const OverviewSection = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (isMockAuth || !isSupabaseConfigured) return;
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

  if (isMockAuth) return <MockOverview />;
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
