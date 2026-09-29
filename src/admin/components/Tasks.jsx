import { useState } from 'react';
import { useAdminSession } from '../AdminSession';
import { update, orIlike } from '../api';
import { useServerTable, useDebounced } from '../hooks';
import { P } from '../rbac';
import { Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, fmt, useToast, cx } from '../ui';
import { EventFilter } from './Bookings';
import { useAttendeeEventOptions } from './Attendees';

const STATUS_FILTERS = [
  { value: 'open', label: 'Open tasks' },
  { value: 'done', label: 'Done' },
  { value: '', label: 'All tasks' },
];
const TASK_STATUSES = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

// Tasks across events. RLS scopes staff to tasks on their own assignments,
// so the same query serves "my tasks" and the admin overview.
export const TasksTable = ({ eventId: fixedEventId, initialStatus = 'open' }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const events = useAttendeeEventOptions();
  const [event, setEvent] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const eventId = fixedEventId || event;

  const table = useServerTable({
    table: 'event_tasks',
    select: 'id, title, description, status, priority, due_at, event_assignments!inner(id, title, assignee_role, event_id, profiles(full_name, email), events(id, name, event_date))',
    deps: [eventId, status, q],
    build: (query) => {
      let x = query.order('status', { ascending: true }).order('due_at', { ascending: true, nullsFirst: false });
      if (eventId) x = x.eq('event_assignments.event_id', eventId);
      if (status === 'open') x = x.neq('status', 'done');
      if (status === 'done') x = x.eq('status', 'done');
      return orIlike(x, ['title'], q);
    },
  });

  const setTaskStatus = async (t, s) => {
    try { await update('event_tasks', t.id, { status: s }); table.reload(); } catch (err) { toast(err.message, 'bad'); }
  };

  const now = Date.now();
  const columns = [
    { key: 'title', header: 'Task', render: (t) => (<div className="min-w-0"><div className={cx('text-[#EFE2C0]', t.status === 'done' && 'line-through opacity-50')}>{t.title}</div>{t.description && <div className="text-[12px] text-[#E7D5A4]/45 truncate max-w-[320px]">{t.description}</div>}</div>) },
    { key: 'event', header: 'Event', hidden: !!fixedEventId, render: (t) => <span className="text-[12.5px]">{t.event_assignments?.events?.name}</span> },
    { key: 'who', header: 'Assignee', hidden: !can(P.TEAM), render: (t) => <span className="text-[12.5px]">{t.event_assignments?.profiles?.full_name || t.event_assignments?.profiles?.email} <span className="text-[#E7D5A4]/40">· {t.event_assignments?.title}</span></span> },
    { key: 'due', header: 'Due', render: (t) => (t.due_at ? <span className={cx('font-mono text-[12px]', t.status !== 'done' && new Date(t.due_at).getTime() < now && 'text-[#ef6b5e]')}>{fmt.dateTime(t.due_at)}</span> : <span className="text-[#E7D5A4]/30">—</span>) },
    { key: 'priority', header: 'Priority', mobileHidden: true, render: (t) => <Badge tone={t.priority === 'high' ? 'bad' : t.priority === 'low' ? 'muted' : 'info'}>{t.priority}</Badge> },
    { key: 'status', header: 'Status', render: (t) => (
      <select aria-label="Task status" value={t.status} onClick={(e) => e.stopPropagation()} onChange={(e) => setTaskStatus(t, e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/25 rounded text-[12px] h-8 px-2">
        {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    ) },
  ];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15">
        <Toolbar right={<span className="font-mono text-[11px] text-[#E7D5A4]/45">{fmt.num(table.count)} task{table.count === 1 ? '' : 's'}</span>}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
          {!fixedEventId && <EventFilter value={event} onChange={setEvent} events={events} allLabel={can(P.EVENTS_ALL) ? 'All events' : 'All my events'} />}
          <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_FILTERS} />
        </Toolbar>
      </div>
      <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload}
        empty={{ title: status === 'open' ? 'No open tasks' : 'No tasks', hint: can(P.TEAM) ? 'Add tasks to a team member from the event’s Team tab.' : 'Tasks assigned to you appear here.', icon: 'ListChecks' }} />
      <Pagination {...table} />
    </Panel>
  );
};
