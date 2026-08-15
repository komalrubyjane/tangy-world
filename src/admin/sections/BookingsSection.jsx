import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

export const BookingsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('bookings', {
    select: '*, events(name)',
    searchFields: ['registration_code', 'attendee_name', 'attendee_email'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">BOOKINGS &amp; TICKETS</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search code, name, email..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NO BOOKINGS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">CODE</th>
                <th className="py-2">ATTENDEE</th>
                <th className="py-2">EVENT</th>
                <th className="py-2">QTY</th>
                <th className="py-2">AMOUNT</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold text-[#C99A2E]">{b.registration_code}</td>
                  <td className="py-3">{b.attendee_name}<br /><span className="opacity-60">{b.attendee_email}</span></td>
                  <td className="py-3">{b.events?.name || '—'}</td>
                  <td className="py-3">{b.quantity}</td>
                  <td className="py-3 font-bold">₹{b.amount}</td>
                  <td className="py-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {b.status !== 'confirmed' && <ActionButton tone="success" onClick={() => updateStatus(b.id, 'confirmed')}>CONFIRM</ActionButton>}
                    {b.status !== 'refunded' && <ActionButton tone="danger" onClick={() => updateStatus(b.id, 'refunded')}>REFUND</ActionButton>}
                    {b.status !== 'cancelled' && <ActionButton onClick={() => updateStatus(b.id, 'cancelled')}>CANCEL</ActionButton>}
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
