import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { AgentRequestForm } from '../../components/ai/AgentRequestForm';
import { PortalShell, Badge, Empty, fmtDate, StatTile, ReadOnlyNote } from './portal/PortalUI';

const TABS = [
  { id: 'overview', label: '📊 OVERVIEW' },
  { id: 'deliverables', label: '🎗️ DELIVERABLES' },
  { id: 'applications', label: '📋 APPLICATIONS' },
  { id: 'profile', label: '✦ PROFILE' },
  { id: 'help', label: '✦ MESSAGES' },
];

// `overrideProfile` + `readOnly` are set only by the admin preview route
// (src/pages/admin/AdminPortalPreview.jsx) — see the identical note in
// CrewDashboard.jsx for the security reasoning (RLS-backed, no impersonation).
// `demoData` ({ applications, profile, deliverables }) is set only by the
// demo-admin build (src/pages/demoAdmin/DemoRoleDashboard.jsx) — when
// present, this skips every real Supabase call below. See demoAdminData.js.
export const SponsorDashboard = ({ overrideProfile, readOnly, demoData } = {}) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useUserAuth();
  const user = overrideProfile || authUser;
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ organization_name: '', sponsorship_tier: '', website: '', contact_designation: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [deliverables, setDeliverables] = useState([]);
  const [agentSent, setAgentSent] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (demoData) {
      setApplications(demoData.applications || []);
      setProfile(demoData.profile || null);
      if (demoData.profile) setProfileForm({ organization_name: demoData.profile.organization_name || '', sponsorship_tier: demoData.profile.sponsorship_tier || '', website: demoData.profile.website || '', contact_designation: demoData.profile.contact_designation || '' });
      setDeliverables(demoData.deliverables || []);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const [{ data: apps }, { data: prof }, { data: delivs }] = await Promise.all([
      supabase.from('collaborations').select('*').eq('user_id', user.id).eq('type', 'sponsor').order('created_at', { ascending: false }),
      supabase.from('sponsor_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('sponsor_deliverables').select('*, events(name, event_date)').eq('sponsor_profile_id', user.id).order('created_at', { ascending: false }),
    ]);

    setApplications(apps || []);
    setProfile(prof || null);
    if (prof) setProfileForm({ organization_name: prof.organization_name || '', sponsorship_tier: prof.sponsorship_tier || '', website: prof.website || '', contact_designation: prof.contact_designation || '' });
    setDeliverables(delivs || []);
    setLoading(false);
  }, [user, demoData]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    const { error } = await supabase.from('sponsor_profiles').update(profileForm).eq('id', user.id);
    setProfileMsg(error ? 'Could not save.' : '✓ SAVED');
  };

  const pendingDeliverables = deliverables.filter((d) => d.status !== 'delivered');
  const isApproved = applications.some((a) => a.status === 'approved');

  if (loading || !user) {
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">LOADING SPONSOR DASHBOARD...</div>;
  }

  return (
    <PortalShell
      icon="✦"
      roleLabel="SPONSOR ACCOUNT"
      title={profile?.organization_name || user.full_name || user.email}
      subtitle={user.email}
      statusBadge={isApproved ? <Badge status="approved" /> : applications[0] ? <Badge status={applications[0].status} /> : null}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      preview={readOnly ? { label: `Viewing Sponsor Portal — ${profile?.organization_name || user.full_name || user.email}` } : undefined}
    >
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!isApproved && (
            <div className="sm:col-span-3"><Empty>YOUR SPONSORSHIP APPLICATION ISN'T APPROVED YET — CHECK THE APPLICATIONS TAB.</Empty></div>
          )}
          <StatTile label="Deliverables Pending" value={pendingDeliverables.length} sub="awaiting delivery" />
          <StatTile label="Deliverables Total" value={deliverables.length} sub="on file" />
          <StatTile label="Applications" value={applications.length} sub="submitted so far" />
        </div>
      )}

      {activeTab === 'deliverables' && (
        deliverables.length === 0 ? <Empty>NO DELIVERABLES ON FILE YET.</Empty> : (
          <div className="flex flex-col gap-3">
            {deliverables.map((d) => (
              <div key={d.id} className="bg-[#191410] border-2 border-[#C99A2E]/40 p-4 flex justify-between items-start gap-3">
                <div>
                  <h4 className="font-condensed font-bold uppercase">{d.title}</h4>
                  {d.events?.name && <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1">{d.events.name} · {fmtDate(d.events.event_date)}</p>}
                  {d.due_date && <p className="font-mono text-[10px] text-[#E7D5A4]/50 mt-1">Due {fmtDate(d.due_date)}</p>}
                  {d.description && <p className="font-mono text-[11px] text-[#E7D5A4]/80 mt-2">{d.description}</p>}
                </div>
                <Badge status={d.status === 'delivered' ? 'delivered' : 'pending'} />
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'applications' && (
        <div className="flex flex-col gap-4">
          {applications.length === 0 ? (
            <Empty>NO SPONSORSHIP APPLICATION ON FILE YET. <Link to="/apply/sponsors" className="text-[#C99A2E] underline">APPLY NOW →</Link></Empty>
          ) : applications.map((a) => (
            <div key={a.id} className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <h3 className="font-condensed text-lg font-bold uppercase">{a.business_name}</h3>
                  <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-1">Submitted {fmtDate(a.created_at)}</p>
                </div>
                <Badge status={a.status} />
              </div>
              {a.details && <p className="font-mono text-[11px] text-[#E7D5A4]/80 whitespace-pre-wrap border-t border-[#C99A2E]/20 pt-3">{a.details}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'profile' && (
        !isApproved ? (
          <Empty>YOUR SPONSOR PROFILE UNLOCKS ONCE YOUR APPLICATION IS APPROVED.</Empty>
        ) : (
          <form onSubmit={saveProfile} className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C] flex flex-col gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Organization</label>
              <input disabled={readOnly} value={profileForm.organization_name} onChange={(e) => { setProfileForm({ ...profileForm, organization_name: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Sponsorship tier</label>
              <input disabled={readOnly} value={profileForm.sponsorship_tier} onChange={(e) => { setProfileForm({ ...profileForm, sponsorship_tier: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Website</label>
              <input disabled={readOnly} value={profileForm.website} onChange={(e) => { setProfileForm({ ...profileForm, website: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Contact designation</label>
              <input disabled={readOnly} value={profileForm.contact_designation} onChange={(e) => { setProfileForm({ ...profileForm, contact_designation: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            {profileMsg && <div className="p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#0f5132] text-[10px] font-bold">{profileMsg}</div>}
            {!readOnly && <button type="submit" className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C]">SAVE</button>}
          </form>
        )
      )}

      {activeTab === 'help' && (
        <div className="max-w-lg flex flex-col gap-4">
          {readOnly ? (
            <ReadOnlyNote>Messaging is disabled in admin preview.</ReadOnlyNote>
          ) : agentSent ? (
            <div className="p-4 bg-[#10b981]/20 border-2 border-[#10b981]/40 text-xs font-bold">✓ MESSAGE SENT — THE TANGY TEAM WILL REACH OUT.</div>
          ) : (
            <AgentRequestForm onCancel={() => {}} onSubmitted={() => setAgentSent(true)} />
          )}
        </div>
      )}
    </PortalShell>
  );
};
