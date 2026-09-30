import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { workspaceApi } from '../services/workspaceApi';
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
const guessType = (file) => (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'press_kit' : 'demo');
const kindOf = (m) => (m.mime_type || '').split('/')[0];

export const MediaPage = () => {
  const { user } = useAuth();
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
    setPending({ file, title: file.name.replace(/\.[^.]+$/, ''), media_type: guessType(file), submit: true });
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
          mime_type: file.type || null, title: title.trim() || file.name, media_type, status: submit ? 'under_review' : 'uploaded',
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
    <div className="w-full p-3 sm:p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-4 text-left font-sans text-[#E7D5A4]">
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

      <div role="tablist" aria-label="Filter media" className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
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
                    <div className="text-[15px] text-[#EFE2C0] truncate">{m.title || m.file_name}</div>
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
