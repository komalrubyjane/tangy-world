import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { notificationService } from '../../services/notificationService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, EmailStatusBadge } from '../AdminUI';

const CATEGORIES = ['all', 'crew', 'volunteer'];

export const CrewSection = () => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notifByAppId, setNotifByAppId] = useState({});
  const [sendingFor, setSendingFor] = useState(null);
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('crew_applications', {
    searchFields: ['name', 'email', 'role_interest', 'status'],
  });

  const loadNotifications = useCallback(async () => {
    setNotifByAppId(await notificationService.getForSourceTable('crew_applications'));
  }, []);
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filtered = categoryFilter === 'all' ? rows : rows.filter((r) => r.category === categoryFilter);

  // Approval provisions the role + crew_profiles/volunteer_profiles row
  // atomically, server-side — see approve_crew_application in
  // 0011_role_portals.sql (now also queues an application_notifications
  // row). The client never writes profiles.role directly. The approval
  // email is a separate step right after — a failed send never undoes it.
  const approve = async (id) => {
    const { error: err } = await supabase.rpc('approve_crew_application', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
    setSendingFor(id);
    await notificationService.sendApprovalEmail('crew_applications', id);
    await loadNotifications();
    setSendingFor(null);
  };
  const reject = async (id) => {
    const { error: err } = await supabase.rpc('reject_crew_application', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
  };
  const resendEmail = async (id) => {
    setSendingFor(id);
    const res = await notificationService.sendApprovalEmail('crew_applications', id, { force: true });
    if (!res.success) alert(res.error || 'Could not send email.');
    await loadNotifications();
    setSendingFor(null);
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">CREW &amp; VOLUNTEER APPLICATIONS</h3>
      <div className="flex gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${categoryFilter === c ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>
            {c}
          </button>
        ))}
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, status..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : filtered.length === 0 ? (
        <EmptyState>NO APPLICATIONS YET.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                <th className="py-2">APPLICANT</th>
                <th className="py-2">CATEGORY</th>
                <th className="py-2">ROLE INTEREST</th>
                <th className="py-2">EVENT</th>
                <th className="py-2">STATUS</th>
                <th className="py-2">EMAIL</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const notif = notifByAppId[v.id];
                return (
                <tr key={v.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3">{v.name}<br /><span className="opacity-60">{v.email}</span></td>
                  <td className="py-3 uppercase font-bold text-[10px] text-[#C99A2E]">{v.category}</td>
                  <td className="py-3 font-bold">{v.role_interest}</td>
                  <td className="py-3">{v.event_interest || '—'}</td>
                  <td className="py-3"><StatusBadge status={v.status} /></td>
                  <td className="py-3"><EmailStatusBadge notification={notif} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {v.status !== 'approved' && <ActionButton tone="success" onClick={() => approve(v.id)} disabled={sendingFor === v.id}>APPROVE</ActionButton>}
                    {v.status !== 'rejected' && <ActionButton tone="danger" onClick={() => reject(v.id)}>REJECT</ActionButton>}
                    {v.status === 'approved' && notif?.status === 'failed' && (
                      <ActionButton onClick={() => resendEmail(v.id)} disabled={sendingFor === v.id}>{sendingFor === v.id ? 'SENDING...' : 'RESEND EMAIL'}</ActionButton>
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
