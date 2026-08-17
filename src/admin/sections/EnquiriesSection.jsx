import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { enquiryService } from '../../services/enquiryService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton } from '../AdminUI';

const CATEGORY_FILTERS = ['all', 'General', 'Artist', 'Vendor', 'Sponsor', 'Venue', 'Volunteer', 'Technical'];

const MockContactEnquiries = () => {
  const [rows, setRows] = useState(() => enquiryService.getContact());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const refresh = () => setRows([...enquiryService.getContact()]);

  const filtered = useMemo(() => {
    let list = categoryFilter === 'all' ? rows : rows.filter((c) => c.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => [c.name, c.email, c.subject, c.category].some((f) => String(f || '').toLowerCase().includes(q)));
    }
    return list;
  }, [rows, categoryFilter, search]);

  const setStatus = (id, status) => { enquiryService.updateContactStatus(id, status); refresh(); };
  const assign = (id) => { enquiryService.assignContact(id, 'Founder'); refresh(); };

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CONTACT ENQUIRIES</h3>
      <div className="flex gap-2 mb-3 flex-wrap">
        {CATEGORY_FILTERS.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${categoryFilter === c ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>{c}</button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, subject..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NO MESSAGES YET.</EmptyState> : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4 rounded-sm">
              <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                <div>
                  <span className="font-bold">{c.name}</span> <span className="opacity-60 text-[10px]">· {c.email}</span>
                  <div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{c.category} — {c.subject}</div>
                  {c.assignedTo && <div className="text-[9px] opacity-50 mt-0.5">Assigned: {c.assignedTo}</div>}
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-[#E7D5A4]/80 mb-3 whitespace-pre-wrap">{c.message}</p>
              <div className="flex gap-1.5 flex-wrap">
                {c.status !== 'read' && <ActionButton onClick={() => setStatus(c.id, 'read')}>MARK READ</ActionButton>}
                {c.status !== 'replied' && <ActionButton tone="success" onClick={() => setStatus(c.id, 'replied')}>MARK REPLIED</ActionButton>}
                {!c.assignedTo && <ActionButton onClick={() => assign(c.id)}>ASSIGN TO ME</ActionButton>}
                <ActionButton onClick={() => setStatus(c.id, 'archived')}>ARCHIVE</ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MockPrivateEnquiries = () => {
  const [rows, setRows] = useState(() => enquiryService.getPrivate());
  const [search, setSearch] = useState('');
  const refresh = () => setRows([...enquiryService.getPrivate()]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((p) => [p.name, p.email, p.type, p.status].some((f) => String(f || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const setStatus = (id, status) => { enquiryService.updatePrivateStatus(id, status); refresh(); };
  const assign = (id) => { enquiryService.assignPrivate(id, 'Founder'); refresh(); };

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PRIVATE SESSION ENQUIRIES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, type..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NO PRIVATE ENQUIRIES YET.</EmptyState> : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-[#11100C] border border-[#C99A2E]/30 p-4 rounded-sm">
              <div className="flex justify-between items-start gap-2 mb-2 flex-wrap">
                <div>
                  <span className="font-bold">{p.name}</span> <span className="opacity-60 text-[10px]">· {p.email} · {p.phone}</span>
                  <div className="text-[9px] text-[#C99A2E] uppercase mt-0.5">{p.type.replace('_', ' ')} — {p.preferredDate} — {p.guestCount} guests — {p.budget}</div>
                  {p.assignedAgent && <div className="text-[9px] opacity-50 mt-0.5">Assigned: {p.assignedAgent}</div>}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-[#E7D5A4]/80 mb-3 whitespace-pre-wrap">{p.message}</p>
              <div className="flex gap-1.5 flex-wrap">
                {p.status !== 'approved' && <ActionButton tone="success" onClick={() => setStatus(p.id, 'approved')}>APPROVE</ActionButton>}
                {p.status !== 'rejected' && <ActionButton tone="danger" onClick={() => setStatus(p.id, 'rejected')}>DECLINE</ActionButton>}
                {!p.assignedAgent && <ActionButton onClick={() => assign(p.id)}>ASSIGN TO ME</ActionButton>}
                {p.status !== 'resolved' && <ActionButton onClick={() => setStatus(p.id, 'resolved')}>RESOLVE</ActionButton>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ContactEnquiriesSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('contact_enquiries', {
    searchFields: ['name', 'email', 'subject', 'inquiry_type'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('contact_enquiries').update({ status }).eq('id', id);
    reload();
  };

  if (isMockAuth) return <MockContactEnquiries />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CONTACT ENQUIRIES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, type..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
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

  if (isMockAuth) return <MockPrivateEnquiries />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">PRIVATE SESSION ENQUIRIES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, type..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
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
