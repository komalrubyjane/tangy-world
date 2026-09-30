import { useState } from 'react';
import { useAdminSession } from '../AdminSession';
import { adminApi, list, orIlike } from '../api';
import { useServerTable, useDebounced, useAsync } from '../hooks';
import { P, TICKET_TIERS } from '../rbac';
import { Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, ConfirmDialog, Icon, fmt, useToast } from '../ui';
import { partyState } from '../../lib/checkinService';
import { EventFilter, useEventOptions } from './Bookings';

const TIER_NAME = Object.fromEntries(TICKET_TIERS.map((t) => [t.id, t.name]));
const CHECKIN_FILTERS = [
  { value: '', label: 'Any check-in state' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'valid', label: 'Not checked in' },
  { value: 'cancelled', label: 'Cancelled tickets' },
];

// Staff see only events they're assigned to; admins see everything.
export function useAttendeeEventOptions() {
  const { can } = useAdminSession();
  const all = useEventOptions();
  const mine = useAsync(() => (can(P.EVENTS_ALL) ? Promise.resolve([]) : adminApi.myCheckinEvents()), []).data || [];
  return can(P.EVENTS_ALL) ? all : mine;
}

const RESULT_TOAST = {
  valid: ['Checked in', 'good'],
  already_checked_in: ['Already checked in', 'bad'],
  cancelled: ['Ticket is cancelled', 'bad'],
  payment_not_confirmed: ['Payment not confirmed', 'bad'],
  not_assigned: ["You're not assigned to this event", 'bad'],
  manual_disabled: ['Manual check-in is disabled in System Settings', 'bad'],
  wrong_event: ['Ticket belongs to a different event', 'bad'],
  not_found: ['Ticket not found', 'bad'],
};

