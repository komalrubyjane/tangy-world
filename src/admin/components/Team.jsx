import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminSession } from '../AdminSession';
import { friendlyError, insert, update, remove } from '../api';
import { useAsync } from '../hooks';
import { P, ROLE_LABELS } from '../rbac';
import { Panel, Badge, Button, Select, Input, Field, AsyncBlock, ConfirmDialog, Icon, fmt, useToast, cx } from '../ui';

export const ASSIGNEE_ROLES = [
  { value: 'staff', label: 'Staff' },
  { value: 'crew', label: 'Crew' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'sponsor', label: 'Sponsor' },
];
const ASSIGNMENT_STATUSES = ['assigned', 'confirmed', 'declined', 'completed'];
const TASK_STATUSES = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

// Candidates per assignee role: staff are console accounts; the others are
// approved partner accounts (their *_profiles row exists only after approval).
export function useCandidates(role) {
  return useAsync(async () => {
    if (role === 'staff') {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, role')
        .in('role', ['staff', 'admin', 'super_admin']).eq('is_active', true).order('full_name');
      if (error) throw friendlyError(error);
      return (data || []).map((p) => ({ id: p.id, name: p.full_name || p.email, sub: ROLE_LABELS[p.role] }));
    }
    const table = { crew: 'crew_profiles', volunteer: 'volunteer_profiles', vendor: 'vendor_profiles', sponsor: 'sponsor_profiles' }[role];
    const { data, error } = await supabase.from(table).select('id, profiles(full_name, email, is_active)');
    if (error) throw friendlyError(error);
    return (data || []).filter((r) => r.profiles?.is_active !== false).map((r) => ({ id: r.id, name: r.profiles?.full_name || r.profiles?.email || r.id }));
  }, [role]);
}

const TaskList = ({ assignment, onChanged, canEdit }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState('normal');
  const tasks = [...(assignment.event_tasks || [])].sort((a, b) => (a.status === 'done') - (b.status === 'done') || String(a.due_at || '').localeCompare(String(b.due_at || '')));

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await insert('event_tasks', { assignment_id: assignment.id, title: title.trim(), priority, due_at: due ? new Date(due).toISOString() : null });
      setTitle(''); setDue(''); setPriority('normal');
      onChanged();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const setStatus = async (t, status) => {
    try { await update('event_tasks', t.id, { status }); onChanged(); } catch (err) { toast(err.message, 'bad'); }
  };
  const del = async (t) => {
    try { await remove('event_tasks', t.id); onChanged(); } catch (err) { toast(err.message, 'bad'); }
  };

  return (
    <div className="mt-2 pl-3 border-l border-[#C99A2E]/20 flex flex-col gap-1.5">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-[12.5px]">
          <select aria-label="Task status" value={t.status} onChange={(e) => setStatus(t, e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/25 rounded text-[11px] h-7 px-1.5">
            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <span className={cx('flex-1 min-w-0 truncate', t.status === 'done' && 'line-through text-[#E7D5A4]/40')}>{t.title}</span>
          {t.priority === 'high' && <Badge tone="bad">High</Badge>}
          {t.due_at && <span className="font-mono text-[11px] text-[#E7D5A4]/40">{fmt.dateTime(t.due_at)}</span>}
          {canEdit && <button onClick={() => del(t)} aria-label="Delete task" className="text-[#E7D5A4]/30 hover:text-[#ef6b5e]"><Icon name="Trash2" size={14} /></button>}
        </div>
      ))}
      {canEdit && (
        <form onSubmit={add} className="flex flex-wrap gap-1.5 mt-1">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" className="h-8 flex-1 min-w-[160px] text-[12.5px]" />
          <Input type="datetime-local" aria-label="Due" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 w-auto text-[12px]" />
          <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-8 w-auto text-[12px]">
            <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
          </Select>
          <Button size="sm" type="submit" disabled={!title.trim()}>Add</Button>
        </form>
      )}
    </div>
  );
};

