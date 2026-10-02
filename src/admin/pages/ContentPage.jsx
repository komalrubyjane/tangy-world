import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { contentErrorMessage } from '../../lib/contentService';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { useAdminSession } from '../AdminSession';
import { P, EVENT_STATUS_LABELS } from '../rbac';
import {
  Page, Panel, Badge, Drawer, Field, Textarea, Input, Button, DataTable, SearchInput, Toolbar, FilterSelect,
  Skeleton, EmptyState, ErrorState, fmt, useToast,
} from '../ui';
import { AnnouncementsManager } from '../components/Announcements';
import { TvManager, DiaryManager, GalleryManager, ProgrammesManager } from '../components/ContentCollections';
import { EventForm } from '../components/EventForm';
import { MediaLibrary } from '../components/MediaLibrary';
import { ENTITIES, EntityDrawer } from './PeoplePage';

// Admin → Content. Every section and every item has its own URL:
//   /admin-portal/content                     overview
//   /admin-portal/content/<section>           list
//   /admin-portal/content/<section>/<slug|id> item (…/new to create)
// Each section needs its own permissions (migration 0028); the server
// re-checks every read and write.
const BASE = '/admin-portal/content';
const SECTIONS = [
  { id: 'sessions', label: 'Sessions', icon: 'CalendarDays', anyOf: [P.EVENTS_MANAGE, P.CONTENT_SESSIONS], hint: 'Public copy, cover images and tags of each session.' },
  { id: 'artists', label: 'Artists', icon: 'Mic', anyOf: [P.ENTITIES, P.CONTENT_VIEW], hint: 'Public artist pages (/artists/…).' },
  { id: 'gallery', label: 'Gallery', icon: 'Image', requires: [P.CONTENT_VIEW, P.CONTENT_MEDIA], hint: 'Albums and photos on /gallery.' },
  { id: 'tv', label: 'Tangy TV', icon: 'Tv', requires: [P.CONTENT_VIEW, P.CONTENT_TV], hint: 'Videos on /tv and the retro TV set.' },
  { id: 'programmes', label: 'Programmes', icon: 'ScrollText', requires: [P.CONTENT_VIEW, P.CONTENT_SESSIONS], hint: 'Seasons and series on /archive/programmes.' },
  { id: 'diary', label: 'Diary', icon: 'ScrollText', requires: [P.CONTENT_VIEW, P.CONTENT_DIARY], hint: 'Stories and field notes on /diary.' },
  { id: 'announcements', label: 'Announcements', icon: 'Megaphone', requires: P.CONTENT, hint: 'Website pop-ups and team notices.' },
  { id: 'media', label: 'Media library', icon: 'Paperclip', requires: [P.CONTENT_VIEW, P.CONTENT_MEDIA], hint: 'Every file uploaded for content.' },
];
const LEGACY_TABS = { events: 'sessions', tv: 'tv', diary: 'diary', gallery: 'gallery', announcements: 'announcements', sessions: 'sessions' };

const useSections = () => {
  const { can } = useAdminSession();
  return SECTIONS.filter((s) => can(s.requires, s.anyOf));
};