function applyFilters(query, { eventId, tier, checkin, bookingStatus, q }) {
  let x = query.order('event_date', { ascending: false }).order('attendee_name', { ascending: true });
  if (eventId) x = x.eq('event_id', eventId);
  if (tier) x = x.eq('tier', tier);
  if (checkin) x = x.eq('ticket_status', checkin);
  if (bookingStatus) x = x.eq('booking_status', bookingStatus);
  return orIlike(x, ['guest_name', 'attendee_name', 'registration_code', 'ticket_number'], q);
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const AttendeesTable = ({ eventId: fixedEventId, initialEventId = '', initialSearch = '' }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const events = useAttendeeEventOptions();
  const [event, setEvent] = useState(initialEventId);
  const [tier, setTier] = useState('');
  const [checkin, setCheckin] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [manual, setManual] = useState(null);
  const [exporting, setExporting] = useState(false);
  const q = useDebounced(search);
  const eventId = fixedEventId || event;
  const filters = { eventId, tier, checkin, q };
  const seesContacts = can(P.ATTENDEES_ALL);

  const table = useServerTable({
    table: 'attendee_tickets',
    deps: [eventId, tier, checkin, q],
    build: (query) => applyFilters(query, filters),
  });

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { rows } = await list('attendee_tickets', { build: (query) => applyFilters(query, filters), from: 0, to: 4999, count: null });
      const header = ['Booking', 'Primary booker', 'Attendee', 'Email', 'Phone', 'Ticket', 'Tier', 'Event', 'Event date', 'Booking status', 'Payment status', 'Check-in status', 'Checked in at', 'Checked in by', 'Method', 'Party size', 'Party checked in'];
      // One row per attendee (a 5-person booking is 5 rows), never one per booking.
      const lines = rows.map((r) => [r.registration_code, r.attendee_name, r.guest_name || '', r.attendee_email, r.attendee_phone, r.ticket_number, TIER_NAME[r.tier] || r.tier, r.event_name, r.event_date,
        r.booking_status, r.payment_status || '', r.ticket_status === 'checked_in' ? 'Checked in' : r.ticket_status === 'cancelled' ? 'Cancelled' : 'Pending',
        r.checked_in_at, r.checked_in_by_name || '', r.checkin_method, r.party_size, r.party_checked_in].map(csvCell).join(','));
      const blob = new Blob([[header.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tangy-attendees-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      toast(err.message, 'bad');
    }
    setExporting(false);
  };

  const columns = [
    // The named attendee (0023); older tickets have no name and show the booker.
    { key: 'name', header: 'Attendee', render: (r) => (
      <div className="min-w-0" data-attendee={r.guest_name || r.ticket_number}>
        <div className="text-[#EFE2C0]">{r.guest_name || <span className="text-[#E7D5A4]/60">Guest · {r.attendee_name}</span>}</div>
        <div className="text-[12px] text-[#E7D5A4]/60 truncate max-w-[240px]">{r.guest_name && r.guest_name !== r.attendee_name ? `Booked by ${r.attendee_name}` : 'Booker'}{seesContacts && r.attendee_email ? ` · ${r.attendee_email}` : ''}</div>
      </div>) },
    { key: 'ticket', header: 'Ticket', render: (r) => <span className="font-mono text-[12px] text-[#C99A2E]">{r.ticket_number}</span> },
    { key: 'tier', header: 'Type', render: (r) => <span className="text-[12.5px]">{TIER_NAME[r.tier] || r.tier || 'General'}</span> },
    { key: 'event', header: 'Event', hidden: !!fixedEventId, mobileHidden: true, render: (r) => <span className="text-[12.5px]">{r.event_name} <span className="text-[#E7D5A4]/60">· {fmt.date(r.event_date)}</span></span> },
    { key: 'booking', header: 'Booking', mobileHidden: true, render: (r) => (<span className="flex items-center gap-2"><span className="font-mono text-[11.5px] text-[#E7D5A4]/60">{r.registration_code}</span>{r.booking_status !== 'confirmed' && <Badge status={r.booking_status} />}{r.booking_source === 'complimentary' && <Badge status="complimentary">Comp</Badge>}</span>) },
    { key: 'checkin', header: 'Check-in', render: (r) => (r.checked_in_at
      ? <span className="flex items-center gap-2"><Badge status="checked_in">Checked in {fmt.time(r.checked_in_at)}</Badge>{r.checkin_method === 'manual' && <Badge status="manual" />}</span>
      : r.ticket_status === 'cancelled' ? <Badge status="cancelled" /> : <span className="text-[12px] text-[#E7D5A4]/60">Pending</span>) },
    // The booking's progress, so a group reads "3 / 5 checked in · Partial" and a
    // single ticket "1 / 1 checked in · Complete" — text + icon, not colour alone.
    { key: 'party', header: 'Party', render: (r) => {
      const st = partyState(r.party_checked_in, r.party_size);
      return st ? (
        <span className="flex items-center gap-2 whitespace-nowrap" data-party={r.registration_code}>
          <span className="text-[12.5px] tabular-nums">{r.party_checked_in} / {r.party_size} checked in</span>
          <Badge tone={st.tone}><span className="inline-flex items-center gap-1"><Icon name={st.icon} size={11} />{st.label}</span></Badge>
        </span>
      ) : <Badge status="cancelled" />;
    } },
    { key: 'action', header: '', align: 'right', hidden: !can(P.CHECKIN), render: (r) => (r.ticket_status === 'valid' && r.booking_status === 'confirmed' && r.token
      ? <Button size="sm" onClick={(e) => { e.stopPropagation(); setManual(r); }}>Check in</Button> : null) },
  ];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15">
        <Toolbar right={
          <>
            <span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.num(table.count)} ticket{table.count === 1 ? '' : 's'}</span>
            {seesContacts && <Button size="sm" icon="Download" onClick={exportCsv} disabled={exporting || table.count === 0}>{exporting ? 'Exporting…' : 'CSV'}</Button>}
          </>
        }>
          <SearchInput value={search} onChange={setSearch} placeholder="Name, booking code, ticket #…" />
          {!fixedEventId && <EventFilter value={event} onChange={setEvent} events={events} allLabel={can(P.EVENTS_ALL) ? 'All events' : 'All my events'} />}
          <FilterSelect label="Ticket type" value={tier} onChange={setTier} options={[{ value: '', label: 'All ticket types' }, ...TICKET_TIERS.map((t) => ({ value: t.id, label: t.name }))]} />
          <FilterSelect label="Check-in" value={checkin} onChange={setCheckin} options={CHECKIN_FILTERS} />
        </Toolbar>
      </div>
      <DataTable columns={columns} rows={table.rows} rowKey="ticket_id" loading={table.loading} error={table.error} onRetry={table.reload}
        empty={{ title: 'No attendees found', hint: can(P.EVENTS_ALL) ? 'Attendees appear once bookings are paid and tickets issued.' : 'Only events you are assigned to are shown.', icon: 'Users' }} />
      <Pagination {...table} />
      {manual && (
        <ConfirmDialog
          title={`Check in ${manual.guest_name || manual.attendee_name}?`}
          message={`${manual.ticket_number} · ${TIER_NAME[manual.tier] || 'General'} · ${manual.event_name}. Manual check-ins are logged with your name.`}
          confirmLabel="Check in" tone="success"
          fields={[{ name: 'notes', label: 'Note', placeholder: 'e.g. QR unreadable, ID verified' }]}
          onConfirm={async ({ notes }) => {
            const res = await adminApi.checkIn(manual.token, manual.event_id, 'manual', notes || null);
            const [msg, tone] = RESULT_TOAST[res?.result] || ['Unable to verify ticket', 'bad'];
            toast(`${manual.guest_name || manual.attendee_name}: ${msg}`, tone);
            table.reload();
          }}
          onClose={() => setManual(null)}
        />
      )}
    </Panel>
  );
};
