import { useState, useEffect, useCallback } from 'react';
import { useAdminSession } from '../AdminSession';
import { update, insert, list, orIlike } from '../api';
import { useServerTable, useDebounced } from '../hooks';
import { P } from '../rbac';
import {
  Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Modal, Field, Input, Textarea, Select,
  EmptyState, ErrorState, Skeleton, fmt, useToast, cx,
} from '../ui';
import { EventFilter } from './Bookings';
import { useAttendeeEventOptions } from './Attendees';

// Event tasks: list + board views, "my tasks", overdue. RLS scopes staff to
// tasks on their own assignments (and event-level tasks for events they
// work); guard_event_task_status stops non-managers changing anything but
// status. The UI only mirrors that.

export const TASK_STATUSES = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];
const STATUS_FILTERS = [
  { value: 'open', label: 'Open tasks' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
  { value: '', label: 'All tasks' },
];
const PRIORITIES = [{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }];
const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map((p) => [p.value, p.label]));
const PRIORITY_TONE = { urgent: 'bad', high: 'warn', normal: 'info', low: 'muted' };
const TEAMS = ['gate', 'hospitality', 'stage', 'registration', 'production', 'runners', 'other'];
const SELECT = 'id, title, description, status, priority, due_at, team, event_id, completed_at, events(id, name, event_date), event_assignments(id, title, assignee_id, profiles(full_name, email))';

const isOverdue = (t) => t.status !== 'done' && t.due_at && new Date(t.due_at).getTime() < Date.now();

function applyFilters(x, { eventId, status, priority, mine, userId, q }) {
  if (eventId) x = x.eq('event_id', eventId);
  if (status === 'open') x = x.neq('status', 'done');
  else if (status === 'overdue') x = x.neq('status', 'done').lt('due_at', new Date().toISOString());
  else if (status) x = x.eq('status', status);
  if (priority) x = x.eq('priority', priority);
  if (mine && userId) x = x.eq('event_assignments.assignee_id', userId);
  return orIlike(x, ['title'], q);
}

export const TasksTable = ({ eventId: fixedEventId, initialStatus = 'open', initialMine = false }) => {
  const { can, user } = useAdminSession();
  const toast = useToast();
  const events = useAttendeeEventOptions();
  const [event, setEvent] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('');
  const [mine, setMine] = useState(initialMine);
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const q = useDebounced(search);
  const eventId = fixedEventId || event;
  const manager = can(P.TEAM);
  const f = { eventId, status, priority, mine, userId: user?.id, q };
  // "Assigned to me" needs an inner join so the filter removes parent rows.
  const select = mine ? SELECT.replace('event_assignments(', 'event_assignments!inner(') : SELECT;

  const table = useServerTable({
    table: 'event_tasks',
    select,
    deps: [eventId, status, priority, mine, q, view],
    build: (query) => applyFilters(query.order('status', { ascending: true }).order('due_at', { ascending: true, nullsFirst: false }), f),
  });

  const setTaskStatus = async (t, s) => {
    try { await update('event_tasks', t.id, { status: s }); table.reload(); } catch (err) { toast(err.message, 'bad'); }
  };

  const columns = [
    { key: 'title', header: 'Task', render: (t) => (<div className="min-w-0"><div className={cx('text-[#EFE2C0]', t.status === 'done' && 'line-through opacity-50')}>{t.title}</div>{t.description && <div className="text-[12px] text-[#E7D5A4]/45 truncate max-w-[320px]">{t.description}</div>}</div>) },
    { key: 'event', header: 'Event', hidden: !!fixedEventId, render: (t) => <span className="text-[12.5px]">{t.events?.name}</span> },
    { key: 'who', header: 'Owner', hidden: !manager, render: (t) => <Owner t={t} /> },
    { key: 'due', header: 'Due', render: (t) => (t.due_at ? <span className={cx('font-mono text-[12px]', isOverdue(t) && 'text-[#ef6b5e]')}>{fmt.dateTime(t.due_at)}{isOverdue(t) ? ' · overdue' : ''}</span> : <span className="text-[#E7D5A4]/30">—</span>) },
    { key: 'priority', header: 'Priority', mobileHidden: true, render: (t) => <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority] || t.priority}</Badge> },
    { key: 'status', header: 'Status', render: (t) => <StatusSelect t={t} onChange={setTaskStatus} /> },
  ];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15">
        <Toolbar right={
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Task view" className="flex border border-[#C99A2E]/25 rounded overflow-hidden">
              {[['list', 'List', 'List'], ['board', 'Board', 'Columns3']].map(([k, label]) => (
                <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                  className={cx('h-8 px-2.5 font-mono text-[10.5px] uppercase', view === k ? 'bg-[#C99A2E] text-[#11100C]' : 'text-[#E7D5A4]/70')}>{label}</button>
              ))}
            </div>
            {manager && <Button size="sm" variant="primary" icon="Plus" onClick={() => setCreating(true)}>New task</Button>}
          </div>}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
          {!fixedEventId && <EventFilter value={event} onChange={setEvent} events={events} allLabel={can(P.EVENTS_ALL) ? 'All events' : 'All my events'} />}
          {view === 'list' && <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_FILTERS} />}
          <FilterSelect label="Priority" value={priority} onChange={setPriority} options={[{ value: '', label: 'Any priority' }, ...PRIORITIES]} />
          {manager && (
            <label className="flex items-center gap-2 text-[12px] text-[#E7D5A4]/65 h-9">
              <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-[#C99A2E]" />My tasks
            </label>
          )}
        </Toolbar>
      </div>
      {view === 'list' ? (
        <>
          <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload}
            empty={{ title: status === 'open' ? 'No open tasks' : 'No tasks', hint: manager ? 'Create a task for an event, a team or a person.' : 'Tasks assigned to you appear here.', icon: 'ListChecks' }} />
          <Pagination {...table} />
        </>
      ) : (
        <Board filters={{ ...f, status: '' }} select={select} onStatus={setTaskStatus} manager={manager} reloadKey={table.rows} />
      )}
      {creating && (
        <CreateTask events={events} fixedEventId={fixedEventId} defaultEvent={event}
          onClose={() => setCreating(false)} onCreated={() => { setCreating(false); table.reload(); toast('Task created', 'good'); }} />
      )}
    </Panel>
  );
};

