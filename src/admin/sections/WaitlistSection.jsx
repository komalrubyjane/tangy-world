import { useState, useMemo } from 'react';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { waitlistService } from '../../services/waitlistService';
import { SearchBar, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, StatusBadge, DataTable } from '../AdminUI';

const MockWaitlist = () => {
  const [rows, setRows] = useState(() => waitlistService.getAll());
  const [search, setSearch] = useState('');
  const refresh = () => setRows([...waitlistService.getAll()]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((w) => [w.name, w.email].some((f) => String(f || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const notify = (id) => { waitlistService.notify(id); refresh(); };
  const remove = (id) => { waitlistService.remove(id); refresh(); };
  const convert = (id) => { waitlistService.convertToBooking(id); refresh(); };

  const columns = [
    { key: 'name', header: 'NAME', render: (w) => <span className="font-bold">{w.name}</span> },
    { key: 'email', header: 'EMAIL', render: (w) => w.email },
    { key: 'phone', header: 'PHONE', render: (w) => w.phone || '—' },
    { key: 'session', header: 'SESSION', render: (w) => w.event?.name || '—' },
    { key: 'joined', header: 'JOINED', render: (w) => new Date(w.createdAt).toLocaleDateString() },
    { key: 'status', header: 'STATUS', render: (w) => <StatusBadge status={w.status} /> },
    { key: 'actions', header: 'ACTIONS', render: (w) => (
      <div className="flex gap-1.5 flex-wrap">
        {w.status === 'waiting' && <ActionButton onClick={() => notify(w.id)}>NOTIFY</ActionButton>}
        {w.status !== 'converted' && <ActionButton tone="success" onClick={() => convert(w.id)}>CONVERT TO BOOKING</ActionButton>}
        <ActionButton tone="danger" onClick={() => remove(w.id)}>REMOVE</ActionButton>
      </div>
    ) },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">SESSION WAITLIST</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name or email..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NOBODY ON THE WAITLIST YET.</EmptyState> : (
        <DataTable
          columns={columns}
          rows={filtered}
          renderCard={(w) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{w.name}</div>
                  <div className="text-[10px] opacity-60">{w.email}</div>
                </div>
                <StatusBadge status={w.status} />
              </div>
              <div className="text-[10px] opacity-70">{w.event?.name || '—'} · joined {new Date(w.createdAt).toLocaleDateString()}</div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {w.status === 'waiting' && <ActionButton onClick={() => notify(w.id)}>NOTIFY</ActionButton>}
                {w.status !== 'converted' && <ActionButton tone="success" onClick={() => convert(w.id)}>CONVERT</ActionButton>}
                <ActionButton tone="danger" onClick={() => remove(w.id)}>REMOVE</ActionButton>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export const WaitlistSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore } = useAdminList('waitlist', {
    select: '*, events(name)',
    searchFields: ['name', 'email'],
  });

  if (isMockAuth) return <MockWaitlist />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">SESSION WAITLIST</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name or email..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
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
