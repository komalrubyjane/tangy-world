import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { signedUrl } from '../../lib/storage';
import { friendlyError } from '../api';
import { useAsync } from '../hooks';
import { useAdminSession } from '../AdminSession';
import { P } from '../rbac';
import { Page, Panel, Badge, Button, DataTable, SearchInput, Toolbar, Modal, Field, Input, Textarea, Select, ConfirmDialog, KeyValue, Skeleton, ErrorState, EmptyState, fmt, useToast, cx } from '../ui';

// Admin → Artists → Applications (artist_applications, 0033). The database
// decides every transition (review_artist_application); internal notes and
// review fields live in application_reviews, which applicants can never read.
const BASE = '/admin-portal/artists/applications';
const FILTERS = [['', 'All'], ['submitted', 'New'], ['under_review', 'Under review'], ['needs_information', 'Needs information'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['withdrawn', 'Withdrawn']];
const STATUS_LABEL = { draft: 'Draft', submitted: 'New', under_review: 'Under review', needs_information: 'Needs info', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' };
const STATUS_TONE = { submitted: 'info', under_review: 'warn', needs_information: 'warn', approved: 'good', rejected: 'bad', draft: 'muted', withdrawn: 'muted' };
const INFO_ITEMS = ['Missing performance video', 'Missing social links', 'Incomplete profile', 'Technical rider required', 'Additional experience details', 'Other'];
const TAGS = ['Genre fit', 'Instrument', 'Experienced', 'Local', 'Performance style', 'Available', 'Recommended', 'Featured', 'New'];
const ASSESS = [['experience', 'Experience'], ['media_quality', 'Media quality'], ['completeness', 'Profile completeness'], ['technical', 'Technical readiness'], ['availability', 'Availability']];
const LEVELS = ['', 'Strong', 'Adequate', 'Weak'];

export function ArtistApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const q = useAsync(async () => {
    const { data, error } = await supabase.from('artist_applications').select('id, status, data, submitted_at, created_at, video_url, video_storage_path')
      .neq('status', 'draft').order('submitted_at', { ascending: false, nullsFirst: false });
    if (error) throw friendlyError(error);
    return data || [];
  }, []);
  const rows = (q.data || []).filter((a) => (!status || a.status === status)
    && (!search || JSON.stringify([a.data?.about, a.data?.artistry?.primary_genre]).toLowerCase().includes(search.toLowerCase())));
  const count = (s) => (q.data || []).filter((a) => !s || a.status === s).length;
  return (
    <Page title="Artist applications" subtitle="Review applications, ask for what's missing, and approve or decline. Internal notes are never shown to artists.">
      <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map(([k, l]) => (
          <button key={k || 'all'} type="button" aria-pressed={status === k} onClick={() => setParams(k ? { status: k } : {})}
            className={cx('h-8 px-3 rounded-full border text-[12px]', status === k ? 'bg-[#C99A2E] border-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/25 text-[#E7D5A4]/85')}>
            {l} <span className="opacity-70">{count(k)}</span>
          </button>
        ))}
      </div>
      <Panel flush>
        <div className="p-3 border-b border-[#C99A2E]/15"><Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Name, city or genre…" /></Toolbar></div>
        <DataTable rows={rows} loading={q.loading} error={q.error} onRetry={q.reload} onRowClick={(a) => navigate(`${BASE}/${a.id}`)}
          empty={{ title: 'No applications here', icon: 'Inbox' }}
          columns={[
            { key: 'artist', header: 'Artist', render: (a) => <div><div className="text-[#EFE2C0]">{a.data?.about?.stage_name || '—'}</div><div className="text-[12px] text-[#E7D5A4]/60">{a.data?.about?.full_name}</div></div> },
            { key: 'genre', header: 'Genre', render: (a) => a.data?.artistry?.primary_genre || '—' },
            { key: 'city', header: 'City', mobileHidden: true, render: (a) => a.data?.about?.city || '—' },
            { key: 'exp', header: 'Experience', mobileHidden: true, render: (a) => [a.data?.artistry?.experience_level, a.data?.experience?.years_performing && `${a.data.experience.years_performing} yrs`].filter(Boolean).join(' · ') || '—' },
            { key: 'ig', header: 'Instagram', mobileHidden: true, render: (a) => <span className="text-[12px]">{a.data?.online?.instagram || '—'}</span> },
            { key: 'sp', header: 'Spotify', mobileHidden: true, render: (a) => (a.data?.online?.spotify ? 'Yes' : '—') },
            { key: 'date', header: 'Submitted', render: (a) => <span className="font-mono text-[11.5px]">{fmt.date(a.submitted_at)}</span> },
            { key: 'status', header: 'Status', render: (a) => <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge> },
          ]} />
      </Panel>
    </Page>
  );
}

