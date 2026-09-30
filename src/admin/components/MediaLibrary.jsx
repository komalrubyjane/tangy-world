import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { content, MEDIA_PREFIX, contentErrorMessage } from '../../lib/contentService';
import { useAsync } from '../hooks';
import { useContentRights } from './ContentCollections';
import { Panel, Button, Toolbar, FilterSelect, SearchInput, EmptyState, ErrorState, Skeleton, ConfirmDialog, useToast, fmt } from '../ui';
import { MediaImg } from '../../components/ui/Media';

// Every file in the private content-media bucket (0028/0029), grouped by area.
// Listing and previews go through Storage with the editor's own session, so
// the bucket's RLS decides what is visible.
const AREAS = [['tv', 'Tangy TV'], ['diary', 'Diary'], ['gallery', 'Gallery'], ['sessions', 'Sessions']];
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;

async function listArea(area) {
  const bucket = supabase.storage.from('content-media');
  const { data: folders, error } = await bucket.list(area, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  const files = await Promise.all((folders || []).filter((f) => !f.metadata).map(async (f) => {
    const { data } = await bucket.list(`${area}/${f.name}`, { limit: 20 });
    return (data || []).filter((x) => x.metadata).map((x) => ({ ...x, area, path: `${area}/${f.name}/${x.name}` }));
  }));
  return files.flat();
}

export const MediaLibrary = () => {
  const rights = useContentRights('media');
  const toast = useToast();
  const [area, setArea] = useState('');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [uploadArea, setUploadArea] = useState('gallery');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const q = useAsync(async () => (await Promise.all(AREAS.map(([a]) => listArea(a)))).flat(), []);
  const files = (q.data || []).filter((f) => (!area || f.area === area) && (!search || f.path.includes(search.toLowerCase())));

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const res = await content.upload(uploadArea, file);
    setBusy(false);
    if (res.error) { toast(contentErrorMessage(res.error) || res.error.message, 'bad'); return; }
    toast('Uploaded. Copy its reference into a content item to use it.');
    q.reload();
  };
  const copy = async (path) => {
    await navigator.clipboard?.writeText(`${MEDIA_PREFIX}${path}`).catch(() => {});
    toast('Reference copied — paste it into a media field.');
  };
  const remove = (f) => setConfirm({
    title: 'Delete file?', tone: 'danger', confirmLabel: 'Delete',
    message: `${f.name} will be removed. Content still pointing at it will show an empty image.`,
    onConfirm: async () => {
      const { error } = await supabase.storage.from('content-media').remove([f.path]);
      if (error) throw new Error(contentErrorMessage(error) || error.message);
      toast('File deleted.');
      q.reload();
    },
  });

  if (!rights.view) return <Panel><EmptyState icon="Lock" title="You don't have access to the media library." /></Panel>;
  return (
    <Panel flush>
      <div className="p-4">
        <Toolbar right={(rights.create || rights.edit) && (
          <>
            <FilterSelect label="Upload to" value={uploadArea} onChange={setUploadArea} options={AREAS.map(([value, label]) => ({ value, label: `Upload to ${label}` }))} />
            <input ref={input} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <Button variant="primary" icon="Upload" onClick={() => input.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </>
        )}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search file paths…" />
          <FilterSelect label="Area" value={area} onChange={setArea} options={[{ value: '', label: 'All areas' }, ...AREAS.map(([value, label]) => ({ value, label }))]} />
        </Toolbar>
      </div>
      {q.loading ? <Skeleton rows={4} /> : q.error ? <ErrorState error={q.error} onRetry={q.reload} /> : files.length === 0 ? (
        <EmptyState icon="Paperclip" title="No uploaded files" hint="Files uploaded from the TV, diary, gallery or session editors appear here. Bundled site media (/media/…) isn't listed." />
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 list-none m-0" data-media-library>
          {files.map((f) => (
            <li key={f.path} className="border border-[#C99A2E]/20 rounded-md overflow-hidden flex flex-col">
              {IMAGE.test(f.name)
                ? <MediaImg src={`${MEDIA_PREFIX}${f.path}`} alt="" className="w-full aspect-video object-cover" />
                : <div className="w-full aspect-video bg-black/40 flex items-center justify-center font-mono text-[11px] text-[#E7D5A4]/60">{f.name.split('.').pop()?.toUpperCase()}</div>}
              <div className="p-2 flex flex-col gap-1 text-[11.5px]">
                <span className="font-mono truncate" title={f.path}>{f.path}</span>
                <span className="text-[#E7D5A4]/60">{fmt.date(f.created_at)} · {Math.round((f.metadata?.size || 0) / 1024)} KB</span>
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" icon="Link2" onClick={() => copy(f.path)}>Copy</Button>
                  {rights.remove && <Button size="sm" variant="ghost" icon="Trash2" aria-label={`Delete ${f.name}`} onClick={() => remove(f)} />}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirm && <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />}
    </Panel>
  );
};
