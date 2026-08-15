import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

const TYPES = ['all', 'vendor', 'sponsor', 'venue_host'];

export const CollaborationsSection = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('collaborations', {
    searchFields: ['business_name', 'contact_name', 'email', 'status', 'type'],
  });

  const filtered = typeFilter === 'all' ? rows : rows.filter((r) => r.type === typeFilter);

  const updateStatus = async (id, status) => {
    await supabase.from('collaborations').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">COLLABORATIONS — VENDORS / SPONSORS / VENUE &amp; HOST</h3>
      <div className="flex gap-2 mb-3">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${typeFilter === t ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search business, contact, email..." count={total} />
      {loading ? <LoadingState /> : filtered.length === 0 ? (
        <EmptyState>NO COLLABORATION SUBMISSIONS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">TYPE</th>
                <th className="py-2">BUSINESS</th>
                <th className="py-2">CONTACT</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 uppercase font-bold text-[10px] text-[#C99A2E]">{c.type.replace('_', ' ')}</td>
                  <td className="py-3 font-bold">{c.business_name}</td>
                  <td className="py-3">{c.contact_name}<br /><span className="opacity-60">{c.email}</span></td>
                  <td className="py-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {c.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(c.id, 'approved')}>APPROVE</ActionButton>}
                    {c.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(c.id, 'rejected')}>REJECT</ActionButton>}
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
