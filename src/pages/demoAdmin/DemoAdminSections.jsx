import { StatusBadge, StatCard, EmptyState } from '../../admin/AdminUI';
import {
  DEMO_EVENTS, DEMO_BOOKINGS, DEMO_WAITLIST, DEMO_ARTISTS, DEMO_CREW_APPLICATIONS,
  DEMO_VOLUNTEER_APPLICATIONS, DEMO_COLLABORATIONS, DEMO_USERS, DEMO_CONTACT_ENQUIRIES,
  DEMO_PRIVATE_ENQUIRIES, DEMO_ADMIN_STATS,
} from './demoAdminData';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// Demo-mode replacements for the real Admin Control Room sections
// (src/admin/sections/*.jsx). Those real sections all query Supabase
// directly and can't easily be told "use this data instead" without
// touching a dozen already-shipped files — so rather than risk that, these
// are small, independent, read-only components fed entirely by
// demoAdminData.js. They reuse the same presentational building blocks
// (StatusBadge/StatCard/EmptyState from AdminUI.jsx — pure UI, no data
// fetching) so the demo still looks like the real Control Room. No
// mutation controls exist here at all — nothing to disable, because there
// was never a Supabase call to begin with.

const SectionHeader = ({ children }) => (
  <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">{children}</h3>
);

