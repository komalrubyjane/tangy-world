import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { contentErrorMessage } from '../../lib/contentService';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { useAdminSession } from '../AdminSession';
import { P, localISODate, EVENT_STATUS_LABELS } from '../rbac';
import { Page, Panel, Tabs, Badge, AsyncBlock, Drawer, Field, Textarea, Input, Button, fmt, useToast } from '../ui';
import { AnnouncementsManager } from '../components/Announcements';
import { TvManager, DiaryManager, GalleryManager } from '../components/ContentCollections';

// Admin → Content. Each tab needs its own permissions (migration 0028);
// the server re-checks every read and write.
const TABS = [
  { id: 'announcements', label: 'Announcements', requires: P.CONTENT },
  { id: 'sessions', label: 'Session pages', anyOf: [P.EVENTS_MANAGE, P.CONTENT_SESSIONS] },
  { id: 'tv', label: 'Tangy TV', requires: [P.CONTENT_VIEW, P.CONTENT_TV] },
  { id: 'diary', label: 'Diary', requires: [P.CONTENT_VIEW, P.CONTENT_DIARY] },
  { id: 'gallery', label: 'Gallery', requires: [P.CONTENT_VIEW, P.CONTENT_MEDIA] },
];

// Public copy of a session for editors without events.manage (prices,
// capacity and dates stay with event managers — update_session_content()).
const SessionCopyDrawer = ({ evt, onClose, onSaved }) => {
  const toast = useToast();
  const [f, setF] = useState({ description: evt.description || '', story: evt.story || '', image_url: evt.image_url || '', tags: (evt.tags || []).join(', ') });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = f.description !== (evt.description || '') || f.story !== (evt.story || '') || f.image_url !== (evt.image_url || '') || f.tags !== (evt.tags || []).join(', ');
  const close = () => { if (!dirty || window.confirm('Discard your unsaved changes?')) onClose(); };
  const save = async () => {
    if (f.image_url.trim() && !/^(\/|https:\/\/)\S+$/.test(f.image_url.trim())) { setError('The image must be an https:// link or a /media/ path.'); return; }
    setBusy(true);
    setError('');
    const { error: err } = await supabase.rpc('update_session_content', {
      p_event_id: evt.id,
      p_fields: { description: f.description, story: f.story, image_url: f.image_url.trim(), tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) },
    });
    setBusy(false);
    if (err) { setError(contentErrorMessage(err)); return; }
    toast('Session page updated.');
    onSaved();
  };
  return (
    <Drawer title={evt.name} subtitle={dirty ? 'Unsaved changes' : 'Public session page'} onClose={close}
      footer={<><Button variant="ghost" onClick={close}>Close</Button><Button variant="primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save'}</Button></>}>
      <Field label="Description"><Textarea rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Story / quote"><Textarea rows={3} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} /></Field>
      <Field label="Cover image URL"><Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://… or /media/…" /></Field>
      <Field label="Tags" hint="Comma separated"><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></Field>
      {error && <p role="alert" className="text-[12.5px] text-[#ef6b5e] m-0">{error}</p>}
      <p className="text-[12px] text-[#E7D5A4]/55 m-0">Prices, ticket types, capacity and dates are managed by event managers on the event itself.</p>
    </Drawer>
  );
};

const SessionPages = () => {
  const { can } = useAdminSession();
  const manager = can(P.EVENTS_MANAGE);
  const [editing, setEditing] = useState(null);
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('events').select('id, name, slug, event_date, status, description, story, image_url, tags')
      .gte('event_date', localISODate()).order('event_date');
    if (error) throw friendlyError(error);
    return data;
  }, []);
  const row = (e) => (
    <>
      <span className="font-mono text-[12px] text-[#C99A2E] w-24 shrink-0">{fmt.date(e.event_date)}</span>
      <span className="flex-1 min-w-0 truncate">{e.name}</span>
      {!e.description && <Badge tone="warn">No description</Badge>}
      {!e.image_url && <Badge tone="warn">No image</Badge>}
      <Badge status={e.status}>{EVENT_STATUS_LABELS[e.status]}</Badge>
    </>
  );
  return (
    <Panel title="Upcoming session pages" subtitle={manager ? "Edit a session's public copy, ticket types and cover image from the event." : 'Edit the public copy of upcoming sessions.'} flush>
      <AsyncBlock loading={q.loading} error={q.error} onRetry={q.reload} empty={(q.data || []).length === 0} emptyProps={{ title: 'No upcoming events', icon: 'CalendarDays' }}>
        <ul className="divide-y divide-[#E7D5A4]/[0.06]">
          {(q.data || []).map((e) => (
            <li key={e.id} className="flex items-center">
              {manager ? (
                <Link to={`/admin-portal/events/${e.id}?tab=content`} className="flex flex-1 items-center gap-3 px-4 py-3 hover:bg-[#C99A2E]/[0.05] text-[13px]">{row(e)}</Link>
              ) : (
                <button type="button" onClick={() => setEditing(e)} className="flex flex-1 items-center gap-3 px-4 py-3 hover:bg-[#C99A2E]/[0.05] text-[13px] text-left">{row(e)}</button>
              )}
              {e.slug && <Link to={`/sessions/${e.slug}`} target="_blank" className="px-3 text-[11px] text-[#C99A2E] hover:underline">View ↗</Link>}
            </li>
          ))}
        </ul>
      </AsyncBlock>
      {editing && <SessionCopyDrawer evt={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
    </Panel>
  );
};

export default function ContentPage() {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => can(t.requires, t.anyOf));
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : tabs[0]?.id;
  return (
    <Page title="Content" subtitle="Everything visitors read and watch: announcements, session pages, Tangy TV, the diary and the gallery. Changes go live for everyone as soon as they're published.">
      <Tabs tabs={tabs} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />
      {tab === 'announcements' && <AnnouncementsManager startNew={params.get('new') === '1'} />}
      {tab === 'sessions' && <SessionPages />}
      {tab === 'tv' && <TvManager />}
      {tab === 'diary' && <DiaryManager />}
      {tab === 'gallery' && <GalleryManager />}
    </Page>
  );
}
