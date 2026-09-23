import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { notificationService } from '../../services/notificationService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, EmailStatusBadge } from '../AdminUI';

export const ArtistsSection = () => {
  const [notifByAppId, setNotifByAppId] = useState({});
  const [sendingFor, setSendingFor] = useState(null);
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('artists', {
    searchFields: ['name', 'genre', 'email', 'city', 'status'],
  });

  const loadNotifications = useCallback(async () => {
    setNotifByAppId(await notificationService.getForSourceTable('artists'));
  }, []);
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Approve/reject now go through the same atomic, admin-only RPC pattern
  // as the other application flows (approve_collaboration/
  // approve_crew_application, 0011_role_portals.sql) instead of a direct
  // `.update()` — see approve_artist_application in
  // 0015_application_lifecycle.sql. Artist role provisioning itself is
  // unchanged: artists.status stays authoritative, never profiles.role.
  const approve = async (id) => {
    const { error: err } = await supabase.rpc('approve_artist_application', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
    setSendingFor(id);
    await notificationService.sendApprovalEmail('artists', id);
    await loadNotifications();
    setSendingFor(null);
  };
  const reject = async (id) => {
    const { error: err } = await supabase.rpc('reject_artist_application', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
  };
  const resendEmail = async (id) => {
    setSendingFor(id);
    const res = await notificationService.sendApprovalEmail('artists', id, { force: true });
    if (!res.success) alert(res.error || 'Could not send email.');
    await loadNotifications();
    setSendingFor(null);
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">ARTIST APPLICATIONS &amp; ROSTER</h3>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, genre, city, status..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO ARTIST APPLICATIONS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">NAME</th>
                <th className="py-2">GENRE</th>
                <th className="py-2">CITY</th>
                <th className="py-2">APPLIED</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const notif = notifByAppId[a.id];
                return (
                <tr key={a.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 font-bold text-sm">{a.name}<br /><span className="opacity-60 font-normal text-[10px]">{a.email}</span></td>
                  <td className="py-3">{a.genre}</td>
                  <td className="py-3">{a.city}</td>
                  <td className="py-3">{a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '—'}</td>
                  <td className="py-3"><StatusBadge status={a.status} /></td>
                  <td className="py-3">{a.user_id ? <EmailStatusBadge notification={notif} /> : <span className="opacity-40 text-[9px] uppercase">no linked account</span>}</td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {a.status !== 'approved' && <ActionButton tone="success" onClick={() => approve(a.id)} disabled={sendingFor === a.id}>APPROVE</ActionButton>}
                    {a.status !== 'rejected' && <ActionButton tone="danger" onClick={() => reject(a.id)}>REJECT</ActionButton>}
                    {a.status === 'approved' && notif?.status === 'failed' && (
                      <ActionButton onClick={() => resendEmail(a.id)} disabled={sendingFor === a.id}>{sendingFor === a.id ? 'SENDING...' : 'RESEND EMAIL'}</ActionButton>
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
