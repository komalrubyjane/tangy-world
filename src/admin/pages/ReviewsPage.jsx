import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { friendlyError } from '../api';
import { signedUrl, formatBytes } from '../../lib/storage';
import { Page, Tabs, Panel, Badge, Button, Modal, Field, Textarea, EmptyState, ErrorState, Skeleton, FilterSelect, fmt, useToast } from '../ui';

// Curation queue for artist media and sponsor brand assets. Approval is a
// database decision: guard_artist_media / sponsor_assets policies only let
// entities.manage holders set approved/rejected, and stamp the reviewer.
// Files are previewed through short-lived signed URLs only.

const MEDIA_STATUS = { uploaded: ['Uploaded', 'muted'], under_review: ['Under review', 'info'], approved: ['Approved', 'good'], rejected: ['Changes needed', 'bad'], archived: ['Archived', 'muted'] };
const ASSET_STATUS = { submitted: ['Submitted', 'info'], approved: ['Approved', 'good'], changes_requested: ['Changes requested', 'bad'], archived: ['Archived', 'muted'] };

const SOURCES = {
  media: {
    table: 'artist_media', bucket: 'artist-media', statuses: MEDIA_STATUS, queue: 'under_review', approve: 'approved', reject: 'rejected',
    select: 'id, title, file_name, file_size_bytes, mime_type, media_type, status, review_note, created_at, storage_path, artists(name)',
    owner: (r) => r.artists?.name, kind: (r) => r.media_type,
  },
  assets: {
    table: 'sponsor_assets', bucket: 'sponsor-assets', statuses: ASSET_STATUS, queue: 'submitted', approve: 'approved', reject: 'changes_requested',
    select: 'id, title, file_name, file_size_bytes, mime_type, kind, status, review_note, created_at, storage_path, profiles:sponsor_id(full_name, email), events(name)',
    owner: (r) => r.profiles?.full_name || r.profiles?.email, kind: (r) => [r.kind, r.events?.name].filter(Boolean).join(' · '),
  },
};

export default function ReviewsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'assets' ? 'assets' : 'media';
  return (
    <Page title="Media & asset reviews" subtitle="Approve artist media and sponsor brand assets before they're used.">
      <Tabs value={tab} onChange={(t) => setParams(t === 'media' ? {} : { tab: t }, { replace: true })}
        tabs={[{ id: 'media', label: 'Artist media' }, { id: 'assets', label: 'Sponsor assets' }]} />
      <ReviewList key={tab} source={SOURCES[tab]} />
    </Page>
  );
}

const ReviewList = ({ source }) => {
  const toast = useToast();
  const [status, setStatus] = useState(source.queue);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from(source.table).select(source.select).order('created_at', { ascending: true }).limit(100);
    if (status) q = q.eq('status', status);
    const { data, error: err } = await q;
    if (err) { setError(friendlyError(err)); setRows(null); } else { setRows(data || []); setError(null); }
  }, [source, status]);
  useEffect(() => { load(); }, [load]);

  const decide = async (r, next, reviewNote) => {
    setBusy(true);
    const { error: err } = await supabase.from(source.table).update({ status: next, review_note: reviewNote || null }).eq('id', r.id);
    setBusy(false);
    if (err) { toast(friendlyError(err).message, 'bad'); return; }
    toast(next === source.approve ? 'Approved' : 'Sent back with a note', 'good');
    setRejecting(null); setNote(''); setPreview(null);
    load();
  };
  const open = async (r) => {
    try { setPreview({ r, url: await signedUrl(source.bucket, r.storage_path) }); } catch (err) { toast(err.message, 'bad'); }
  };
  const mime = (r) => (r.mime_type || '').split('/')[0];

  return (
    <Panel flush>
      <div className="p-3 border-b border-[#C99A2E]/15 flex items-center justify-between gap-2">
        <FilterSelect label="Status" value={status} onChange={setStatus}
          options={[...Object.entries(source.statuses).map(([value, [label]]) => ({ value, label })), { value: '', label: 'All' }]} />
        <span className="font-mono text-[11px] text-[#E7D5A4]/45">{rows ? `${rows.length} item${rows.length === 1 ? '' : 's'}` : ''}</span>
      </div>
      {error ? <ErrorState error={error} onRetry={load} /> : rows === null ? <Skeleton rows={4} /> : rows.length === 0 ? (
        <EmptyState icon="CircleCheck" title={status === source.queue ? 'Nothing waiting for review' : 'Nothing here'} />
      ) : (
        <ul className="divide-y divide-[#E7D5A4]/[0.06] font-sans">
          {rows.map((r) => {
            const [label, tone] = source.statuses[r.status] || [r.status, 'muted'];
            return (
              <li key={r.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3" data-review={r.title || r.file_name}>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => open(r)} className="text-[14px] text-[#EFE2C0] hover:underline text-left">{r.title || r.file_name}</button>
                  <div className="text-[12px] text-[#E7D5A4]/50">{[source.owner(r), source.kind(r), formatBytes(r.file_size_bytes), fmt.dateTime(r.created_at)].filter(Boolean).join(' · ')}</div>
                  {r.review_note && <p className="text-[12px] text-[#E7D5A4]/60 mt-0.5">Note: {r.review_note}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone}>{label}</Badge>
                  <Button size="sm" variant="ghost" icon="Eye" onClick={() => open(r)}>Preview</Button>
                  {r.status !== source.approve && <Button size="sm" variant="success" disabled={busy} onClick={() => decide(r, source.approve)}>Approve</Button>}
                  {r.status !== source.reject && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setRejecting(r); setNote(r.review_note || ''); }}>Request changes</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {preview && (
        <Modal title={preview.r.title || preview.r.file_name} onClose={() => setPreview(null)} wide
          footer={<Button variant="ghost" icon="ExternalLink" onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}>Open in new tab</Button>}>
          {mime(preview.r) === 'image' ? <img src={preview.url} alt="" className="max-h-[60vh] mx-auto rounded" />
            : mime(preview.r) === 'video' ? <video src={preview.url} controls className="w-full max-h-[60vh]" />
            : mime(preview.r) === 'audio' ? <audio src={preview.url} controls className="w-full" />
            : <p className="text-[13px] text-[#E7D5A4]/70">No inline preview — open it in a new tab.</p>}
        </Modal>
      )}
      {rejecting && (
        <Modal title="Request changes" onClose={() => setRejecting(null)}
          footer={<><Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" disabled={busy || !note.trim()} onClick={() => decide(rejecting, source.reject, note.trim())}>Send back</Button></>}>
          <Field label="Note to the owner *" hint="They see this next to the file."><Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </Modal>
      )}
    </Panel>
  );
};
