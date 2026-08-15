import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

export const ArtistsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('artists', {
    searchFields: ['name', 'genre', 'email', 'city', 'status'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('artists').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">ARTIST APPLICATIONS &amp; ROSTER</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, genre, city, status..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
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