// YouTube / Vimeo link → an embeddable player URL (privacy-enhanced YouTube).
function embedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

const VideoPreview = ({ app }) => {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (app.video_storage_path) signedUrl('artist-media', app.video_storage_path, 900).then(setSrc, () => setFailed(true));
  }, [app.video_storage_path]);
  const embed = embedUrl(app.video_url);
  if (embed) return <iframe title={`Performance video — ${app.data?.about?.stage_name || 'applicant'}`} src={embed} className="w-full aspect-video rounded border border-[#C99A2E]/20" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" data-video-preview />;
  if (app.video_storage_path) return failed ? <p className="text-[13px] text-[#ef6b5e]">The video could not be loaded.</p>
    : src ? <video src={src} controls className="w-full aspect-video rounded bg-black" data-video-preview /> : <Skeleton rows={2} />;
  if (app.video_url) return <a href={app.video_url} target="_blank" rel="noopener noreferrer" className="underline">{app.video_url}</a>;
  return <p className="text-[13px] text-[#E7D5A4]/60">No performance video.</p>;
};

const list = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : v) || null;

export function ArtistApplicationDetailPage() {
  const { id } = useParams();
  const { can } = useAdminSession();
  const toast = useToast();
  const [dialog, setDialog] = useState(null);
  const [info, setInfo] = useState({ items: [], message: '', note: '' });
  const [reject, setReject] = useState({ internal: '', message: '' });
  const [review, setReview] = useState(null);
  const q = useAsync(async () => {
    const [{ data: app, error }, { data: r }] = await Promise.all([
      supabase.from('artist_applications').select('*').eq('id', id).maybeSingle(),
      supabase.from('application_reviews').select('notes, tags, assessment, updated_at').eq('source_table', 'artist_applications').eq('source_id', id).maybeSingle(),
    ]);
    if (error) throw friendlyError(error);
    return { app, review: r };
  }, [id]);
  useEffect(() => {
    if (q.data) setReview({ tags: q.data.review?.tags || [], assessment: q.data.review?.assessment || {}, notes: '', history: q.data.review?.notes || '' });
  }, [q.data]);
  const app = q.data?.app;
  const canReview = can(P.APPLICATIONS_REVIEW);
  if (q.loading && !app) return <Page title="Application"><Skeleton rows={8} /></Page>;
  if (q.error) return <Page title="Application"><Panel><ErrorState error={q.error} onRetry={q.reload} /></Panel></Page>;
  if (!app) return <Page title="Application not found"><Panel><EmptyState title="Application not found" action={<Button to={BASE}>All applications</Button>} /></Panel></Page>;
  const d = app.data || {};
  const act = async (action, extra = {}) => {
    const { error } = await supabase.rpc('review_artist_application', { p_id: app.id, p_action: action, p_items: extra.items || null, p_message: extra.message || null, p_internal: extra.internal || null });
    if (error) throw new Error(friendlyError(error).message);
    toast({ start_review: 'Marked under review', request_info: 'Information requested — the artist has been notified', approve: 'Artist approved — their portal is ready', reject: 'Application declined' }[action]);
    setDialog(null);
    q.reload();
  };
  const saveReview = async () => {
    const { error } = await supabase.from('application_reviews').upsert({
      source_table: 'artist_applications', source_id: app.id, tags: review.tags, assessment: review.assessment,
      notes: [review.history, review.notes.trim()].filter(Boolean).join('\n\n') || null,
    });
    if (error) { toast(friendlyError(error).message, 'bad'); return; }
    toast('Review saved (internal)');
    q.reload();
  };
  const open = ['submitted', 'under_review'].includes(app.status);
  const metrics = [['Instagram followers', d.online?.instagram_followers], ['Spotify monthly listeners', d.online?.spotify_monthly_listeners], ['YouTube subscribers', d.online?.youtube_subscribers]].filter(([, v]) => v);

  return (
    <Page title={d.about?.stage_name || 'Application'} back={{ to: BASE, label: 'Applications' }} crumbs={[{ label: d.about?.stage_name || 'Application' }]}
      subtitle={`${d.about?.full_name || ''} · submitted ${fmt.date(app.submitted_at)}`}
      actions={canReview && (
        <div className="flex flex-wrap gap-2" data-application-actions>
          <Badge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</Badge>
          {app.status === 'submitted' && <Button onClick={() => act('start_review').catch((e) => toast(e.message, 'bad'))}>Start review</Button>}
          {open && <Button onClick={() => setDialog('info')}>Request information</Button>}
          {open && <Button variant="danger" onClick={() => setDialog('reject')}>Reject</Button>}
          {open && <Button variant="success" onClick={() => setDialog('approve')}>Approve artist</Button>}
          {app.status === 'approved' && app.artist_id && <Button icon="ExternalLink" to={`/admin/preview/artist/${app.artist_id}`}>Preview public profile</Button>}
        </div>
      )}>
      {app.status === 'needs_information' && app.info_request && (
        <Panel title="Waiting for the artist"><p className="text-[13px] m-0">Requested {fmt.dateTime(app.info_request.requested_at)}: {list(app.info_request.items)}{app.info_request.message ? ` — “${app.info_request.message}”` : ''}</p></Panel>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Performance media"><VideoPreview app={app} />
            <KeyValue items={[['Title', d.media?.title], ['Recorded at', d.media?.recorded_at], ['Date', d.media?.recorded_on], ['Type', d.media?.performance_type], ['About', d.media?.description],
              ['Second video', d.media?.second_video_url], ['Media consent', app.media_consent ? 'Confirmed' : 'Not confirmed']].filter(([, v]) => v)} />
          </Panel>
          <Panel title="Profile"><KeyValue items={[['Full name', d.about?.full_name], ['Stage name', d.about?.stage_name], ['Email', d.about?.email], ['Phone', d.about?.phone], ['WhatsApp', d.about?.whatsapp], ['City', [d.about?.city, d.about?.country].filter(Boolean).join(', ')], ['Website', d.about?.website]]} /></Panel>
          <Panel title="Artistry"><KeyValue items={[['Type', d.artistry?.artist_type], ['Primary genre', d.artistry?.primary_genre], ['Genres', list(d.artistry?.genres)], ['Sub-genres', d.artistry?.sub_genres], ['Instruments', list([...(d.artistry?.instruments || []), d.artistry?.other_instruments])],
            ['Languages', list(d.artistry?.languages)], ['Style', d.artistry?.style], ['Short bio', d.artistry?.short_bio], ['Long bio', d.artistry?.long_bio], ['Years active', d.artistry?.years_active], ['Level', d.artistry?.experience_level]]} /></Panel>
          <Panel title="Experience"><KeyValue items={[['Years performing', d.experience?.years_performing], ['Live performances', d.experience?.performance_count], ['Venues', d.experience?.venues], ['Festivals', d.experience?.festivals],
            ['Cultural events', d.experience?.cultural_events], ['Collaborations', d.experience?.collaborations], ['Played Tangy before', d.experience?.played_tangy && `${d.experience.played_tangy}${d.experience.tangy_event ? ` — ${d.experience.tangy_event}` : ''}`]]} />
            {(d.experience?.highlights || []).length > 0 && (
              <ul className="mt-3 text-[13px] list-disc pl-5">{d.experience.highlights.map((h, i) => <li key={i}>{[h.event, h.venue, h.year, h.type].filter(Boolean).join(' · ')}</li>)}</ul>
            )}
          </Panel>
          <Panel title="Social"><KeyValue items={[['Instagram', d.online?.instagram], ['Spotify', d.online?.spotify], ['YouTube', d.online?.youtube], ['SoundCloud', d.online?.soundcloud], ['Website', d.online?.website], ['Other', d.online?.other]]} />
            {metrics.length > 0 && <p className="text-[12.5px] mt-3 mb-0">{metrics.map(([k, v]) => `${k}: ${Number(v).toLocaleString('en-IN')}`).join(' · ')} <Badge tone="muted">Artist provided</Badge></p>}
          </Panel>
          <Panel title="Technical & hospitality"><KeyValue items={[['Format', d.technical?.format], ['Set duration', d.technical?.set_duration], ['Requirements', list(d.technical?.requirements)], ['Own equipment', d.technical?.own_equipment], ['Rider', d.technical?.rider],
            ['Travelling from', d.hospitality?.travel_origin], ['Members', d.hospitality?.members], ['Accommodation', d.hospitality?.accommodation], ['Travel help', d.hospitality?.travel_assistance], ['Food', d.hospitality?.food], ['Other', d.hospitality?.requirements]]} /></Panel>
          <Panel title="Availability"><KeyValue items={[['Typical', d.availability?.typical], ['Preferred days', list(d.availability?.preferred_days)], ['Unavailable', d.availability?.unavailable_dates], ['Notice', d.availability?.notice], ['Last-minute', d.availability?.last_minute], ['Travel radius', d.availability?.travel_radius], ['Cities', d.availability?.preferred_cities]]} /></Panel>
        </div>
        {review && (
          <Panel title="Internal review" subtitle="Only the team sees this. No automatic scoring — your judgement decides.">
            <div className="flex flex-col gap-3" data-internal-review>
              <fieldset className="border-0 p-0 m-0"><legend className="text-[12px] text-[#E7D5A4]/70 mb-1.5">Tags</legend>
                <div className="flex flex-wrap gap-1.5">{TAGS.map((t) => {
                  const on = review.tags.includes(t);
                  return <button key={t} type="button" aria-pressed={on} disabled={!canReview} onClick={() => setReview({ ...review, tags: on ? review.tags.filter((x) => x !== t) : [...review.tags, t] })}
                    className={cx('h-7 px-2.5 rounded-full border text-[11.5px]', on ? 'bg-[#C99A2E] border-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/25')}>{t}</button>;
                })}</div>
              </fieldset>
              {ASSESS.map(([k, l]) => (
                <Field key={k} label={l}><Select value={review.assessment[k] || ''} disabled={!canReview} onChange={(e) => setReview({ ...review, assessment: { ...review.assessment, [k]: e.target.value } })}>
                  {LEVELS.map((v) => <option key={v} value={v}>{v || 'Not assessed'}</option>)}
                </Select></Field>
              ))}
              {review.history && <div className="text-[12.5px] whitespace-pre-line bg-[#11100C] border border-[#C99A2E]/15 rounded p-2 max-h-48 overflow-y-auto">{review.history}</div>}
              <Field label="Add a note"><Textarea rows={3} value={review.notes} disabled={!canReview} onChange={(e) => setReview({ ...review, notes: e.target.value })} /></Field>
              {canReview && <Button variant="primary" onClick={saveReview}>Save review</Button>}
            </div>
          </Panel>
        )}
      </div>

      {dialog === 'approve' && (
        <ConfirmDialog title="Approve this artist?" confirmLabel="Approve" tone="success"
          message={`${d.about?.stage_name} gets an artist account and portal, and is notified.`}
          onConfirm={() => act('approve')} onClose={() => setDialog(null)} />
      )}
      {dialog === 'info' && (
        <Modal title="Request information" onClose={() => setDialog(null)}
          footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="primary" disabled={!info.items.length && !info.message.trim()} onClick={() => act('request_info', { items: info.items, message: info.message.trim(), internal: info.note.trim() }).catch((e) => toast(e.message, 'bad'))}>Send request</Button></>}>
          <fieldset className="border-0 p-0 m-0"><legend className="text-[12.5px] mb-2">What's needed</legend>
            {INFO_ITEMS.map((i) => (
              <label key={i} className="flex items-center gap-2 text-[13px] py-1"><input type="checkbox" className="w-4 h-4 accent-[#C99A2E]" checked={info.items.includes(i)}
                onChange={(e) => setInfo({ ...info, items: e.target.checked ? [...info.items, i] : info.items.filter((x) => x !== i) })} />{i}</label>
            ))}
          </fieldset>
          <Field label="Message to the artist"><Textarea rows={3} value={info.message} onChange={(e) => setInfo({ ...info, message: e.target.value })} /></Field>
          <Field label="Internal note (not shown to the artist)"><Input value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} /></Field>
        </Modal>
      )}
      {dialog === 'reject' && (
        <Modal title="Reject application" onClose={() => setDialog(null)}
          footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" disabled={!reject.internal.trim()} onClick={() => act('reject', { internal: reject.internal.trim(), message: reject.message.trim() }).catch((e) => toast(e.message, 'bad'))}>Reject</Button></>}>
          <Field label="Internal reason *" hint="Kept in the private review — never shown to the artist"><Textarea rows={3} value={reject.internal} onChange={(e) => setReject({ ...reject, internal: e.target.value })} /></Field>
          <Field label="Message to the artist (optional)" hint="A short, kind status message they will see"><Textarea rows={2} value={reject.message} onChange={(e) => setReject({ ...reject, message: e.target.value })} /></Field>
        </Modal>
      )}
    </Page>
  );
}