// Event → assigned team (staff, crew, volunteers, vendors) with per-person tasks.
export const TeamManager = ({ eventId, roles = ASSIGNEE_ROLES.map((r) => r.value), title = 'Assigned team' }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const canEdit = can(P.TEAM);
  const [role, setRole] = useState(roles[0]);
  const [person, setPerson] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [removing, setRemoving] = useState(null);
  const candidates = useCandidates(role);
  const assignments = useAsync(async () => {
    const { data, error } = await supabase.from('event_assignments')
      .select('id, assignee_role, assignee_id, title, status, notes, created_at, profiles(full_name, email), event_tasks(id, title, status, priority, due_at)')
      .eq('event_id', eventId).in('assignee_role', roles).order('created_at');
    if (error) throw friendlyError(error);
    return data || [];
  }, [eventId, roles.join(',')]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await insert('event_assignments', { event_id: eventId, assignee_role: role, assignee_id: person, title: jobTitle.trim() });
      toast('Team member assigned');
      setPerson(''); setJobTitle('');
      assignments.reload();
    } catch (err) { toast(err.message, 'bad'); }
  };
  const setStatus = async (a, status) => {
    try { await update('event_assignments', a.id, { status }); assignments.reload(); } catch (err) { toast(err.message, 'bad'); }
  };

  const rows = assignments.data || [];
  const assignedIds = new Set(rows.filter((a) => a.assignee_role === role).map((a) => a.assignee_id));

  return (
    <Panel title={title} subtitle={`${rows.length} assigned`} flush>
      {canEdit && (
        <form onSubmit={add} className="p-3 border-b border-[#C99A2E]/15 grid grid-cols-1 md:grid-cols-[130px_1fr_1fr_auto] gap-2 items-end">
          <Field label="Role"><Select value={role} onChange={(e) => { setRole(e.target.value); setPerson(''); }}>{ASSIGNEE_ROLES.filter((r) => roles.includes(r.value)).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
          <Field label="Person">
            <Select value={person} onChange={(e) => setPerson(e.target.value)}>
              <option value="">{candidates.loading ? 'Loading…' : (candidates.data || []).length === 0 ? `No approved ${role} accounts` : 'Select…'}</option>
              {(candidates.data || []).filter((c) => !assignedIds.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}{c.sub ? ` · ${c.sub}` : ''}</option>)}
            </Select>
          </Field>
          <Field label="Responsibility"><Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Gate check-in, Sound" /></Field>
          <Button type="submit" variant="primary" icon="UserPlus" disabled={!person || !jobTitle.trim()}>Assign</Button>
        </form>
      )}
      <AsyncBlock loading={assignments.loading} error={assignments.error} onRetry={assignments.reload} empty={rows.length === 0}
        emptyProps={{ title: 'Nobody assigned yet', hint: canEdit ? 'Assign staff to give them access to this event’s check-in and attendee list.' : undefined, icon: 'UsersRound' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {rows.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13.5px] text-[#EFE2C0]">{a.profiles?.full_name || a.profiles?.email || 'Unknown'}</span>
                <Badge tone="gold">{a.assignee_role}</Badge>
                <span className="text-[12.5px] text-[#E7D5A4]/55 flex-1 min-w-0 truncate">{a.title}</span>
                {canEdit ? (
                  <select aria-label="Assignment status" value={a.status} onChange={(e) => setStatus(a, e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/25 rounded text-[11px] h-7 px-1.5">
                    {ASSIGNMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : <Badge status={a.status} />}
                {canEdit && <Button size="sm" variant="ghost" icon="Trash2" aria-label="Remove from event" onClick={() => setRemoving(a)} />}
              </div>
              <TaskList assignment={a} onChanged={assignments.reload} canEdit={canEdit} />
            </li>
          ))}
        </ul>
      </AsyncBlock>
      {removing && (
        <ConfirmDialog
          title="Remove from event?"
          message={`${removing.profiles?.full_name || removing.profiles?.email} loses access to this event and their ${removing.event_tasks?.length || 0} task(s) are deleted.`}
          confirmLabel="Remove" tone="danger"
          onConfirm={async () => { await remove('event_assignments', removing.id); toast('Removed from event'); assignments.reload(); }}
          onClose={() => setRemoving(null)}
        />
      )}
    </Panel>
  );
};
