import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NotFoundPage } from '../../pages/content/NotFoundPage';
import { usePageMeta } from '../../hooks/usePageMeta';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../services/workspaceApi';
import { portalApi } from '../../portal/portalApi';
import { uploadWithProgress, signedUrl, removeFile, safeFileName, formatBytes } from '../../lib/storage';
import { Panel, Badge, Button, Input, Select, Field, EmptyState, ErrorState, Skeleton, Modal, Icon, fmt, cx } from '../../admin/ui';

// Private artist media (artist-media bucket, 0013) with the curation workflow
// from 0020: uploaded → under review → approved / rejected, or archived.
// The guard_artist_media trigger is authoritative — artists can submit or
// archive their own media but never approve it.

const MAX_BYTES = 50 * 1024 * 1024;
const TYPES = [['demo', 'Demo'], ['audio', 'Audio track'], ['live_set', 'Live set'], ['video', 'Video'], ['image', 'Photo'], ['press_kit', 'Press kit']];
const TYPE_LABEL = Object.fromEntries(TYPES);
const STATUS = {
  uploaded: ['Uploaded', 'muted'], under_review: ['Under review', 'info'], approved: ['Approved', 'good'],
  rejected: ['Changes needed', 'bad'], archived: ['Archived', 'muted'],
};
const FILTERS = [['active', 'Active'], ['approved', 'Approved'], ['under_review', 'Under review'], ['rejected', 'Changes needed'], ['archived', 'Archived']];
// Upload details (0033): what it is, when, and which session it belongs to.
const KINDS = [['photo', 'Photo'], ['video', 'Video'], ['recording', 'Performance recording'], ['press', 'Press material'], ['poster', 'Poster']];
const guessKind = (file) => (file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'recording' : 'press');
const detailFields = (d) => ({
  description: d.description?.trim() || null, kind: d.kind || null, performance_type: d.performance_type?.trim() || null,
  taken_on: d.taken_on || null, event_id: d.event_id || null,
  tags: [...new Set((d.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))],
});
const guessType = (file) => (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'press_kit' : 'demo');
const kindOf = (m) => (m.mime_type || '').split('/')[0];

