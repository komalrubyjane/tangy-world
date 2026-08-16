import { useState, useMemo } from 'react';
import { announcementService } from '../../services/announcementService';
import { SearchBar, StatusBadge, EmptyState, ActionButton } from '../AdminUI';
import { AnnouncementCharacterOverlay } from '../../components/announcements/AnnouncementCharacterOverlay';

const CHARACTER_OPTIONS = [
  { id: 'violinist', label: 'Violinist' },
  { id: 'guitarist', label: 'Guitarist' },
  { id: 'veena', label: 'Veena' },
  { id: 'kathak', label: 'Kathak' },
  { id: 'hiphop', label: 'Hip-Hop' },
];

const AUDIENCE_OPTIONS = ['all', 'guest', 'patron', 'artist'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high'];

const emptyForm = {
  title: '',
  description: '',
  category: announcementService.categories[0],
  character: 'violinist',
  destination: '/sessions',
  audience: 'all',
  priority: 'normal',
  publishAt: '',
  expireAt: '',
  status: 'draft',
};

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(val) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function AnnouncementFormModal({ initial, onClose, onSaved, onPreview }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() =>
    initial?.id
      ? { ...initial, publishAt: toDatetimeLocal(initial.publishAt), expireAt: toDatetimeLocal(initial.expireAt) }
      : emptyForm
  );

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      publishAt: fromDatetimeLocal(form.publishAt) || new Date().toISOString(),
      expireAt: fromDatetimeLocal(form.expireAt),
    };
    if (isEdit) {
      delete payload.id;
      announcementService.update(initial.id, payload);
    } else {
      announcementService.create(payload);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80">
      <form
        onSubmit={handleSave}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#191410] border-2 border-[#C99A2E] p-6 flex flex-col gap-3 text-[#E7D5A4]"
      >
        <h3 className="text-lg font-bold text-[#C99A2E] mb-2">{isEdit ? 'EDIT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT'}</h3>

        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={set('title')}
          className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
        />
        <textarea
          required
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={set('description')}
          className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={set('category')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {announcementService.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={form.character} onChange={set('character')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {CHARACTER_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <input
          placeholder="Destination path (e.g. /sessions)"
          value={form.destination}
          onChange={set('destination')}
          className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={form.audience} onChange={set('audience')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select value={form.priority} onChange={set('priority')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase font-bold text-[#C99A2E] block mb-1">Publish At</label>
            <input
              type="datetime-local"
              value={form.publishAt}
              onChange={set('publishAt')}
              className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-[#C99A2E] block mb-1">Expire At</label>
            <input
              type="datetime-local"
              value={form.expireAt}
              onChange={set('expireAt')}
              className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <select value={form.status} onChange={set('status')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
          {announcementService.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => onPreview(form)}
            className="flex-1 py-2 border border-[#C99A2E] text-[#C99A2E] text-xs uppercase font-bold hover:bg-[#C99A2E]/10"
          >
            PREVIEW
          </button>
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-[#C99A2E]/40 text-xs uppercase">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase">
            {isEdit ? 'SAVE CHANGES' : 'CREATE'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState(() => announcementService.getAll());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalAnnouncement, setModalAnnouncement] = useState(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState(null);

  const refresh = () => setAnnouncements([...announcementService.getAll()]);

  const filtered = useMemo(() => {
    let list = announcements;
    if (categoryFilter) list = list.filter((a) => a.category === categoryFilter);
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list;
  }, [announcements, categoryFilter, statusFilter, search]);

  const setStatus = (id, status) => {
    announcementService.setStatus(id, status);
    refresh();
  };

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <div className="flex justify-between items-center border-b border-[#C99A2E]/30 pb-2 mb-4">
        <h3 className="text-lg font-bold text-[#C99A2E]">ANNOUNCEMENTS</h3>
        <button onClick={() => setModalAnnouncement({})} className="px-3 py-1.5 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase">
          + NEW ANNOUNCEMENT
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search title, description..." count={filtered.length} />

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/60 px-2 py-1.5 text-[10px]">
          <option value="">ALL CATEGORIES</option>
          {announcementService.categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/60 px-2 py-1.5 text-[10px]">
          <option value="">ALL STATUSES</option>
          {announcementService.statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>NO ANNOUNCEMENTS — CREATE ONE ABOVE.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-bold uppercase text-[#C99A2E]">{a.category}</span>
                  <StatusBadge status={a.status} />
                </div>
                <h4 className="font-display text-lg font-bold text-[#E7D5A4] mt-1">{a.title}</h4>
                <p className="text-xs opacity-70 mt-1 line-clamp-2">{a.description}</p>
                <div className="text-[9px] opacity-50 mt-2 uppercase">
                  {a.character} · {a.destination} · {a.audience} · priority: {a.priority}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#C99A2E]/20 flex flex-wrap gap-1.5">
                <ActionButton onClick={() => setModalAnnouncement(a)}>EDIT</ActionButton>
                <ActionButton onClick={() => setPreviewAnnouncement(a)}>PREVIEW</ActionButton>
                {a.status !== 'published' && (
                  <ActionButton tone="success" onClick={() => setStatus(a.id, 'published')}>
                    PUBLISH
                  </ActionButton>
                )}
                {a.status !== 'archived' && (
                  <ActionButton tone="danger" onClick={() => setStatus(a.id, 'archived')}>
                    ARCHIVE
                  </ActionButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAnnouncement && (
        <AnnouncementFormModal
          initial={modalAnnouncement}
          onClose={() => setModalAnnouncement(null)}
          onSaved={() => {
            setModalAnnouncement(null);
            refresh();
          }}
          onPreview={(form) => setPreviewAnnouncement(form)}
        />
      )}

      <AnnouncementCharacterOverlay
        isOpen={!!previewAnnouncement}
        announcement={previewAnnouncement}
        character={previewAnnouncement?.character}
        position="bottom-right"
        duration={8000}
        onClose={() => setPreviewAnnouncement(null)}
      />
    </div>
  );
};
