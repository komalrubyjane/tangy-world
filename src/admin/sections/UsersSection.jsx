import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { SearchBar, LoadMoreButton, EmptyState, LoadingState, NotConfiguredState } from '../AdminUI';

const ROLES = ['user', 'artist', 'staff', 'admin', 'super_admin'];

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

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">USERS &amp; ROLES</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, role..." count={total} />
      {roleError && <div className="mb-3 p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs">{roleError}</div>}
      {loading ? <LoadingState /> : rows.length === 0 ? (
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