const Owner = ({ t }) => {
  const a = t.event_assignments;
  if (a) return <span className="text-[12.5px]">{a.profiles?.full_name || a.profiles?.email} <span className="text-[#E7D5A4]/40">· {a.title}</span></span>;
  return <span className="text-[12.5px] text-[#E7D5A4]/60">{t.team ? `${t.team} team` : 'Event task'}</span>;
};

const StatusSelect = ({ t, onChange }) => (
  <select aria-label={`Status of ${t.title}`} value={t.status} onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(t, e.target.value)}
    className="bg-[#11100C] border border-[#C99A2E]/25 rounded text-[12px] h-8 px-2">
    {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
  </select>
);

// Board: all matching tasks (up to 200) grouped by status.
const Board = ({ filters, select, onStatus, manager, reloadKey }) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await list('event_tasks', {
        select, to: 199,
        build: (x) => applyFilters(x.order('due_at', { ascending: true, nullsFirst: false }), filters),
      });
      setRows(r.rows); setError(null);
    } catch (err) { setError(err); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), select]);
  useEffect(() => { load(); }, [load, reloadKey]);
  const move = async (t, s) => { await onStatus(t, s); load(); };
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!rows) return <div className="p-4"><Skeleton rows={4} /></div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-3" data-task-board>
      {TASK_STATUSES.map((s) => {
        const col = rows.filter((t) => t.status === s.value);
        return (
          <section key={s.value} aria-label={s.label} className="bg-[#11100C] border border-[#C99A2E]/15 rounded-md flex flex-col min-h-[160px]">
            <header className="px-3 py-2 border-b border-[#C99A2E]/10 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#C99A2E]">
              {s.label}<span className="text-[#E7D5A4]/50">{col.length}</span>
            </header>
            {col.length === 0 ? <EmptyState icon="ListChecks" title="Empty" /> : (
              <ul className="flex flex-col gap-2 p-2">
                {col.map((t) => (
                  <li key={t.id} className={cx('bg-[#17130F] border rounded p-2.5 flex flex-col gap-1.5', isOverdue(t) ? 'border-[#a8322a]/60' : 'border-[#E7D5A4]/10')}>
                    <div className="text-[13px] text-[#EFE2C0]">{t.title}</div>
                    <div className="text-[11.5px] text-[#E7D5A4]/50">{t.events?.name}{manager ? ' · ' : ''}{manager && <Owner t={t} />}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                      {t.due_at && <span className={cx('font-mono text-[10.5px]', isOverdue(t) ? 'text-[#ef6b5e]' : 'text-[#E7D5A4]/45')}>{fmt.dateTime(t.due_at)}</span>}
                    </div>
                    <StatusSelect t={t} onChange={move} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};

const CreateTask = ({ events, fixedEventId, defaultEvent, onClose, onCreated }) => {
  const [f, setF] = useState({ event_id: fixedEventId || defaultEvent || '', title: '', description: '', priority: 'normal', due: '', team: '', assignment_id: '' });
  const [assignments, setAssignments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!f.event_id) { setAssignments([]); return undefined; }
    let c = false;
    list('event_assignments', {
      select: 'id, title, assignee_role, profiles(full_name, email)', to: 199,
      build: (x) => x.eq('event_id', f.event_id).in('status', ['assigned', 'confirmed']).order('assignee_role'),
    }).then((r) => { if (!c) setAssignments(r.rows); }, () => { if (!c) setAssignments([]); });
    return () => { c = true; };
  }, [f.event_id]);
  const submit = async () => {
    setBusy(true); setError('');
    try {
      await insert('event_tasks', {
        event_id: f.event_id, assignment_id: f.assignment_id || null, title: f.title.trim(), description: f.description.trim() || null,
        priority: f.priority, team: f.team || null, due_at: f.due ? new Date(f.due).toISOString() : null,
      });
      onCreated();
    } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <Modal title="New task" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={busy || !f.event_id || !f.title.trim()} onClick={submit}>{busy ? 'Saving…' : 'Create task'}</Button></>}>
      <div className="flex flex-col gap-3">
        {!fixedEventId && (
          <Field label="Event *">
            <Select value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value, assignment_id: '' })}>
              <option value="">Choose an event…</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.name} · {fmt.date(e.event_date)}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Title *"><Input maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Details"><Textarea rows={3} maxLength={2000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
          <Field label="Due"><Input type="datetime-local" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
          <Field label="Assign to" hint="Leave empty for an event or team task">
            <Select value={f.assignment_id} onChange={(e) => setF({ ...f, assignment_id: e.target.value })} disabled={!f.event_id}>
              <option value="">Nobody specific</option>
              {assignments.map((a) => <option key={a.id} value={a.id}>{a.profiles?.full_name || a.profiles?.email} · {a.title || a.assignee_role}</option>)}
            </Select>
          </Field>
          <Field label="Team">
            <Select value={f.team} onChange={(e) => setF({ ...f, team: e.target.value })}>
              <option value="">No team</option>
              {TEAMS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </Field>
        </div>
        {error && <p role="alert" className="text-[12.5px] text-[#ef6b5e]">{error}</p>}
      </div>
    </Modal>
  );
};
