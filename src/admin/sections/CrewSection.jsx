import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { userService } from '../../services/userService';
import { eventService } from '../../services/eventService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, DataTable } from '../AdminUI';

const MockCrew = () => {
  const [rows, setRows] = useState(() => [
    ...userService.getProfileTable('crew').map((c) => ({ ...c, kind: 'crew', name: c.fullName, roleInterest: c.role })),
    ...userService.getProfileTable('volunteer').map((v) => ({ ...v, kind: 'volunteer', name: v.fullName, roleInterest: v.interest })),
  ]);
  const [search, setSearch] = useState('');
  const events = eventService.getAll();
  const refresh = () => setRows([
    ...userService.getProfileTable('crew').map((c) => ({ ...c, kind: 'crew', name: c.fullName, roleInterest: c.role })),
    ...userService.getProfileTable('volunteer').map((v) => ({ ...v, kind: 'volunteer', name: v.fullName, roleInterest: v.interest })),
  ]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => [r.name, r.email, r.roleInterest, r.status].some((f) => String(f || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const updateStatus = (r, status) => { userService.updateStatus(r.kind, r.id, status); refresh(); };
  const assignEvent = (r, eventId) => {
    userService.updateProfile(r.kind, r.id, { assignedEvents: [...new Set([...(r.assignedEvents || []), eventId])] });
    refresh();
  };

  const columns = [
    { key: 'name', header: 'APPLICANT', render: (r) => <>{r.name}<br /><span className="opacity-60">{r.email}</span></> },
    { key: 'dept', header: 'DEPARTMENT', render: (r) => <span className="capitalize">{r.kind}</span> },
    { key: 'role', header: 'ROLE INTEREST', render: (r) => <span className="font-bold">{r.roleInterest}</span> },
    { key: 'assigned', header: 'ASSIGNED EVENT', render: (r) => (
      <select defaultValue="" onChange={(e) => e.target.value && assignEvent(r, e.target.value)} className="bg-[#11100C] border border-[#C99A2E]/40 text-[10px] px-1.5 py-1">
        <option value="">{r.assignedEvents?.length ? `${r.assignedEvents.length} assigned` : 'Assign...'}</option>
        {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
    ) },
    { key: 'status', header: 'STATUS', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: 'ACTIONS', render: (r) => (
      <div className="flex gap-1.5 flex-wrap">
        {r.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(r, 'approved')}>APPROVE</ActionButton>}
        {r.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(r, 'rejected')}>REJECT</ActionButton>}
        <ActionButton onClick={() => alert(`Mock message sent to ${r.name}.`)}>MESSAGE</ActionButton>
      </div>
    ) },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CREW &amp; VOLUNTEER APPLICATIONS</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, status..." count={filtered.length} />
      {filtered.length === 0 ? <EmptyState>NO APPLICATIONS YET.</EmptyState> : (
        <DataTable
          columns={columns}
          rows={filtered}
          renderCard={(r) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{r.name}</div>
                  <div className="text-[10px] opacity-60">{r.email}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-[10px] opacity-70 capitalize">{r.kind} · {r.roleInterest}</div>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {r.status !== 'approved' && <ActionButton tone="success" onClick={() => updateStatus(r, 'approved')}>APPROVE</ActionButton>}
                {r.status !== 'rejected' && <ActionButton tone="danger" onClick={() => updateStatus(r, 'rejected')}>REJECT</ActionButton>}
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export const CrewSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('crew_applications', {
    searchFields: ['name', 'email', 'role_interest', 'status'],
  });

  const updateStatus = async (id, status) => {
    await supabase.from('crew_applications').update({ status }).eq('id', id);
    reload();
  };

  if (isMockAuth) return <MockCrew />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CREW &amp; VOLUNTEER APPLICATIONS</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, status..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
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
