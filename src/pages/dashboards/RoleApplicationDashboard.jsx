import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useUserAuth } from '../../context/UserAuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { AgentRequestForm } from '../../components/ai/AgentRequestForm';

// Shared real dashboard shell for every "apply, then get reviewed" account
// type (crew/volunteer/vendor/sponsor/venue/private client). Each of these
// only ever reads/writes ITS OWN rows — `applicationTable ... .eq(userIdColumn,
// user.id)` — authorized entirely by the self-read RLS policies added in
// 0006_role_profiles.sql, never by profiles.role (selecting an account type
// at signup never grants a role; see prevent_role_self_escalation).
//
// This intentionally does NOT try to give every role a bespoke feature set
// (tasks/schedules/assignments) — those need real tables that don't exist
// yet (tracked for the dedicated dashboards phase). What it DOES do: show
// the real application status, the real approved profile record once one
// exists, and a real path to the Tangy team. No fabricated numbers.
const STATUS_COLORS = {
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  reviewing: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  archived: 'bg-[#E7D5A4]/10 text-[#E7D5A4]/70 border-[#E7D5A4]/30',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status || 'n/a'}
  </span>
);

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
    {children}
  </div>
);

/**
 * @param {object} config
 * @param {string} config.icon
 * @param {string} config.label
 * @param {string} config.tagline
 * @param {string} config.applicationTable - collaborations | crew_applications | private_enquiries
 * @param {string} [config.typeFilter] - value to match on collaborations.type
 * @param {string} [config.profileTable] - vendor_profiles | sponsor_profiles | volunteer_profiles | crew_profiles
 * @param {{key:string,label:string}[]} [config.profileFields]
 * @param {string} config.applyRoute
 */
export const RoleApplicationDashboard = ({ config }) => {
  const navigate = useNavigate();
  const { user, logout } = useUserAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [agentSent, setAgentSent] = useState(null);

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from(config.applicationTable).select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (config.typeFilter) q = q.eq('type', config.typeFilter);
    const { data: apps } = await q;
    setApplications(apps || []);

    if (config.profileTable) {
      const { data: prof } = await supabase.from(config.profileTable).select('*').eq('id', user.id).maybeSingle();
      setProfile(prof || null);
    }
    setLoading(false);
  }, [user, config.applicationTable, config.typeFilter, config.profileTable]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const latestApplication = applications[0];
  const isApproved = latestApplication?.status === 'approved';

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">
        LOADING...
      </div>
    );
  }

  const TABS = [
    { id: 'applications', label: '📋 APPLICATIONS' },
    ...(config.profileTable ? [{ id: 'profile', label: `${config.icon} PROFILE` }] : []),
    { id: 'help', label: '✦ MESSAGES' },
    { id: 'settings', label: '⚙ SETTINGS' },
  ];

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 bg-[#E7D5A4] text-[#11100C] rounded-full border-2 border-[#B94717] flex items-center justify-center text-2xl">
              {config.icon}
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">
                {config.label.toUpperCase()} ACCOUNT
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.full_name || user.email}</h1>
              <span className="font-mono text-[10px] text-[#E7D5A4]/60">{user.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {latestApplication && <Badge status={latestApplication.status} />}
            <button onClick={handleLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              LOG OUT ✕
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto">
        <nav className="flex flex-wrap gap-2 border-b-2 border-[#C99A2E]/40 pb-3 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase border transition-colors ${
                activeTab === tab.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]' : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        {activeTab === 'applications' && (
          <div className="flex flex-col gap-4">
            {applications.length === 0 ? (
              <Empty>
                NO {config.label.toUpperCase()} APPLICATION ON FILE YET.{' '}
                <Link to={config.applyRoute} className="text-[#C99A2E] underline">APPLY NOW →</Link>
              </Empty>
            ) : (
              applications.map((a) => (
                <div key={a.id} className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold uppercase">{a.business_name || a.name || a.role_interest || config.label}</h3>
                      <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-1">Submitted {fmtDate(a.created_at)}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                  {(a.details || a.message) && (
                    <p className="font-mono text-[11px] text-[#E7D5A4]/80 leading-relaxed border-t border-[#C99A2E]/20 pt-3 whitespace-pre-wrap">
                      {a.details || a.message}
                    </p>
                  )}
                </div>
              ))
            )}
            <div className="mt-2">
              <Link to={config.applyRoute} className="inline-block px-4 py-2 border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 font-bold uppercase text-[10px] tracking-widest">
                SUBMIT ANOTHER APPLICATION →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'profile' && config.profileTable && (
          <div>
            {!isApproved ? (
              <Empty>
                YOUR {config.label.toUpperCase()} PROFILE UNLOCKS ONCE YOUR APPLICATION IS APPROVED BY THE TANGY TEAM.
              </Empty>
            ) : !profile ? (
              <Empty>APPROVED — YOUR EXTENDED PROFILE RECORD IS BEING SET UP BY THE TANGY TEAM.</Empty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                {(config.profileFields || []).map((f) => (
                  <div key={f.key} className="bg-[#191410] border border-[#C99A2E]/40 p-4">
                    <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">{f.label}</span>
                    <div className="font-mono text-xs mt-1">{profile[f.key] || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'help' && (
          <div className="max-w-lg flex flex-col gap-4">
            <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
              <h3 className="font-display text-lg font-bold uppercase mb-2">Message the Tangy team</h3>
              <p className="font-mono text-[11px] text-[#E7D5A4]/70">Questions about your application or upcoming sessions — reach the team directly.</p>
            </div>
            {agentSent ? (
              <div className="p-4 bg-[#10b981]/20 border-2 border-[#10b981]/40 text-xs font-bold">✓ MESSAGE SENT — THE TANGY TEAM WILL REACH OUT.</div>
            ) : (
              <AgentRequestForm onCancel={() => {}} onSubmitted={() => setAgentSent(true)} />
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
            <h3 className="font-display text-lg font-bold uppercase mb-4">Account</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase mb-1 opacity-70">Email</span>
                <div className="p-3 bg-[#F5E9C9] border-2 border-[#11100C]">{user.email}</div>
              </div>
              <Link to="/profile" className="text-center py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C]">
                EDIT FULL PROFILE →
              </Link>
              <button onClick={handleLogout} className="py-2.5 bg-transparent text-[#11100C] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">
                LOG OUT
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};
