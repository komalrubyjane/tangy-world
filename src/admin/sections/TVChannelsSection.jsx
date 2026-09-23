import { useState } from 'react';
import { tvChannelService } from '../../services/tvChannelService';
import { SearchBar, EmptyState, ActionButton } from '../AdminUI';

const emptyForm = { title: '', url: '', status: 'active' };

function ChannelFormModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => (isEdit ? { ...initial } : emptyForm));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    if (isEdit) {
      const payload = { ...form };
      delete payload.id;
      tvChannelService.update(initial.id, payload);
    } else {
      tvChannelService.create(form);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80">
      <form
        onSubmit={handleSave}
        className="w-full max-w-lg bg-[#191410] border-2 border-[#C99A2E] p-6 flex flex-col gap-3 text-[#E7D5A4]"
      >
        <h3 className="text-lg font-bold text-[#C99A2E] mb-2">{isEdit ? 'EDIT CHANNEL' : 'NEW CHANNEL'}</h3>

        <input
          required
          placeholder="Channel title"
          value={form.title}
          onChange={set('title')}
          className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
        />
        <div>
          <input
            required
            placeholder="Video URL — e.g. /media/background-video/my-clip.mp4 or an external link"
            value={form.url}
            onChange={set('url')}
            className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
          />
          <p className="text-[9px] opacity-50 mt-1 leading-relaxed">
            No file upload here — this is mock data with no backend storage. Point at a file already in
            public/media/background-video/, or a link to a video hosted elsewhere.
          </p>
        </div>

        <select value={form.status} onChange={set('status')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
          <option value="active">Active — shows on the live TV</option>
          <option value="hidden">Hidden — kept here, not played</option>
        </select>

        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-[#C99A2E]/40 text-xs uppercase">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase">
            {isEdit ? 'SAVE CHANGES' : 'ADD CHANNEL'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const TVChannelsSection = () => {
  const [channels, setChannels] = useState(() => tvChannelService.getAll());
  const [search, setSearch] = useState('');
  const [modalChannel, setModalChannel] = useState(null);

  const refresh = () => setChannels([...tvChannelService.getAll()]);

  const filtered = search
    ? channels.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : channels;

  const handleDelete = (channel) => {
    if (!window.confirm(`Delete "${channel.title}"? This can't be undone.`)) return;
    tvChannelService.remove(channel.id);
    refresh();
  };

  const toggleStatus = (channel) => {
    tvChannelService.update(channel.id, { status: channel.status === 'active' ? 'hidden' : 'active' });
    refresh();
  };

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <div className="flex justify-between items-center border-b border-[#C99A2E]/30 pb-2 mb-4">
        <h3 className="text-lg font-bold text-[#C99A2E]">TANGY TV CHANNELS</h3>
        <button onClick={() => setModalChannel({})} className="px-3 py-1.5 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase">
          + NEW CHANNEL
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search channel title..." count={filtered.length} />

      {filtered.length === 0 ? (
        <EmptyState>NO CHANNELS — ADD ONE ABOVE.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c, idx) => (
            <div key={c.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-bold uppercase text-[#C99A2E]">CH {String(idx + 1).padStart(2, '0')}</span>
                  <span className={`text-[9px] font-bold uppercase ${c.status === 'active' ? 'text-[#4ade80]' : 'text-[#E7D5A4]/40'}`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="font-condensed text-lg font-bold text-[#E7D5A4] mt-1">{c.title}</h4>
                <p className="text-[9px] opacity-50 mt-1 break-all">{c.url}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#C99A2E]/20 flex flex-wrap gap-1.5">
                <ActionButton onClick={() => setModalChannel(c)}>EDIT</ActionButton>
                <ActionButton onClick={() => toggleStatus(c)}>
                  {c.status === 'active' ? 'HIDE' : 'UNHIDE'}
                </ActionButton>
                <ActionButton tone="danger" onClick={() => handleDelete(c)}>
                  DELETE
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalChannel && (
        <ChannelFormModal
          initial={modalChannel}
          onClose={() => setModalChannel(null)}
          onSaved={() => {
            setModalChannel(null);
            refresh();
          }}
        />
      )}
    </div>
  );
};
