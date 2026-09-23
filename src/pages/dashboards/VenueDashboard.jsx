import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { AgentRequestForm } from '../../components/ai/AgentRequestForm';
import { PortalShell, Badge, Empty, fmtDate, StatTile, ReadOnlyNote } from './portal/PortalUI';

const TABS = [
  { id: 'overview', label: '📊 OVERVIEW' },
  { id: 'events', label: '🏛️ HOSTED EVENTS' },
  { id: 'applications', label: '📋 APPLICATIONS' },
  { id: 'profile', label: '🏛️ PROFILE' },
  { id: 'help', label: '✦ MESSAGES' },
];

const TODAY = new Date().toISOString().slice(0, 10);

// `overrideProfile` + `readOnly` are set only by the admin preview route
// (src/pages/admin/AdminPortalPreview.jsx) — see the identical note in
// CrewDashboard.jsx for the security reasoning (RLS-backed, no impersonation).
// `demoData` ({ applications, profile, hostedEvents }) is set only by the
// demo-admin build (src/pages/demoAdmin/DemoRoleDashboard.jsx) — when
// present, this skips every real Supabase call below. See demoAdminData.js.
export const VenueDashboard = ({ overrideProfile, readOnly, demoData } = {}) => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useUserAuth();
  const user = overrideProfile || authUser;
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ property_name: '', location: '', capacity: '', description: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [hostedEvents, setHostedEvents] = useState([]);
  const [agentSent, setAgentSent] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (demoData) {
      setApplications(demoData.applications || []);
      setProfile(demoData.profile || null);
      if (demoData.profile) setProfileForm({ property_name: demoData.profile.property_name || '', location: demoData.profile.location || '', capacity: demoData.profile.capacity ?? '', description: demoData.profile.description || '' });
      setHostedEvents(demoData.hostedEvents || []);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) { setLoading(false); return; }

    const [{ data: apps }, { data: prof }, { data: events }] = await Promise.all([
      supabase.from('collaborations').select('*').eq('user_id', user.id).eq('type', 'venue_host').order('created_at', { ascending: false }),
      supabase.from('venue_profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('events').select('*').eq('venue_partner_id', user.id).order('event_date', { ascending: true }),
    ]);

    setApplications(apps || []);
    setProfile(prof || null);
    if (prof) setProfileForm({ property_name: prof.property_name || '', location: prof.location || '', capacity: prof.capacity ?? '', description: prof.description || '' });
    setHostedEvents(events || []);
    setLoading(false);
  }, [user, demoData]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    const { error } = await supabase.from('venue_profiles').update({ ...profileForm, capacity: profileForm.capacity ? parseInt(profileForm.capacity, 10) : null }).eq('id', user.id);
    setProfileMsg(error ? 'Could not save.' : '✓ SAVED');
  };

  const upcoming = hostedEvents.filter((e) => e.event_date >= TODAY);
  const past = hostedEvents.filter((e) => e.event_date < TODAY);
  const isApproved = applications.some((a) => a.status === 'approved');

  if (loading || !user) {
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">LOADING VENUE DASHBOARD...</div>;
  }

  return (
    <PortalShell
      icon="🏛️"
      roleLabel="VENUE / HOST ACCOUNT"
      title={profile?.property_name || user.full_name || user.email}
      subtitle={user.email}
      statusBadge={isApproved ? <Badge status="approved" /> : applications[0] ? <Badge status={applications[0].status} /> : null}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      preview={readOnly ? { label: `Viewing Venue Portal — ${profile?.property_name || user.full_name || user.email}` } : undefined}
    >
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {!isApproved && (
            <div className="sm:col-span-3"><Empty>YOUR VENUE APPLICATION ISN'T APPROVED YET — CHECK THE APPLICATIONS TAB.</Empty></div>
          )}
          <StatTile label="Upcoming Hosted Events" value={upcoming.length} sub="linked to your venue" />
          <StatTile label="Past Hosted Events" value={past.length} sub="on record" />
          <StatTile label="Applications" value={applications.length} sub="submitted so far" />
        </div>
      )}

      {activeTab === 'events' && (
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="font-condensed text-lg font-bold uppercase mb-3">Upcoming</h3>
            {upcoming.length === 0 ? <Empty>NO UPCOMING EVENTS LINKED TO YOUR VENUE YET.</Empty> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcoming.map((e) => (
                  <div key={e.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                    <h4 className="font-condensed font-bold uppercase">{e.name}</h4>
                    <p className="font-mono text-[10px] mt-1">{fmtDate(e.event_date)} · {e.event_time}</p>
                    <Badge status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-condensed text-lg font-bold uppercase mb-3">Past</h3>
            {past.length === 0 ? <Empty>NO PAST EVENTS ON RECORD.</Empty> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {past.map((e) => (
                  <div key={e.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                    <h4 className="font-condensed font-bold uppercase">{e.name}</h4>
                    <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1">{fmtDate(e.event_date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="flex flex-col gap-4">
          {applications.length === 0 ? (
            <Empty>NO VENUE APPLICATION ON FILE YET. <Link to="/apply/venue-host" className="text-[#C99A2E] underline">APPLY NOW →</Link></Empty>
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
          <Empty>YOUR VENUE PROFILE UNLOCKS ONCE YOUR APPLICATION IS APPROVED.</Empty>
        ) : (
          <form onSubmit={saveProfile} className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C] flex flex-col gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Property name</label>
              <input disabled={readOnly} value={profileForm.property_name} onChange={(e) => { setProfileForm({ ...profileForm, property_name: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Location</label>
              <input disabled={readOnly} value={profileForm.location} onChange={(e) => { setProfileForm({ ...profileForm, location: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Capacity</label>
              <input disabled={readOnly} type="number" min="0" value={profileForm.capacity} onChange={(e) => { setProfileForm({ ...profileForm, capacity: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Description</label>
              <textarea disabled={readOnly} rows={3} value={profileForm.description} onChange={(e) => { setProfileForm({ ...profileForm, description: e.target.value }); setProfileMsg(''); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none resize-none disabled:opacity-60" />
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