export const MediaPage = () => {
  usePageMeta({ title: 'Media', noindex: true });
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  useEffect(() => { portalApi.myEvents(true).then(setSessions, () => {}); }, []);
  const inputRef = useRef(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('active');
  const [pending, setPending] = useState(null); // { file, title, media_type, submit }
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(null);
  const [preview, setPreview] = useState(null); // { item, url }

  const load = useCallback(async () => {
    if (!user?.id) return;
    try { setItems(await workspaceApi.media(user.id)); setError(null); } catch (err) { setError(err); }
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  const choose = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { setMsg(`That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_BYTES)}.`); return; }
    setMsg('');
    setPending({ file, title: file.name.replace(/\.[^.]+$/, ''), media_type: guessType(file), submit: true, kind: guessKind(file), description: '', tags: '', taken_on: '', event_id: '', performance_type: '' });
  };

  const upload = async () => {
    const { file, title, media_type, submit } = pending;
    const path = `${user.id}/${Date.now()}-${safeFileName(file.name)}`;
    setProgress(0);
    try {
      await uploadWithProgress('artist-media', path, file, { onProgress: setProgress, maxBytes: MAX_BYTES });
      try {
        await workspaceApi.addMedia({
          artist_id: user.id, storage_path: path, file_name: file.name, file_size_bytes: file.size,
          mime_type: file.type || null, title: title.trim() || file.name, media_type, status: submit ? 'under_review' : 'uploaded', ...detailFields(pending),
        });
      } catch (err) {
        await removeFile('artist-media', path).catch(() => {});
        throw err;
      }
      setMsg(submit ? 'Uploaded and sent to Tangy for review.' : 'Uploaded. Submit it for review when you are ready.');
      setPending(null);
      load();
    } catch (err) { setMsg(err.message); }
    finally { setProgress(null); }
  };

  const setStatus = async (m, status, done) => {
    setBusy(m.id); setMsg('');
    try { await workspaceApi.updateMedia(m.id, { status }); setMsg(done); load(); } catch (err) { setMsg(err.message); }
    finally { setBusy(null); }
  };

  const remove = async (m) => {
    setBusy(m.id); setMsg('');
    try {
      await workspaceApi.deleteMedia(m.id);
      await removeFile('artist-media', m.storage_path).catch(() => {});
      setMsg('Deleted.');
      load();
    } catch (err) { setMsg(err.message); }
    finally { setBusy(null); }
  };

  const open = async (m) => {
    try { setPreview({ item: m, url: await signedUrl('artist-media', m.storage_path) }); } catch (err) { setMsg(err.message); }
  };

  const shown = (items || []).filter((m) => (filter === 'active' ? m.status !== 'archived' : m.status === filter));

  return (
    <div className="w-full flex flex-col gap-4 text-left font-body text-[#E7D5A4]">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d1a437]">Artist workspace</p>
          <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] m-0 leading-none">Media</h1>
          <p className="text-[13px] text-[#ecdcaf]/65 mt-1">Demos, live sets, photos and press kits for Tangy curators. Files stay private to you and Tangy.</p>
        </div>
        <Button variant="primary" icon="Upload" disabled={progress !== null} onClick={() => inputRef.current?.click()}>Upload media</Button>
        <input ref={inputRef} type="file" className="hidden" accept="audio/*,video/*,image/*,application/pdf" onChange={choose} data-media-input />
      </header>

      {msg && <p role="status" className="text-[13px] text-[#f5b544]">{msg}</p>}

      <div role="group" aria-label="Filter media" className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}
            className={cx('h-8 px-3 rounded-full border font-mono text-[11px] uppercase tracking-[0.08em] whitespace-nowrap', filter === k ? 'border-[#C99A2E] bg-[#C99A2E] text-[#11100C]' : 'border-[#E7D5A4]/25 text-[#ecdcaf]/80')}>
            {label}{items ? ` (${items.filter((m) => (k === 'active' ? m.status !== 'archived' : m.status === k)).length})` : ''}
          </button>
        ))}
      </div>

      <Panel flush>
        {error ? <ErrorState error={error} onRetry={load} /> : items === null ? <Skeleton rows={4} /> : shown.length === 0 ? (
          <EmptyState icon="Music" title={filter === 'active' ? 'No media yet' : 'Nothing here'} hint={`Upload audio, video, photos or a press kit (up to ${formatBytes(MAX_BYTES)} each).`}
            action={filter === 'active' && <Button icon="Upload" onClick={() => inputRef.current?.click()}>Upload media</Button>} />
        ) : (
          <ul className="divide-y divide-[#E7D5A4]/[0.07]">
            {shown.map((m) => {
              const [label, tone] = STATUS[m.status] || [m.status, 'muted'];
              return (
                <li key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-media={m.title || m.file_name}>
                  <button type="button" onClick={() => open(m)} aria-label={`Preview ${m.title || m.file_name}`}
                    className="w-11 h-11 rounded border border-[#C99A2E]/30 bg-[#11100C] flex items-center justify-center text-[#e4bd5c] shrink-0">
                    <Icon name={kindOf(m) === 'image' ? 'Image' : kindOf(m) === 'video' ? 'Video' : kindOf(m) === 'audio' ? 'Music' : 'FileText'} size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link to={`/artist/media/${m.id}`} className="block text-[15px] text-[#EFE2C0] truncate hover:underline" data-media-link>{m.title || m.file_name}</Link>
                    <div className="text-[12px] text-[#E7D5A4]/55">{[TYPE_LABEL[m.media_type] || m.media_type, formatBytes(m.file_size_bytes), fmt.date(m.created_at)].join(' · ')}</div>
                    {m.review_note && <p className="text-[12.5px] text-[#E7D5A4]/80 mt-1 border-l-2 border-[#C99A2E]/40 pl-2">Tangy: {m.review_note}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone}>{label}</Badge>
                    {['uploaded', 'rejected'].includes(m.status) && <Button size="sm" disabled={busy === m.id} onClick={() => setStatus(m, 'under_review', 'Sent to Tangy for review.')}>Submit for review</Button>}
                    {m.status === 'archived'
                      ? <Button size="sm" variant="ghost" disabled={busy === m.id} onClick={() => setStatus(m, 'uploaded', 'Restored.')}>Restore</Button>
                      : <Button size="sm" variant="ghost" disabled={busy === m.id} onClick={() => setStatus(m, 'archived', 'Archived.')}>Archive</Button>}
                    {m.status !== 'approved' && <Button size="sm" variant="ghost" icon="Trash2" disabled={busy === m.id} onClick={() => remove(m)} aria-label={`Delete ${m.title || m.file_name}`} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {pending && (
        <Modal title="Upload media" onClose={() => progress === null && setPending(null)}
          footer={<>
            <Button variant="ghost" disabled={progress !== null} onClick={() => setPending(null)}>Cancel</Button>
            <Button variant="primary" disabled={progress !== null} onClick={upload}>{progress !== null ? `Uploading ${progress}%` : 'Upload'}</Button>
          </>}>
          <p className="text-[13px] text-[#E7D5A4]/70 mb-3">{pending.file.name} · {formatBytes(pending.file.size)}</p>
          <div className="flex flex-col gap-3">
            <Field label="Title"><Input maxLength={200} value={pending.title} onChange={(e) => setPending({ ...pending, title: e.target.value })} /></Field>
            <Field label="Type">
              <Select value={pending.media_type} onChange={(e) => setPending({ ...pending, media_type: e.target.value })}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
            </Field>
            <MediaDetailFields value={pending} onChange={(v) => setPending({ ...pending, ...v })} sessions={sessions} />
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={pending.submit} onChange={(e) => setPending({ ...pending, submit: e.target.checked })} className="accent-[#C99A2E]" />
              Submit to Tangy for review now
            </label>
            {progress !== null && (
              <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} className="h-1.5 rounded bg-[#E7D5A4]/10 overflow-hidden">
                <div className="h-full bg-[#C99A2E] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title={preview.item.title || preview.item.file_name} onClose={() => setPreview(null)}
          footer={<Button variant="ghost" icon="ExternalLink" onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}>Open in new tab</Button>}>
          {kindOf(preview.item) === 'image' ? <img src={preview.url} alt={preview.item.title || ''} className="max-h-[60vh] mx-auto rounded" />
            : kindOf(preview.item) === 'video' ? <video src={preview.url} controls className="w-full max-h-[60vh] rounded" />
            : kindOf(preview.item) === 'audio' ? <audio src={preview.url} controls className="w-full" />
            : <p className="text-[13px] text-[#E7D5A4]/70">No inline preview for this file type — open it in a new tab.</p>}
          <p className="text-[11.5px] text-[#E7D5A4]/60 mt-3">This private link expires in 10 minutes.</p>
        </Modal>
      )}
    </div>
  );
};

// The upload details, shared by the upload dialog and the media page.
function MediaDetailFields({ value, onChange, sessions }) {
  return (
    <>
      <Field label="What is it?"><Select value={value.kind || ''} onChange={(e) => onChange({ kind: e.target.value })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      <Field label="Description"><Input maxLength={1000} value={value.description || ''} onChange={(e) => onChange({ description: e.target.value })} placeholder="Live acoustic set at …" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={value.taken_on || ''} onChange={(e) => onChange({ taken_on: e.target.value })} /></Field>
        <Field label="Performance type"><Input maxLength={80} value={value.performance_type || ''} onChange={(e) => onChange({ performance_type: e.target.value })} placeholder="Acoustic set, DJ set…" /></Field>
      </div>
      <Field label="Related session"><Select value={value.event_id || ''} onChange={(e) => onChange({ event_id: e.target.value })}>
        <option value="">None</option>{sessions.map((s) => <option key={s.event_id} value={s.event_id}>{s.name} · {s.event_date}</option>)}
      </Select></Field>
      <Field label="Tags" hint="Comma separated"><Input value={value.tags || ''} onChange={(e) => onChange({ tags: e.target.value })} /></Field>
    </>
  );
}

// /artist/media/:mediaId — one item: preview, status and its details.
export const MediaDetailPage = () => {
  const { mediaId } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState(undefined);
  const [form, setForm] = useState(null);
  const [url, setUrl] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [msg, setMsg] = useState('');
  usePageMeta({ title: item?.title || 'Media', noindex: true });
  useEffect(() => {
    if (!user?.id) return;
    workspaceApi.media(user.id).then((rows) => {
      const m = rows.find((r) => r.id === mediaId) || null;
      setItem(m);
      if (m) {
        setForm({ title: m.title || '', kind: m.kind || '', description: m.description || '', taken_on: m.taken_on || '', event_id: m.event_id || '', performance_type: m.performance_type || '', tags: (m.tags || []).join(', ') });
        signedUrl('artist-media', m.storage_path).then(setUrl, () => {});
      }
    }, () => setItem(null));
    portalApi.myEvents(true).then(setSessions, () => {});
  }, [user?.id, mediaId]);
  if (item === undefined) return <Skeleton rows={4} />;
  if (!item) return <NotFoundPage what="media item" back={{ to: '/artist/media', label: 'Back to media' }} />;
  const [label, tone] = STATUS[item.status] || [item.status, 'muted'];
  const save = async () => {
    try { setItem(await workspaceApi.updateMedia(item.id, { title: form.title.trim() || item.file_name, ...detailFields(form) })); setMsg('Saved.'); } catch (err) { setMsg(err.message); }
  };
  return (
    <div className="flex flex-col gap-4 text-[#E7D5A4]" data-media-page={item.id}>
      <nav aria-label="Breadcrumb" className="text-xs text-[#E7D5A4]/70"><Link to="/artist/media" className="hover:underline">Media</Link> › <span aria-current="page">{item.title || item.file_name}</span></nav>
      <header className="flex flex-wrap items-center gap-3"><h1 className="font-condensed text-3xl uppercase text-[#F3E7C9] m-0">{item.title || item.file_name}</h1><Badge tone={tone}>{label}</Badge></header>
      {item.review_note && <p className="text-sm border-l-2 border-[#C99A2E]/50 pl-3">Tangy: {item.review_note}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Preview">
          {!url ? <Skeleton rows={3} /> : kindOf(item) === 'image' ? <img src={url} alt={item.title || ''} className="max-h-[50vh] mx-auto rounded" />
            : kindOf(item) === 'video' ? <video src={url} controls className="w-full max-h-[50vh] rounded" />
            : kindOf(item) === 'audio' ? <audio src={url} controls className="w-full" />
            : <Button icon="ExternalLink" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>Open file</Button>}
          <p className="text-[11.5px] text-[#E7D5A4]/60 mt-3">Private link — expires in 10 minutes. Only you and the Tangy team can open this file.</p>
        </Panel>
        <Panel title="Details">
          <div className="flex flex-col gap-3">
            <Field label="Title"><Input maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <MediaDetailFields value={form} onChange={(v) => setForm({ ...form, ...v })} sessions={sessions} />
            <Button variant="primary" onClick={save}>Save details</Button>
            {msg && <p role="status" className="text-[13px] m-0">{msg}</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
};
