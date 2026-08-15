import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

const STATUS_OPTIONS = ['draft', 'on-sale', 'sold-out', 'past', 'cancelled'];

const emptyForm = {
  slug: '', name: '', description: '', event_date: '', event_time: '', venue: '',
  image_url: '', capacity: 100, price: 799, status: 'draft', featured: false,
};

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEdit = Boolean(initial?.id);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      capacity: parseInt(form.capacity, 10) || 0,
      price: parseInt(form.price, 10) || 0,
    };
    delete payload.id;
    delete payload.created_at;

    const result = isEdit
      ? await supabase.from('events').update(payload).eq('id', initial.id)
      : await supabase.from('events').insert(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80">
      <form onSubmit={handleSave} className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#191410] border-2 border-[#C99A2E] p-6 flex flex-col gap-3 text-[#E7D5A4]">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-2">{isEdit ? 'EDIT EVENT' : 'CREATE EVENT'}</h3>

        <input required placeholder="Event name" value={form.name} onChange={set('name')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <input placeholder="Slug (auto if blank)" value={form.slug} onChange={set('slug')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <textarea placeholder="Description" rows={3} value={form.description} onChange={set('description')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />

        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={form.event_date} onChange={set('event_date')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
          <input placeholder="Time (e.g. 7:00 PM)" value={form.event_time} onChange={set('event_time')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        </div>

        <input placeholder="Venue" value={form.venue} onChange={set('venue')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <input placeholder="Image URL (/media/gallery/...)" value={form.image_url} onChange={set('image_url')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />

        <div className="grid grid-cols-2 gap-3">
          <input required type="number" min="0" placeholder="Capacity" value={form.capacity} onChange={set('capacity')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
          <input required type="number" min="0" placeholder="Price (₹)" value={form.price} onChange={set('price')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <select value={form.status} onChange={set('status')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured
          </label>
        </div>

        {error && <div className="p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs">{error}</div>}

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-[#C99A2E]/40 text-xs uppercase">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase disabled:opacity-50">
            {saving ? 'SAVING...' : isEdit ? 'SAVE CHANGES' : 'CREATE EVENT'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const EventsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('events', {
    searchFields: ['name', 'venue', 'status'],
  });
  const [modalEvent, setModalEvent] = useState(null); // null | {} | eventRow
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async (id) => {
    await supabase.from('events').delete().eq('id', id);
    setConfirmDeleteId(null);
    reload();
  };

  const toggleFeatured = async (evt) => {
    await supabase.from('events').update({ featured: !evt.featured }).eq('id', evt.id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <div className="flex justify-between items-center border-b border-[#C99A2E]/30 pb-2 mb-4">
        <h3 className="text-lg font-bold text-[#C99A2E]">EVENTS &amp; SESSIONS MANAGEMENT</h3>
        <button
          onClick={() => setModalEvent({})}
          className="px-3 py-1.5 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase"
        >
          + NEW EVENT
        </button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, venue, status..." count={total} />

      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NO EVENTS YET — CREATE ONE ABOVE.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map((evt) => (
            <div key={evt.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="text-[10px] text-[#C99A2E] font-bold">{evt.event_date}</div>
                  {evt.featured && <span className="text-[8px] bg-[#C99A2E] text-[#11100C] px-1.5 py-0.5 font-bold">FEATURED</span>}
                </div>
                <h4 className="font-display text-xl font-bold text-[#E7D5A4] mt-1">{evt.name}</h4>
                <div className="text-xs opacity-70 mt-1">{evt.venue}</div>
                <div className="mt-3 text-xs space-y-1">
                  <div>Cap: <span className="font-bold">{evt.capacity}</span></div>
                  <div>Price: <span className="font-bold text-[#C99A2E]">₹{evt.price}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#C99A2E]/20 flex flex-col gap-2">
                <StatusBadge status={evt.status} />
                <div className="flex gap-1.5 flex-wrap">
                  <ActionButton onClick={() => setModalEvent(evt)}>EDIT</ActionButton>
                  <ActionButton onClick={() => toggleFeatured(evt)}>{evt.featured ? 'UNFEATURE' : 'FEATURE'}</ActionButton>
                  {confirmDeleteId === evt.id ? (
                    <>
                      <ActionButton tone="danger" onClick={() => handleDelete(evt.id)}>CONFIRM DELETE</ActionButton>
                      <ActionButton onClick={() => setConfirmDeleteId(null)}>CANCEL</ActionButton>
                    </>
                  ) : (
                    <ActionButton tone="danger" onClick={() => setConfirmDeleteId(evt.id)}>DELETE</ActionButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />

      {modalEvent && (
        <EventFormModal
          initial={modalEvent}
          onClose={() => setModalEvent(null)}
          onSaved={() => { setModalEvent(null); reload(); }}
        />
      )}
    </div>
  );
};
