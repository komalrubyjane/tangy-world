import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { collaborationService } from '../../services/collaborationService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, DataTable } from '../AdminUI';

const TYPES = ['all', 'vendor', 'sponsor', 'venue_host'];

const MockCollaborations = () => {
  const [rows, setRows] = useState(() => collaborationService.getAll());
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const refresh = () => setRows([...collaborationService.getAll()]);

  const filtered = useMemo(() => {
    let list = typeFilter === 'all' ? rows : rows.filter((r) => r.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => [c.businessName, c.contactName, c.email, c.status, c.type].some((f) => String(f || '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, typeFilter, search]);

  const updateStatus = (id, status) => { collaborationService.updateStatus(id, status); refresh(); };

  const columns = [
    { key: 'type', header: 'TYPE', render: (c) => <span className="uppercase font-bold text-[10px] text-[#C99A2E]">{c.type.replace('_', ' ')}</span> },
    { key: 'business', header: 'BUSINESS', render: (c) => <span className="font-bold">{c.businessName}</span> },
    { key: 'contact', header: 'CONTACT', render: (c) => <>{c.contactName}<br /><span className="opacity-60">{c.email}</span></> },
    { key: 'status', header: 'STATUS', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'actions', header: 'ACTIONS', render: (c) => (
      <div className="flex gap-1.5 flex-wrap">
        {c.status !== 'active' && <ActionButton tone="success" onClick={() => updateStatus(c.id, 'active')}>APPROVE</ActionButton>}
        {c.status !== 'closed' && <ActionButton tone="danger" onClick={() => updateStatus(c.id, 'closed')}>CLOSE</ActionButton>}
      </div>
    ) },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">COLLABORATIONS — VENDORS / SPONSORS / VENUE &amp; HOST</h3>
      <div className="flex gap-2 mb-3 flex-wrap">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${typeFilter === t ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search business, contact, email..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NO COLLABORATION SUBMISSIONS YET.</EmptyState> : (
        <DataTable
          columns={columns}
          rows={filtered}
          renderCard={(c) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="uppercase font-bold text-[9px] text-[#C99A2E]">{c.type.replace('_', ' ')}</span>
                  <div className="font-bold text-sm">{c.businessName}</div>
                  <div className="text-[10px] opacity-60">{c.contactName} · {c.email}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {c.status !== 'active' && <ActionButton tone="success" onClick={() => updateStatus(c.id, 'active')}>APPROVE</ActionButton>}
                {c.status !== 'closed' && <ActionButton tone="danger" onClick={() => updateStatus(c.id, 'closed')}>CLOSE</ActionButton>}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

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

  if (isMockAuth) return <MockCollaborations />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">COLLABORATIONS — VENDORS / SPONSORS / VENUE &amp; HOST</h3>
      <div className="flex gap-2 mb-3">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${typeFilter === t ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search business, contact, email..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : filtered.length === 0 ? (
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
