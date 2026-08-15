import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState, ActionButton } from '../AdminUI';

export const ContactEnquiriesSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('contact_enquiries', {
    searchFields: ['name', 'email', 'subject', 'inquiry_type'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('contact_enquiries').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CONTACT ENQUIRIES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, type..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NO MESSAGES YET.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((c) => (
            <div key={c.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <span className="font-bold">{c.name}</span> <span className="opacity-60 text-[10px]">· {c.email}</span>
                  <div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{c.inquiry_type} — {c.subject}</div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-[#E7D5A4]/80 mb-3 whitespace-pre-wrap">{c.message}</p>
              <div className="flex gap-1.5">
                {c.status !== 'read' && <ActionButton onClick={() => updateStatus(c.id, 'read')}>MARK READ</ActionButton>}
                {c.status !== 'replied' && <ActionButton tone="success" onClick={() => updateStatus(c.id, 'replied')}>MARK REPLIED</ActionButton>}
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
    </div>
  );
};

export const PrivateEnquiriesSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('private_enquiries', {
    searchFields: ['name', 'email', 'type', 'status'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('private_enquiries').update({ status }).eq('id', id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PRIVATE SESSION ENQUIRIES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, type..." count={total} />
      {loading ? <LoadingState /> : rows.length === 0 ? (
        <EmptyState>NO PRIVATE ENQUIRIES YET.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <div key={p.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <span className="font-bold">{p.name}</span> <span className="opacity-60 text-[10px]">· {p.email} · {p.phone}</span>
                  <div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{p.type.replace('_', ' ')} — {p.preferred_date} — {p.guest_count} guests</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-[#E7D5A4]/80 mb-3 whitespace-pre-wrap">{p.message}</p>
              <div className="flex gap-1.5">
                {p.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(p.id, 'approved')}>APPROVE</ActionButton>}
                {p.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(p.id, 'rejected')}>DECLINE</ActionButton>}
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
    </div>
  );
};
