import { useAdminList } from '../useAdminList';
import { SearchBar, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState } from '../AdminUI';

export const WaitlistSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore } = useAdminList('waitlist', {
    select: '*, events(name)',
    searchFields: ['name', 'email'],
  });

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">SESSION WAITLIST</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name or email..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NOBODY ON THE WAITLIST YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">NAME</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">PHONE</th>
                <th className="py-2">SESSION</th>
                <th className="py-2">JOINED</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold">{w.name}</td>
                  <td className="py-3">{w.email}</td>
                  <td className="py-3">{w.phone || '—'}</td>
                  <td className="py-3">{w.events?.name || '—'}</td>
                  <td className="py-3 opacity-60">{new Date(w.created_at).toLocaleDateString()}</td>
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
