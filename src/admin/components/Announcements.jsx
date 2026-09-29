import { useState } from 'react';
import { ANNOUNCEMENT_CATEGORIES } from '../../data/mock/announcements';
import { ANNOUNCEMENT_CHARACTERS, toOverlayShape } from '../../services/announcementService';
import { AnnouncementCharacterOverlay } from '../../components/announcements/AnnouncementCharacterOverlay';
import { useAdminSession } from '../AdminSession';
import { insert, update, remove, orIlike } from '../api';
import { useServerTable, useDebounced } from '../hooks';
import { P } from '../rbac';
import {
  Panel, Toolbar, SearchInput, FilterSelect, DataTable, Pagination, Badge, Button, Modal, Field, Input, Textarea, Select,
  ConfirmDialog, fmt, useToast,
} from '../ui';
import { EventFilter, useEventOptions } from './Bookings';

const STATUSES = ['draft', 'scheduled', 'published', 'archived'];
const AUDIENCES = [
  { value: 'all', label: 'Everyone (public site)' },
  { value: 'guest', label: 'Guests (signed out)' },
  { value: 'patron', label: 'Patrons' },
  { value: 'artist', label: 'Artists' },
  { value: 'staff', label: 'Staff (console only)' },
  { value: 'members', label: 'Everyone on the event (portals)' },
  { value: 'sponsor', label: 'Sponsors (portal)' },
  { value: 'vendor', label: 'Vendors (portal)' },
  { value: 'venue', label: 'Venue hosts (portal)' },
  { value: 'volunteer', label: 'Volunteers (portal / group)' },
  { value: 'crew', label: 'Crew (portal)' },
];
// Shown on the public site's announcement overlay; everything else is a
// private notice delivered to portals/console and via notifications.
const PUBLIC_AUDIENCES = ['all', 'guest', 'patron', 'artist'];
const AUDIENCE_LABEL = Object.fromEntries(AUDIENCES.map((a) => [a.value, a.label.split(' (')[0]]));

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Live = what visitors/staff actually see right now (status + time window).
export function announcementState(a, now = Date.now()) {
  if (a.status !== 'published') return a.status;
  if (new Date(a.publish_at).getTime() > now) return 'scheduled';
  if (a.expire_at && new Date(a.expire_at).getTime() <= now) return 'expired';
  return 'live';
}

