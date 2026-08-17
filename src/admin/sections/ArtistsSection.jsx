import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { userService } from '../../services/userService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, DataTable, Drawer } from '../AdminUI';

const MockArtists = () => {
  const [artists, setArtists] = useState(() => userService.getProfileTable('artist'));
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const refresh = () => setArtists([...userService.getProfileTable('artist')]);

  const filtered = useMemo(() => {
    if (!search) return artists;
    const q = search.toLowerCase();
    return artists.filter((a) => [a.name, a.genre, a.email, a.city, a.status].some((f) => String(f || '').toLowerCase().includes(q)));
  }, [artists, search]);

  const updateStatus = (id, status) => { userService.updateStatus('artist', id, status); refresh(); };

  const columns = [
    { key: 'name', header: 'NAME', render: (a) => <>{a.name}<br /><span className="opacity-60 text-[10px]">{a.email}</span></> },
    { key: 'genre', header: 'GENRE', render: (a) => a.genre },
    { key: 'city', header: 'LOCATION', render: (a) => a.city },
    { key: 'upcoming', header: 'UPCOMING', render: (a) => a.upcomingPerformances?.length || 0 },
    { key: 'status', header: 'STATUS', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', header: 'ACTIONS', render: (a) => (
      <div className="flex gap-1.5 flex-wrap">
        <ActionButton onClick={() => setDetail(a)}>VIEW</ActionButton>
        {a.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(a.id, 'approved')}>APPROVE</ActionButton>}
        {a.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(a.id, 'rejected')}>REJECT</ActionButton>}
      </div>
    ) },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">ARTIST APPLICATIONS &amp; ROSTER</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, genre, city, status..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NO ARTIST APPLICATIONS YET.</EmptyState> : (
        <DataTable
          columns={columns}
          rows={filtered}
          renderCard={(a) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{a.name}</div>
                  <div className="text-[10px] opacity-60">{a.email}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="text-[10px] opacity-70">{a.genre} · {a.city}</div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                <ActionButton onClick={() => setDetail(a)}>VIEW</ActionButton>
                {a.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(a.id, 'approved')}>APPROVE</ActionButton>}
                {a.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(a.id, 'rejected')}>REJECT</ActionButton>}
              </div>
            </div>
          )}
        />
      )}

      {detail && (
        <Drawer onClose={() => setDetail(null)}>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-[#C99A2E]">{detail.name}</h3>
            <button onClick={() => setDetail(null)} className="text-xl leading-none opacity-70 hover:opacity-100">✕</button>
          </div>
          <StatusBadge status={detail.status} />
          <p className="text-xs opacity-80 whitespace-pre-wrap">{detail.bio}</p>
          <div className="text-xs flex flex-col gap-1.5">
            <div><span className="opacity-60">Genre:</span> {detail.genre}</div>
            <div><span className="opacity-60">City:</span> {detail.city}</div>
            <div><span className="opacity-60">Email:</span> {detail.email}</div>
            <div><span className="opacity-60">Phone:</span> {detail.phone}</div>
            <div><span className="opacity-60">Availability:</span> {detail.availability}</div>
            <div><span className="opacity-60">Portfolio:</span> {detail.portfolio?.join(', ') || '—'}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap pt-2">
            <ActionButton tone="success" onClick={() => { userService.updateStatus('artist', detail.id, 'approved'); refresh(); setDetail(null); }}>APPROVE</ActionButton>
            <ActionButton tone="danger" onClick={() => { userService.updateStatus('artist', detail.id, 'rejected'); refresh(); setDetail(null); }}>REJECT</ActionButton>
            <ActionButton onClick={() => alert(`Mock message sent to ${detail.name}.`)}>MESSAGE</ActionButton>
          </div>
        </Drawer>
      )}
    </div>
  );
};

export const ArtistsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('artists', {
    searchFields: ['name', 'genre', 'email', 'city', 'status'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('artists').update({ status }).eq('id', id);
    reload();
  };

  if (isMockAuth) return <MockArtists />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">ARTIST APPLICATIONS &amp; ROSTER</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, genre, city, status..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO ARTIST APPLICATIONS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">NAME</th>
                <th className="py-2">GENRE</th>
                <th className="py-2">CITY</th>
                <th className="py-2">APPLIED</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold text-sm">{a.name}<br /><span className="opacity-60 font-normal text-[10px]">{a.email}</span></td>
                  <td className="py-3">{a.genre}</td>
                  <td className="py-3">{a.city}</td>
                  <td className="py-3">{a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {a.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(a.id, 'approved')}>APPROVE</ActionButton>}
                    {a.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(a.id, 'rejected')}>REJECT</ActionButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
    </div>
  );
};
