import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState } from '../AdminUI';

// Real attendee list — every confirmed/pending booking, with its live
// check-in state, searchable by attendee name/email/registration code.
export const AttendeesSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore } = useAdminList('bookings', {
    select: '*, events(name, event_date), tickets(id, status)',
    searchFields: ['attendee_name', 'attendee_email', 'registration_code'],
  });

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">ATTENDEES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search attendee, email, registration code..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO ATTENDEES YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">ATTENDEE</th>
                <th className="py-2">EVENT</th>
                <th className="py-2">CODE</th>
                <th className="py-2">QTY</th>
                <th className="py-2">BOOKING</th>
                <th className="py-2">CHECK-IN</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const tickets = b.tickets || [];
                const checkedInCount = tickets.filter((t) => t.status === 'checked_in').length;
                return (
                  <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                    <td className="py-3">{b.attendee_name}<br /><span className="opacity-60">{b.attendee_email}</span></td>
                    <td className="py-3">{b.events?.name || '—'}</td>
                    <td className="py-3 font-bold text-[#C99A2E]">{b.registration_code}</td>
                    <td className="py-3">{b.quantity}</td>
                    <td className="py-3"><StatusBadge status={b.status} /></td>
                    <td className="py-3">
                      {tickets.length === 0 ? (
                        <span className="text-[10px] text-[#E7D5A4]/40 uppercase font-bold">No tickets yet</span>
                      ) : checkedInCount === tickets.length ? (
                        <StatusBadge status="confirmed" />
                      ) : checkedInCount > 0 ? (
                        <span className="text-[10px] text-[#f59e0b] uppercase font-bold">{checkedInCount}/{tickets.length} checked in</span>
                      ) : (
                        <span className="text-[10px] text-[#E7D5A4]/40 uppercase font-bold">Not checked in</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
    </div>
  );
};