const AnnouncementForm = ({ initial, eventId, onClose, onSaved, onPreview }) => {
  const events = useEventOptions();
  const toast = useToast();
  const isEdit = Boolean(initial?.id);
  const [f, setF] = useState(() => ({
    title: '', body: '', category: 'GENERAL', character: 'violinist', destination: '', audience: eventId ? 'staff' : 'all',
    priority: 'normal', event_id: eventId || '', status: 'draft',
    ...(initial || {}),
    publish_at: toLocalInput(initial?.publish_at || new Date().toISOString()),
    expire_at: toLocalInput(initial?.expire_at),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const publicFacing = PUBLIC_AUDIENCES.includes(f.audience) && !(f.audience === 'artist' && f.event_id);
  const invalidWindow = f.expire_at && f.publish_at && new Date(f.expire_at) <= new Date(f.publish_at);

  const save = async (e) => {
    e?.preventDefault();
    if (!f.title.trim() || invalidWindow) return;
    setBusy(true);
    setError('');
    const payload = {
      title: f.title.trim(), body: f.body, category: f.category, character: f.character,
      destination: f.destination?.trim() || null, audience: f.audience, priority: f.priority,
      event_id: f.event_id || null, status: f.status,
      publish_at: f.publish_at ? new Date(f.publish_at).toISOString() : new Date().toISOString(),
      expire_at: f.expire_at ? new Date(f.expire_at).toISOString() : null,
    };
    try {
      if (isEdit) await update('announcements', initial.id, payload); else await insert('announcements', payload);
      toast(isEdit ? 'Announcement updated' : 'Announcement created');
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit announcement' : 'New announcement'} onClose={onClose} wide
      footer={
        <>
          {publicFacing && <Button variant="ghost" icon="Eye" onClick={() => onPreview({ ...f, description: f.body })}>Preview</Button>}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={busy || !f.title.trim() || invalidWindow}>{busy ? 'Saving…' : isEdit ? 'Save' : 'Create'}</Button>
        </>
      }>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Title *" className="sm:col-span-2"><Input value={f.title} onChange={set('title')} autoFocus /></Field>
        <Field label="Message" className="sm:col-span-2"><Textarea rows={3} value={f.body} onChange={set('body')} /></Field>
        <Field label="Audience"><Select value={f.audience} onChange={set('audience')}>{AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</Select></Field>
        <Field label="Event" hint={f.audience === 'staff' ? 'Staff see event announcements only for events they work'
          : !publicFacing ? (f.event_id ? 'Only people on this event receive it (and a notification)' : f.audience === 'members' ? 'Choose an event — this audience is event members' : 'Group notice to every account with this role, plus a notification')
          : undefined}>
          <Select value={f.event_id || ''} onChange={set('event_id')} disabled={!!eventId}>
            <option value="">Not event-specific</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name} · {fmt.date(e.event_date)}</option>)}
          </Select>
        </Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        <Field label="Priority"><Select value={f.priority} onChange={set('priority')}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></Select></Field>
        <Field label="Publish at"><Input type="datetime-local" value={f.publish_at} onChange={set('publish_at')} /></Field>
        <Field label="Expire at" error={invalidWindow ? 'Must be after publish time' : undefined}><Input type="datetime-local" value={f.expire_at} onChange={set('expire_at')} /></Field>
        {publicFacing && (
          <>
            <Field label="Category"><Select value={f.category} onChange={set('category')}>{ANNOUNCEMENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
            <Field label="Character"><Select value={f.character} onChange={set('character')}>{ANNOUNCEMENT_CHARACTERS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></Field>
            <Field label="Link destination" hint="Site path, e.g. /sessions" className="sm:col-span-2"><Input value={f.destination || ''} onChange={set('destination')} /></Field>
          </>
        )}
      </form>
      {error && <div role="alert" className="text-[12.5px] text-[#ef6b5e] bg-[#a8322a]/10 border border-[#a8322a]/40 rounded px-3 py-2">{error}</div>}
    </Modal>
  );
};

export const AnnouncementsManager = ({ eventId, startNew = false }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const events = useEventOptions();
  const [status, setStatus] = useState('');
  const [audience, setAudience] = useState('');
  const [event, setEvent] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [editing, setEditing] = useState(startNew ? {} : null);
  const [deleting, setDeleting] = useState(null);
  const [preview, setPreview] = useState(null);
  const scopedEvent = eventId || event;

  const table = useServerTable({
    table: 'announcements',
    select: '*, events(name)',
    deps: [status, audience, scopedEvent, q],
    build: (query) => {
      let x = query.order('publish_at', { ascending: false });
      if (status) x = x.eq('status', status);
      if (audience) x = x.eq('audience', audience);
      if (scopedEvent) x = x.eq('event_id', scopedEvent);
      return orIlike(x, ['title', 'body'], q);
    },
  });

  const columns = [
    { key: 'title', header: 'Announcement', render: (a) => (<div className="min-w-0"><div className="text-[#EFE2C0]">{a.title}</div><div className="text-[12px] text-[#E7D5A4]/45 truncate max-w-[340px]">{a.body}</div></div>) },
    { key: 'audience', header: 'Audience', render: (a) => <Badge tone={a.audience === 'staff' ? 'info' : PUBLIC_AUDIENCES.includes(a.audience) ? 'gold' : 'muted'}>{AUDIENCE_LABEL[a.audience]}</Badge> },
    { key: 'event', header: 'Event', hidden: !!eventId, mobileHidden: true, render: (a) => <span className="text-[12.5px] text-[#E7D5A4]/60">{a.events?.name || '—'}</span> },
    { key: 'state', header: 'State', render: (a) => { const s = announcementState(a); return <Badge status={s === 'live' ? 'published' : s}>{s}</Badge>; } },
    { key: 'publish', header: 'Publish', mobileHidden: true, render: (a) => <span className="font-mono text-[11.5px] text-[#E7D5A4]/55">{fmt.dateTime(a.publish_at)}{a.expire_at ? ` → ${fmt.dateTime(a.expire_at)}` : ''}</span> },
    { key: 'updated', header: 'Updated', mobileHidden: true, render: (a) => <span className="font-mono text-[11.5px] text-[#E7D5A4]/40">{fmt.relative(a.updated_at)}</span> },
    { key: 'actions', header: '', align: 'right', hidden: !can(P.CONTENT), render: (a) => (
      <span className="inline-flex gap-1" onClick={(e) => e.stopPropagation()}>
        {a.audience !== 'staff' && <Button size="sm" variant="ghost" icon="Eye" aria-label="Preview" onClick={() => setPreview(toOverlayShape(a))} />}
        <Button size="sm" variant="ghost" icon="Trash2" aria-label="Delete" onClick={() => setDeleting(a)} />
      </span>
    ) },
  ];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15">
        <Toolbar right={can(P.CONTENT) && <Button size="sm" variant="primary" icon="Plus" onClick={() => setEditing({})}>New announcement</Button>}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search announcements…" />
          {!eventId && <EventFilter value={event} onChange={setEvent} events={events} />}
          <FilterSelect label="Audience" value={audience} onChange={setAudience} options={[{ value: '', label: 'Any audience' }, ...AUDIENCES]} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, ...STATUSES]} />
        </Toolbar>
      </div>
      <DataTable columns={columns} rows={table.rows} loading={table.loading} error={table.error} onRetry={table.reload}
        onRowClick={can(P.CONTENT) ? (a) => setEditing(a) : undefined}
        empty={{ title: 'No announcements yet', hint: 'Public announcements appear on the website; staff announcements appear on staff dashboards.', icon: 'Megaphone' }} />
      <Pagination {...table} />
      {editing && (
        <AnnouncementForm initial={editing.id ? editing : null} eventId={eventId} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); table.reload(); }} onPreview={setPreview} />
      )}
      {deleting && (
        <ConfirmDialog title="Delete announcement?" message={`"${deleting.title}" will be removed. Consider archiving instead to keep a record.`}
          confirmLabel="Delete" tone="danger"
          onConfirm={async () => { await remove('announcements', deleting.id); toast('Announcement deleted'); table.reload(); }}
          onClose={() => setDeleting(null)} />
      )}
      <AnnouncementCharacterOverlay isOpen={!!preview} announcement={preview} character={preview?.character} position="bottom-right" duration={8000} onClose={() => setPreview(null)} />
    </Panel>
  );
};
