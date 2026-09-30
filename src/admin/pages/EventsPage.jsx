import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../AdminSession';
import { orIlike } from '../api';
import { useServerTable, useDebounced } from '../hooks';
import { P, EVENT_STATUSES, EVENT_STATUS_LABELS, eventPhase, localISODate } from '../rbac';
import { Page, Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Modal, fmt } from '../ui';
import { EventForm, useVenueOptions } from '../components/EventForm';

const WHEN = [
  { value: '', label: 'Any date' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'past', label: 'Past' },
];

export default function EventsPage() {
  const { can } = useAdminSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { venues } = useVenueOptions();
  const status = params.get('status') || '';
  const when = params.get('when') || '';
  const venue = params.get('venue') || '';
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const creating = params.get('new') === '1' && can(P.EVENTS_MANAGE);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const table = useServerTable({
    table: 'events',
    select: 'id, name, slug, event_date, event_time, venue, venue_id, capacity, price, status, featured',
    deps: [status, when, venue, q],
    build: (query) => {
      const today = localISODate();
      let x = query.order('event_date', { ascending: when === 'upcoming' || when === 'today' });
      if (status) x = x.eq('status', status);
      if (when === 'upcoming') x = x.gt('event_date', today);
      if (when === 'today') x = x.eq('event_date', today);
      if (when === 'past') x = x.lt('event_date', today);
      if (venue) x = x.eq('venue_id', venue);
      return orIlike(x, ['name', 'venue', 'slug'], q);
    },
  });

  const columns = [
    { key: 'date', header: 'Date', render: (e) => <span className="font-mono text-[12px] text-[#C99A2E] whitespace-nowrap">{fmt.date(e.event_date)}{e.event_time ? <span className="text-[#E7D5A4]/60"> · {e.event_time}</span> : null}</span> },
    { key: 'name', header: 'Event', render: (e) => (<div className="min-w-0"><div className="text-[#EFE2C0] flex items-center gap-2">{e.name}{e.featured && <Badge tone="gold">Featured</Badge>}</div><div className="font-mono text-[11px] text-[#E7D5A4]/60">/{e.slug}</div></div>) },
    { key: 'venue', header: 'Venue', render: (e) => <span className="text-[12.5px]">{e.venue || '—'}</span> },
    { key: 'status', header: 'Status', render: (e) => { const phase = eventPhase(e); return <span className="flex gap-1.5"><Badge status={e.status}>{EVENT_STATUS_LABELS[e.status]}</Badge>{phase === 'live' && <Badge status="live">Today</Badge>}</span>; } },
    { key: 'capacity', header: 'Capacity', align: 'right', mobileHidden: true, render: (e) => fmt.num(e.capacity) },
    { key: 'price', header: 'Base price', align: 'right', mobileHidden: true, render: (e) => fmt.money(e.price) },
  ];

  return (
    <Page
      title="Events"
      subtitle="Every Tangy session — drafts, on sale, completed and cancelled."
      actions={can(P.EVENTS_MANAGE) && <Button variant="primary" icon="Plus" onClick={() => setParam('new', '1')}>New event</Button>}
    >
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15">
          <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/60">{fmt.num(table.count)} event{table.count === 1 ? '' : 's'}</span>}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, venue, slug…" />
            <FilterSelect label="Status" value={status} onChange={(v) => setParam('status', v)} options={[{ value: '', label: 'Any status' }, ...EVENT_STATUSES.map((s) => ({ value: s, label: EVENT_STATUS_LABELS[s] }))]} />
            <FilterSelect label="When" value={when} onChange={(v) => setParam('when', v)} options={WHEN} />
            <FilterSelect label="Venue" value={venue} onChange={(v) => setParam('venue', v)} options={[{ value: '', label: 'Any venue' }, ...venues.map((v) => ({ value: v.id, label: v.name }))]} />
          </Toolbar>
        </div>
        <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload}
          onRowClick={(e) => navigate(`/admin-portal/events/${e.id}`)}
          empty={{ title: 'No events yet', hint: status || when || venue || q ? 'No events match these filters.' : 'Create the first Tangy session.', icon: 'CalendarDays', action: can(P.EVENTS_MANAGE) && <Button size="sm" icon="Plus" onClick={() => setParam('new', '1')}>New event</Button> }} />
        <Pagination {...table} />
      </Panel>
      {creating && (
        <Modal title="Create event" wide onClose={() => setParam('new', '')}>
          <EventForm onCancel={() => setParam('new', '')} onSaved={(evt) => navigate(`/admin-portal/events/${evt.id}`)} />
        </Modal>
      )}
    </Page>
  );
}