const Table = ({ columns, rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
          {columns.map((c) => <th key={c.key} className="py-2 pr-3">{c.header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-[#E7D5A4]/10">
            {columns.map((c) => <td key={c.key} className="py-3 pr-3 align-top">{c.render(row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DemoOverviewSection = () => {
  const s = DEMO_ADMIN_STATS;
  const cards = [
    { label: 'TOTAL REVENUE', value: `₹${s.revenue.toLocaleString('en-IN')}`, sub: `${s.confirmedBookings} confirmed bookings` },
    { label: 'LIVE EVENTS', value: s.events, sub: 'on the calendar' },
    { label: 'ARTIST ROSTER', value: s.approvedArtists, sub: `${s.pendingArtists} pending review` },
    { label: 'CHECK-INS', value: s.checkins, sub: 'attendees checked in' },
    { label: 'CREW APPLICATIONS', value: s.pendingCrew, sub: 'awaiting review' },
    { label: 'COLLABORATIONS', value: s.pendingCollab, sub: 'awaiting review' },
    { label: 'PRIVATE ENQUIRIES', value: s.pendingPrivate, sub: 'awaiting review' },
    { label: 'NEW MESSAGES', value: s.newContact, sub: `${s.waitlist} on waitlists` },
  ];
  return (
    <div className="flex flex-col gap-8">
      <div className="p-3 bg-[#B94717]/10 border border-[#B94717]/40 text-[10px] font-bold uppercase text-[#E7D5A4]/70">
        DEMO DATA — these numbers are fabricated for the team demo, not from the real database.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>
      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <SectionHeader>RECENT BOOKINGS (DEMO)</SectionHeader>
        <div className="flex flex-col gap-2.5">
          {DEMO_BOOKINGS.map((b) => (
            <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs border-b border-[#E7D5A4]/10 pb-2.5 last:border-0">
              <div><span className="font-bold text-[#C99A2E]">{b.registration_code}</span><span className="text-[#E7D5A4]/70"> · {b.attendee_name} · {b.events?.name}</span></div>
              <div className="flex items-center gap-2"><span className="font-bold">₹{b.amount}</span><StatusBadge status={b.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DemoEventsSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <div className="flex justify-between items-center border-b border-[#C99A2E]/30 pb-2 mb-4">
      <h3 className="text-lg font-bold text-[#C99A2E]">EVENTS &amp; SESSIONS (DEMO)</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {DEMO_EVENTS.map((evt) => (
        <div key={evt.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <div className="text-[10px] text-[#C99A2E] font-bold">{evt.event_date}</div>
              {evt.featured && <span className="text-[8px] bg-[#C99A2E] text-[#11100C] px-1.5 py-0.5 font-bold">FEATURED</span>}
            </div>
            <h4 className="font-condensed text-xl font-bold text-[#E7D5A4] mt-1">{evt.name}</h4>
            <div className="text-xs opacity-70 mt-1">{evt.venue}</div>
            <div className="mt-3 text-xs space-y-1">
              <div>Cap: <span className="font-bold">{evt.capacity}</span></div>
              <div>Price: <span className="font-bold text-[#C99A2E]">₹{evt.price}</span></div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#C99A2E]/20"><StatusBadge status={evt.status} /></div>
        </div>
      ))}
    </div>
    <p className="text-[9px] text-[#E7D5A4]/40 mt-5">DEMO DATA — event creation/editing is disabled in demo mode.</p>
  </div>
);

export const DemoBookingsSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>BOOKINGS &amp; TICKETS (DEMO)</SectionHeader>
    <Table
      columns={[
        { key: 'code', header: 'CODE', render: (b) => <span className="font-bold text-[#C99A2E]">{b.registration_code}</span> },
        { key: 'attendee', header: 'ATTENDEE', render: (b) => <>{b.attendee_name}<br /><span className="opacity-60">{b.attendee_email}</span></> },
        { key: 'event', header: 'EVENT', render: (b) => b.events?.name || '—' },
        { key: 'qty', header: 'QTY', render: (b) => b.quantity },
        { key: 'amount', header: 'AMOUNT', render: (b) => <span className="font-bold">₹{b.amount}</span> },
        { key: 'status', header: 'STATUS', render: (b) => <StatusBadge status={b.status} /> },
      ]}
      rows={DEMO_BOOKINGS}
    />
  </div>
);

export const DemoAttendeesSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>ATTENDEES (DEMO)</SectionHeader>
    <Table
      columns={[
        { key: 'attendee', header: 'ATTENDEE', render: (b) => <>{b.attendee_name}<br /><span className="opacity-60">{b.attendee_email}</span></> },
        { key: 'event', header: 'EVENT', render: (b) => b.events?.name || '—' },
        { key: 'code', header: 'CODE', render: (b) => <span className="font-bold text-[#C99A2E]">{b.registration_code}</span> },
        { key: 'checkin', header: 'CHECK-IN', render: (b) => (b.id === 'demo-bkg-2' ? <StatusBadge status="confirmed" /> : <span className="text-[10px] text-[#E7D5A4]/40 uppercase font-bold">Not checked in</span>) },
      ]}
      rows={DEMO_BOOKINGS}
    />
  </div>
);

export const DemoArtistsSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>ARTIST APPLICATIONS &amp; ROSTER (DEMO)</SectionHeader>
    <Table
      columns={[
        { key: 'name', header: 'NAME', render: (a) => <>{a.name}<br /><span className="opacity-60 text-[10px]">{a.email}</span></> },
        { key: 'genre', header: 'GENRE', render: (a) => a.genre },
        { key: 'city', header: 'CITY', render: (a) => a.city },
        { key: 'status', header: 'STATUS', render: (a) => <StatusBadge status={a.status} /> },
      ]}
      rows={DEMO_ARTISTS}
    />
  </div>
);

export const DemoApplicationsSection = () => (
  <div className="flex flex-col gap-6">
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <SectionHeader>CREW &amp; VOLUNTEER APPLICATIONS (DEMO)</SectionHeader>
      <Table
        columns={[
          { key: 'name', header: 'APPLICANT', render: (r) => <>{r.name}<br /><span className="opacity-60">{r.email}</span></> },
          { key: 'category', header: 'CATEGORY', render: (r) => <span className="uppercase">{r.category}</span> },
          { key: 'role', header: 'ROLE INTEREST', render: (r) => <span className="font-bold">{r.role_interest}</span> },
          { key: 'status', header: 'STATUS', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={[...DEMO_CREW_APPLICATIONS, ...DEMO_VOLUNTEER_APPLICATIONS]}
      />
    </div>
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <SectionHeader>COLLABORATIONS — VENDORS / SPONSORS / VENUE &amp; HOST (DEMO)</SectionHeader>
      <Table
        columns={[
          { key: 'type', header: 'TYPE', render: (c) => <span className="uppercase font-bold text-[10px] text-[#C99A2E]">{c.type.replace('_', ' ')}</span> },
          { key: 'business', header: 'BUSINESS', render: (c) => <span className="font-bold">{c.business_name}</span> },
          { key: 'contact', header: 'CONTACT', render: (c) => <>{c.contact_name}<br /><span className="opacity-60">{c.email}</span></> },
          { key: 'status', header: 'STATUS', render: (c) => <StatusBadge status={c.status} /> },
        ]}
        rows={DEMO_COLLABORATIONS}
      />
    </div>
  </div>
);

export const DemoUsersSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>USERS &amp; ROLES (DEMO)</SectionHeader>
    <Table
      columns={[
        { key: 'name', header: 'NAME', render: (u) => <span className="font-bold">{u.full_name}</span> },
        { key: 'email', header: 'EMAIL', render: (u) => u.email },
        { key: 'passport', header: 'PASSPORT ID', render: (u) => u.passport_id },
        { key: 'role', header: 'ROLE', render: (u) => <span className="uppercase text-[10px] font-bold text-[#C99A2E]">{u.role}</span> },
      ]}
      rows={DEMO_USERS}
    />
  </div>
);

export const DemoPaymentsSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>PAYMENTS LEDGER (DEMO)</SectionHeader>
    <Table
      columns={[
        { key: 'code', header: 'CODE', render: (b) => <span className="font-bold text-[#C99A2E]">{b.registration_code}</span> },
        { key: 'attendee', header: 'ATTENDEE', render: (b) => b.attendee_name },
        { key: 'event', header: 'EVENT', render: (b) => b.events?.name || '—' },
        { key: 'amount', header: 'AMOUNT', render: (b) => <span className="font-bold">₹{b.amount}</span> },
        { key: 'status', header: 'STATUS', render: (b) => <StatusBadge status={b.status} /> },
      ]}
      rows={DEMO_BOOKINGS}
    />
    <p className="text-[9px] text-[#E7D5A4]/40 mt-4">DEMO DATA — no real Razorpay integration is touched in demo mode.</p>
  </div>
);

export const DemoEnquiriesSection = () => (
  <div className="flex flex-col gap-6">
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <SectionHeader>CONTACT ENQUIRIES (DEMO)</SectionHeader>
      <div className="flex flex-col gap-3">
        {DEMO_CONTACT_ENQUIRIES.map((c) => (
          <div key={c.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div><span className="font-bold">{c.name}</span> <span className="opacity-60 text-[10px]">· {c.email}</span><div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{c.inquiry_type} — {c.subject}</div></div>
              <StatusBadge status={c.status} />
            </div>
            <p className="text-xs text-[#E7D5A4]/80">{c.message}</p>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <SectionHeader>PRIVATE SESSION ENQUIRIES (DEMO)</SectionHeader>
      <div className="flex flex-col gap-3">
        {DEMO_PRIVATE_ENQUIRIES.map((p) => (
          <div key={p.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4">
            <div className="flex justify-between items-start gap-2 mb-2">
              <div><span className="font-bold">{p.name}</span> <span className="opacity-60 text-[10px]">· {p.email}</span><div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{p.type.replace('_', ' ')} — {p.preferred_date} — {p.guest_count} guests</div></div>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-xs text-[#E7D5A4]/80">{p.message}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const DemoWaitlistSection = () => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
    <SectionHeader>SESSION WAITLIST (DEMO)</SectionHeader>
    {DEMO_WAITLIST.length === 0 ? <EmptyState>NOBODY ON THE WAITLIST.</EmptyState> : (
      <Table
        columns={[
          { key: 'name', header: 'NAME', render: (w) => <span className="font-bold">{w.name}</span> },
          { key: 'email', header: 'EMAIL', render: (w) => w.email },
          { key: 'event', header: 'SESSION', render: (w) => w.events?.name || '—' },
        ]}
        rows={DEMO_WAITLIST}
      />
    )}
  </div>
);
