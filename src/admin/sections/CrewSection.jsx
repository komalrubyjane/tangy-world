import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

export const CrewSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('crew_applications', {
    searchFields: ['name', 'email', 'role_interest', 'status'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('crew_applications').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CREW &amp; VOLUNTEER APPLICATIONS</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, status..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NO APPLICATIONS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">APPLICANT</th>
                <th className="py-2">ROLE INTEREST</th>
                <th className="py-2">EVENT</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3">{v.name}<br /><span className="opacity-60">{v.email}</span></td>
                  <td className="py-3 font-bold">{v.role_interest}</td>
                  <td className="py-3">{v.event_interest || '—'}</td>
                  <td className="py-3"><StatusBadge status={v.status} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {v.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(v.id, 'approved')}>APPROVE</ActionButton>}
                    {v.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(v.id, 'rejected')}>REJECT</ActionButton>}
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
