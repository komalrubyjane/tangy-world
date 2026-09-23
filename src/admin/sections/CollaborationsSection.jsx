import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { notificationService } from '../../services/notificationService';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, Drawer, EmailStatusBadge } from '../AdminUI';

const TYPES = ['all', 'vendor', 'sponsor', 'venue_host'];

// Only meaningful for an approved sponsor collaboration linked to an
// account (user_id) — that's the sponsor_profiles.id the deliverable rows
// hang off (sponsor_deliverables.sponsor_profile_id -> sponsor_profiles.id).
function DeliverablesDrawer({ collab, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sponsor_deliverables')
      .select('*')
      .eq('sponsor_profile_id', collab.user_id)
      .order('created_at', { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addDeliverable = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from('sponsor_deliverables').insert({
      sponsor_profile_id: collab.user_id,
      title: form.title.trim(),
      due_date: form.due_date || null,
    });
    setSaving(false);
    setForm({ title: '', due_date: '' });
    load();
  };

  const markDelivered = async (id) => {
    await supabase.from('sponsor_deliverables').update({ status: 'delivered' }).eq('id', id);
    load();
  };

  return (
    <Drawer onClose={onClose}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-[#C99A2E]">DELIVERABLES — {collab.business_name}</h3>
        <button onClick={onClose} className="text-xl leading-none opacity-70 hover:opacity-100">✕</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Deliverable (e.g. Logo at Solstice session)" className="flex-1 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
      </div>
      <button onClick={addDeliverable} disabled={saving || !form.title.trim()} className="py-2.5 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase disabled:opacity-50">
        {saving ? 'ADDING...' : 'ADD DELIVERABLE'}
      </button>

      {loading ? (
        <div className="p-4 text-center text-xs opacity-50">LOADING...</div>
      ) : rows.length === 0 ? (
        <EmptyState>NO DELIVERABLES ON FILE YET.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((d) => (
            <div key={d.id} className="bg-[#11100C] border border-[#C99A2E]/20 p-3 flex items-center justify-between gap-2 text-xs">
              <div>
                <div>{d.title}</div>
                {d.due_date && <div className="text-[10px] opacity-50 mt-0.5">Due {d.due_date}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={d.status === 'delivered' ? 'confirmed' : 'pending'} />
                {d.status !== 'delivered' && (
                  <button onClick={() => markDelivered(d.id)} className="text-[9px] font-bold uppercase text-[#10b981] underline">Mark delivered</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

export const CollaborationsSection = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [deliverablesFor, setDeliverablesFor] = useState(null);
  const [notifByAppId, setNotifByAppId] = useState({});
  const [sendingFor, setSendingFor] = useState(null);
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('collaborations', {
    searchFields: ['business_name', 'contact_name', 'email', 'status', 'type'],
  });

  const loadNotifications = useCallback(async () => {
    setNotifByAppId(await notificationService.getForSourceTable('collaborations'));
  }, []);
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filtered = typeFilter === 'all' ? rows : rows.filter((r) => r.type === typeFilter);

  // Approval provisions the role + vendor_profiles/sponsor_profiles/
  // venue_profiles row atomically, server-side — see approve_collaboration
  // in 0011_role_portals.sql (now also queues an application_notifications
  // row). The client never writes profiles.role directly. The approval
  // email is a SEPARATE step, triggered right after — a failed send never
  // undoes the approval (see send-approval-email Edge Function).
  const approve = async (id) => {
    const { error: err } = await supabase.rpc('approve_collaboration', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
    setSendingFor(id);
    await notificationService.sendApprovalEmail('collaborations', id);
    await loadNotifications();
    setSendingFor(null);
  };
  const reject = async (id) => {
    const { error: err } = await supabase.rpc('reject_collaboration', { p_id: id });
    if (err) { alert(err.message); return; }
    reload();
  };
  const resendEmail = async (id) => {
    setSendingFor(id);
    const res = await notificationService.sendApprovalEmail('collaborations', id, { force: true });
    if (!res.success) alert(res.error || 'Could not send email.');
    await loadNotifications();
    setSendingFor(null);
  };

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
                <th className="py-2">EMAIL</th>
                <th className="py-2">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const notif = notifByAppId[c.id];
                return (
                <tr key={c.id} className="border-b border-[#E7D5A4]/10">
                  <td className="py-3 uppercase font-bold text-[10px] text-[#C99A2E]">{c.type.replace('_', ' ')}</td>
                  <td className="py-3 font-bold">{c.business_name}</td>
                  <td className="py-3">{c.contact_name}<br /><span className="opacity-60">{c.email}</span></td>
                  <td className="py-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3"><EmailStatusBadge notification={notif} /></td>
                  <td className="py-3 flex gap-1.5 flex-wrap">
                    {c.status !== 'approved' && <ActionButton tone="success" onClick={() => approve(c.id)} disabled={sendingFor === c.id}>APPROVE</ActionButton>}
                    {c.status !== 'rejected' && <ActionButton tone="danger" onClick={() => reject(c.id)}>REJECT</ActionButton>}
                    {c.status === 'approved' && notif?.status === 'failed' && (
                      <ActionButton onClick={() => resendEmail(c.id)} disabled={sendingFor === c.id}>{sendingFor === c.id ? 'SENDING...' : 'RESEND EMAIL'}</ActionButton>
                    )}
                    {c.type === 'sponsor' && c.status === 'approved' && c.user_id && (
                      <ActionButton onClick={() => setDeliverablesFor(c)}>DELIVERABLES</ActionButton>
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
      {deliverablesFor && (
        <DeliverablesDrawer collab={deliverablesFor} onClose={() => setDeliverablesFor(null)} />
      )}
    </div>
  );
};
