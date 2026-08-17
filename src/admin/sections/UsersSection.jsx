import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { isMockAuth } from '../../config/auth';
import { userService } from '../../services/userService';
import { SearchBar, LoadMoreButton, EmptyState, NotConfiguredState, DataTable, StatusBadge } from '../AdminUI';

const ROLES = ['user', 'artist', 'staff', 'admin', 'super_admin'];
const ROLE_FILTERS = ['all', 'patron', 'artist', 'vendor', 'crew', 'volunteer', 'sponsor', 'venue'];

// Mock users cannot self-escalate to admin from this screen — admin access
// stays limited to the deterministic admin@tangysessions.test dev account.
const MockUsers = () => {
  const [accounts, setAccounts] = useState(() => userService.getAllAccounts());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = roleFilter === 'all' ? accounts : accounts.filter((a) => a.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => [u.displayName, u.email, u.role].some((f) => String(f || '').toLowerCase().includes(q)));
    }
    return list;
  }, [accounts, roleFilter, search]);

  const columns = [
    { key: 'name', header: 'NAME', render: (u) => <span className="font-bold">{u.displayName}</span> },
    { key: 'email', header: 'EMAIL', render: (u) => u.email },
    { key: 'role', header: 'ROLE', render: (u) => <span className="uppercase text-[10px] font-bold text-[#C99A2E]">{u.role}</span> },
    { key: 'status', header: 'STATUS', render: (u) => <StatusBadge status={u.status || 'active'} /> },
    { key: 'joined', header: 'JOINED', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-6 rounded-sm">
      <h3 className="text-base sm:text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">USERS &amp; ROLES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, role..." count={filtered.length} />
      <div className="flex flex-wrap gap-2 mb-4">
        {ROLE_FILTERS.map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${roleFilter === r ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>
            {r}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState>NO REGISTERED USERS YET.</EmptyState> : (
        <DataTable
          columns={columns}
          rows={filtered}
          renderCard={(u) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm">{u.displayName}</div>
                  <div className="text-[10px] opacity-60">{u.email}</div>
                </div>
                <StatusBadge status={u.status || 'active'} />
              </div>
              <div className="text-[10px] uppercase font-bold text-[#C99A2E]">{u.role} · joined {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          )}
        />
      )}
    </div>
  );
};

export const UsersSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('profiles', {
    searchFields: ['full_name', 'email', 'role'],
  });
  const [roleError, setRoleError] = useState('');

  const updateRole = async (id, role) => {
    setRoleError('');
    const { error: err } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (err) {
      setRoleError('Only an admin account can change roles.');
      return;
    }
    reload();
  };

  if (isMockAuth) return <MockUsers />;
  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">USERS &amp; ROLES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, role..." count={total} />
      {roleError && <div className="mb-3 p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs">{roleError}</div>}
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO REGISTERED USERS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">NAME</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">PASSPORT ID</th>
                <th className="py-2">MEMBER SINCE</th>
                <th className="py-2">ROLE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold">{u.full_name || '—'}</td>
                  <td className="py-3">{u.email}</td>
                  <td className="py-3 opacity-70">{u.passport_id}</td>
                  <td className="py-3 opacity-60">{u.member_since ? new Date(u.member_since).toLocaleDateString() : '—'}</td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="bg-[#11100C] border border-[#C99A2E]/40 text-[#E7D5A4] text-[10px] px-2 py-1"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
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
