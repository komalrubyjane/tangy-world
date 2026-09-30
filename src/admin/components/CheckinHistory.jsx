import { useState } from 'react';
import { useAdminSession } from '../AdminSession';
import { adminApi } from '../api';
import { useAsync } from '../hooks';
import { P } from '../rbac';
import { Panel, Toolbar, FilterSelect, DataTable, Pagination, Badge, fmt } from '../ui';
import { EventFilter } from './Bookings';
import { useAttendeeEventOptions } from './Attendees';

const PAGE = 50;

// get_checkin_history() scopes rows server-side: staff only ever receive
// check-ins for events they're assigned to.
export const CheckinHistoryTable = ({ eventId: fixedEventId, initialMine = false }) => {
  const { can } = useAdminSession();
  const events = useAttendeeEventOptions();
  const [event, setEvent] = useState('');
  const [mine, setMine] = useState(initialMine ? 'mine' : '');
  const [page, setPage] = useState(0);
  const eventId = fixedEventId || event || null;

  const q = useAsync(() => adminApi.checkinHistory({ eventId, mine: mine === 'mine', limit: PAGE, offset: page * PAGE }), [eventId, mine, page]);
  const rows = q.data || [];
  const count = Number(rows[0]?.total_count || 0);

  const columns = [
    { key: 'time', header: 'Time', render: (r) => <span className="font-mono text-[12px] whitespace-nowrap">{fmt.dateTime(r.checked_in_at)}</span> },
    { key: 'attendee', header: 'Attendee', render: (r) => <span className="text-[#EFE2C0]">{r.attendee_name}</span> },
    { key: 'ticket', header: 'Ticket', render: (r) => <span className="font-mono text-[12px] text-[#C99A2E]">{r.ticket_number}</span> },
    { key: 'event', header: 'Event', hidden: !!fixedEventId, render: (r) => <span className="text-[12.5px]">{r.event_name}</span> },
    { key: 'method', header: 'Method', render: (r) => <Badge status={r.method}>{r.method === 'manual' ? 'Manual' : 'QR scan'}</Badge> },
    { key: 'by', header: 'Checked in by', render: (r) => <span className="text-[12.5px]">{r.checked_in_by_name || '—'}</span> },
    { key: 'notes', header: 'Note', mobileHidden: true, render: (r) => <span className="text-[12px] text-[#E7D5A4]/60">{r.notes || ''}</span> },
  ];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15">
        <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.num(count)} check-in{count === 1 ? '' : 's'}</span>}>
          {!fixedEventId && <EventFilter value={event} onChange={(v) => { setEvent(v); setPage(0); }} events={events} allLabel={can(P.EVENTS_ALL) ? 'All events' : 'All my events'} />}
          <FilterSelect label="Who" value={mine} onChange={(v) => { setMine(v); setPage(0); }} options={[{ value: '', label: 'Everyone' }, { value: 'mine', label: 'Only mine' }]} />
        </Toolbar>
      </div>
      <DataTable columns={columns} rows={rows} loading={q.loading} error={q.error} onRetry={q.reload}
        empty={{ title: 'No check-ins yet', hint: 'Scans and manual check-ins appear here in real time order.', icon: 'History' }} />
      <Pagination page={page} pageCount={Math.max(1, Math.ceil(count / PAGE))} count={count} pageSize={PAGE} setPage={setPage} />
    </Panel>
  );
};