// /admin-portal/content — overview with live counts.
const ContentOverview = () => {
  const sections = useSections();
  const counts = useAsync(async () => {
    const count = async (table, build = (q) => q) => {
      const { count: n } = await build(supabase.from(table).select('id', { count: 'exact', head: true }));
      return n ?? 0;
    };
    const [tv, diary, gallery, drafts, sessions, artists] = await Promise.all([
      count('tv_videos', (q) => q.eq('status', 'published')), count('diary_posts', (q) => q.eq('status', 'published')),
      count('gallery_albums', (q) => q.eq('status', 'published')), count('diary_posts', (q) => q.eq('status', 'draft')),
      count('events', (q) => q.neq('status', 'draft')), count('artists', (q) => q.eq('status', 'approved')),
    ]);
    return { tv, diary, gallery, drafts, sessions, artists };
  }, []);
  const n = counts.data || {};
  const stat = { sessions: `${n.sessions ?? '…'} listed`, artists: `${n.artists ?? '…'} approved`, tv: `${n.tv ?? '…'} published`, diary: `${n.diary ?? '…'} published · ${n.drafts ?? '…'} drafts`, gallery: `${n.gallery ?? '…'} albums` };
  return (
    <Page title="Content" subtitle="Everything visitors read and watch. Changes go live for everyone as soon as they're published.">
      {sections.length === 0 ? <Panel><EmptyState title="No content sections for your role" /></Panel> : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 list-none m-0 p-0" data-content-sections>
          {sections.map((s) => (
            <li key={s.id}>
              <Link to={`${BASE}/${s.id}`} className="block h-full bg-[#17130F] border border-[#C99A2E]/20 hover:border-[#C99A2E]/60 rounded-md p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C99A2E]">
                <div className="font-condensed text-lg uppercase text-[#EFE2C0]">{s.label}</div>
                <p className="text-[12.5px] text-[#E7D5A4]/60 m-0 mt-1">{s.hint}</p>
                {stat[s.id] && <p className="font-mono text-[11px] text-[#C99A2E] m-0 mt-2">{stat[s.id]}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
};

// Sessions --------------------------------------------------------------------------
const SessionsList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('events').select('id, name, slug, event_date, status, description, image_url, featured').order('event_date', { ascending: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
  const rows = (q.data || []).filter((e) => (!status || e.status === status) && (!search || `${e.name} ${e.slug}`.toLowerCase().includes(search.toLowerCase())));
  return (
    <Page title="Sessions" subtitle="Each session's public page: description, story, cover image and tags. Prices and capacity live on the event itself.">
      <Panel flush>
        <div className="p-4"><Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search sessions…" />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'All statuses' }, ...Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))]} />
        </Toolbar></div>
        <DataTable rows={rows} loading={q.loading} error={q.error} onRetry={q.reload}
          onRowClick={(e) => navigate(`${BASE}/sessions/${e.slug || e.id}`)}
          empty={{ title: 'No sessions', icon: 'CalendarDays' }}
          columns={[
            { key: 'name', header: 'Session', render: (e) => <span className="font-medium">{e.name}</span> },
            { key: 'date', header: 'Date', render: (e) => fmt.date(e.event_date) },
            { key: 'copy', header: 'Page', render: (e) => (!e.description ? <Badge tone="warn">No description</Badge> : !e.image_url ? <Badge tone="warn">No image</Badge> : <Badge tone="good">Complete</Badge>) },
            { key: 'status', header: 'Status', render: (e) => <Badge status={e.status}>{EVENT_STATUS_LABELS[e.status]}</Badge> },
          ]} />
      </Panel>
    </Page>
  );
};

// Public copy for editors without events.manage (update_session_content, 0028).
const SessionCopyForm = ({ evt, onSaved }) => {
  const toast = useToast();
  const initial = { description: evt.description || '', story: evt.story || '', image_url: evt.image_url || '', tags: (evt.tags || []).join(', ') };
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
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
    <Drawer inline title="Public copy" footer={<Button variant="primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save'}</Button>}>
      <Field label="Description"><Textarea rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="Story / quote"><Textarea rows={3} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} /></Field>
      <Field label="Cover image URL"><Input value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://… or /media/…" /></Field>
      <Field label="Tags" hint="Comma separated"><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></Field>
      {error && <p role="alert" className="text-[12.5px] text-[#ef6b5e] m-0">{error}</p>}
    </Drawer>
  );
};

const SessionDetail = ({ itemRef }) => {
  const { can } = useAdminSession();
  const toast = useToast();
  const manager = can(P.EVENTS_MANAGE);
  const q = useAsync(async () => {
    const byId = /^[0-9a-f-]{36}$/i.test(itemRef);
    const { data, error } = await supabase.from('events').select('*').eq(byId ? 'id' : 'slug', itemRef).maybeSingle();
    if (error) throw friendlyError(error);
    return data;
  }, [itemRef]);
  const evt = q.data;
  const title = evt?.name || (q.loading ? 'Session' : 'Session not found');
  return (
    <Page title={title} back={{ to: `${BASE}/sessions`, label: 'Sessions' }} crumbs={[{ label: title }]}
      actions={evt && (
        <>
          {evt.slug && evt.status !== 'draft' && <Button icon="ExternalLink" to={`/sessions/${evt.slug}`} target="_blank">View public page</Button>}
          {can(P.EVENTS_ALL) && <Button icon="CalendarDays" to={`/admin-portal/events/${evt.id}`}>Event operations</Button>}
        </>
      )}>
      {q.loading ? <Skeleton rows={6} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : !evt ? (
        <Panel><EmptyState icon="CalendarDays" title="Session not found" hint="It may have been removed, or the link is wrong." action={<Button to={`${BASE}/sessions`} icon="ChevronLeft">Back to sessions</Button>} /></Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          {manager ? (
            <Panel title="Public copy">
              <EventForm key={evt.updated_at} initial={evt} fields={['description', 'story', 'image_url', 'tags']} submitLabel="Save content" onSaved={() => { toast('Content saved'); q.reload(); }} />
            </Panel>
          ) : <SessionCopyForm key={evt.updated_at} evt={evt} onSaved={q.reload} />}
          <div className="flex flex-col gap-4">
            <Panel title="Cover image">{evt.image_url ? <img src={evt.image_url} alt="" className="w-full rounded" /> : <p className="text-[13px] text-[#E7D5A4]/60 m-0">No cover image set.</p>}</Panel>
            <Panel title="At a glance">
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px] m-0">
                <dt className="text-[#E7D5A4]/60">Date</dt><dd className="m-0">{fmt.date(evt.event_date)} {evt.event_time || ''}</dd>
                <dt className="text-[#E7D5A4]/60">Venue</dt><dd className="m-0">{evt.venue || '—'}</dd>
                <dt className="text-[#E7D5A4]/60">Status</dt><dd className="m-0"><Badge status={evt.status}>{EVENT_STATUS_LABELS[evt.status]}</Badge></dd>
                <dt className="text-[#E7D5A4]/60">From</dt><dd className="m-0">{fmt.money(evt.price)}</dd>
              </dl>
              {can(P.EVENTS_ALL) && <Link to={`/admin-portal/events/${evt.id}/tickets`} className="inline-block mt-3 text-[12px] text-[#C99A2E] hover:underline">Ticket types & prices →</Link>}
            </Panel>
          </div>
        </div>
      )}
    </Page>
  );
};

// Artists (public pages) ----------------------------------------------------------------
const ArtistsList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('approved');
  const q = useAsync(async () => {
    let query = supabase.from('artists').select('id, name, stage_name, slug, genre, city, status, avatar_url, bio').order('name');
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw friendlyError(error);
    return data || [];
  }, [status]);
  const rows = (q.data || []).filter((a) => !search || `${a.name} ${a.stage_name || ''} ${a.genre || ''}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <Page title="Artists" subtitle="Approved artists appear on /artists and their own public page. Pending and rejected artists are never public.">
      <Panel flush>
        <div className="p-4"><Toolbar right={<Button size="sm" variant="primary" icon="Plus" to={`${BASE}/artists/new`}>Add artist</Button>}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search artists…" />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={[{ value: 'approved', label: 'Public (approved)' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }, { value: '', label: 'All' }]} />
        </Toolbar></div>
        <DataTable rows={rows} loading={q.loading} error={q.error} onRetry={q.reload}
          onRowClick={(a) => navigate(`${BASE}/artists/${a.slug || a.id}`)}
          empty={{ title: 'No artists', icon: 'Mic' }}
          columns={[
            { key: 'name', header: 'Artist', render: (a) => <span className="font-medium">{a.stage_name || a.name}</span> },
            { key: 'genre', header: 'Genre', render: (a) => a.genre || '—' },
            { key: 'page', header: 'Public page', mobileHidden: true, render: (a) => (a.status === 'approved' && a.slug ? <span className="font-mono text-[11.5px]">/artists/{a.slug}</span> : '—') },
            { key: 'profile', header: 'Profile', render: (a) => (!a.bio ? <Badge tone="warn">No bio</Badge> : !a.avatar_url ? <Badge tone="warn">No photo</Badge> : <Badge tone="good">Complete</Badge>) },
            { key: 'status', header: 'Status', render: (a) => <Badge status={a.status} /> },
          ]} />
      </Panel>
    </Page>
  );
};

const ArtistDetail = ({ itemRef }) => {
  const navigate = useNavigate();
  const q = useAsync(async () => {
    if (itemRef === 'new') return {};
    const byId = /^[0-9a-f-]{36}$/i.test(itemRef);
    const { data, error } = await supabase.from('artists').select('*').eq(byId ? 'id' : 'slug', itemRef).maybeSingle();
    if (error) throw friendlyError(error);
    return data;
  }, [itemRef]);
  const a = q.data;
  const title = itemRef === 'new' ? 'New artist' : a ? a.stage_name || a.name : q.loading ? 'Artist' : 'Artist not found';
  return (
    <Page title={title} back={{ to: `${BASE}/artists`, label: 'Artists' }} crumbs={[{ label: title }]}
      actions={a?.status === 'approved' && a.slug && <Button icon="ExternalLink" to={`/artists/${a.slug}`} target="_blank">View public page</Button>}>
      {q.loading ? <Skeleton rows={6} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : !a ? (
        <Panel><EmptyState icon="Mic" title="Artist not found" hint="It may have been removed, or the link is wrong." action={<Button to={`${BASE}/artists`} icon="ChevronLeft">Back to artists</Button>} /></Panel>
      ) : (
        <EntityDrawer inline key={itemRef} config={ENTITIES.artists} row={a} onClose={() => navigate(`${BASE}/artists`)} onSaved={() => navigate(`${BASE}/artists`)} />
      )}
    </Page>
  );
};

// Collections (TV / diary / gallery) -----------------------------------------------------------
const COLLECTION = {
  tv: { Manager: TvManager, label: 'Tangy TV', noun: 'video', area: 'tv', subtitle: 'Videos on /tv. Those marked "plays on the TV set" run on the retro TV.' },
  diary: { Manager: DiaryManager, label: 'Diary', noun: 'post', area: 'diary', subtitle: 'Stories and field notes on /diary. Drafts are never public.' },
  programmes: { Manager: ProgrammesManager, label: 'Programmes', noun: 'programme', area: 'sessions', subtitle: 'Seasons and series on /archive/programmes, with the sessions in each.' },
  gallery: { Manager: GalleryManager, label: 'Gallery', noun: 'album', area: 'media', subtitle: 'Albums on /gallery. Photos need alt text.' },
};

const CollectionList = ({ section }) => {
  const c = COLLECTION[section];
  return (
    <Page title={c.label} subtitle={c.subtitle}>
      <c.Manager mode="list" base={`${BASE}/${section}`} />
    </Page>
  );
};

const CollectionDetail = ({ section, itemRef }) => {
  const c = COLLECTION[section];
  const [name, setName] = useState(null);
  const title = itemRef === 'new' ? `New ${c.noun}` : name || c.label;
  return (
    <Page title={title} back={{ to: `${BASE}/${section}`, label: c.label }} crumbs={[{ label: title }]}>
      <c.Manager mode="detail" base={`${BASE}/${section}`} itemRef={itemRef} onLoaded={(row) => setName(row?.title || null)} />
    </Page>
  );
};

// Router ---------------------------------------------------------------------------------------------
export default function ContentPage() {
  const { section, item } = useParams();
  const [params] = useSearchParams();
  const sections = useSections();
  const allowed = (id) => sections.some((s) => s.id === id);

  // Old ?tab= links (announcements, notifications) → the section's own URL.
  if (!section && params.get('tab') && LEGACY_TABS[params.get('tab')]) {
    const rest = new URLSearchParams(params); rest.delete('tab');
    return <Navigate to={`${BASE}/${LEGACY_TABS[params.get('tab')]}${rest.toString() ? `?${rest}` : ''}`} replace />;
  }
  if (!section && params.get('new') === '1') return <Navigate to={`${BASE}/announcements?new=1`} replace />;
  if (!section) return <ContentOverview />;
  if (!SECTIONS.some((s) => s.id === section)) {
    return <Page title="Not found"><Panel><EmptyState title="No such content section" action={<Button to={BASE}>All content</Button>} /></Panel></Page>;
  }
  if (!allowed(section)) return <Page title="No access"><Panel><EmptyState icon="Lock" title="You don't have permission to access this section." /></Panel></Page>;

  if (section === 'sessions') return item ? <SessionDetail itemRef={item} key={item} /> : <SessionsList />;
  if (section === 'artists') return item ? <ArtistDetail itemRef={item} key={item} /> : <ArtistsList />;
  if (section === 'announcements') {
    return (
      <Page title="Announcements" subtitle="Website pop-ups and team notices, with audience, schedule and expiry.">
        <AnnouncementsManager startNew={params.get('new') === '1'} />
      </Page>
    );
  }
  if (section === 'media') {
    return (
      <Page title="Media library" subtitle="Files uploaded for content. Files of unpublished content are private until it is published.">
        <MediaLibrary />
      </Page>
    );
  }
  return item ? <CollectionDetail key={`${section}-${item}`} section={section} itemRef={item} /> : <CollectionList section={section} />;
}

