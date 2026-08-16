import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
import { agentService } from '../../services/agentService';

const STATUS_COLORS = {
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status || 'open'}
  </span>
);

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">{children}</div>
);

const SPONSOR_TIERS = ['Title Sponsor', 'Stage Sponsor', 'Hospitality Partner', 'Archive Patron'];

const TABS = [
  { id: 'profile', label: '✦ PROFILE' },
  { id: 'opportunities', label: '🤝 PARTNERSHIPS' },
  { id: 'collab', label: '🎗️ ACTIVE COLLABORATIONS' },
  { id: 'requests', label: '📮 REQUESTS' },
  { id: 'campaign', label: '📊 CAMPAIGN INFO' },
  { id: 'help', label: '✦ HELP' },
];

export const SponsorDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [agentForm, setAgentForm] = useState({ category: 'Sponsorship', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const sponsorRecord = userService.getProfileTable('sponsor').find((s) => s.organizationName.toLowerCase() === user.fullName.toLowerCase());

  const upcomingSessions = eventService.getUpcoming();
  const opportunities = upcomingSessions.map((ev, i) => ({ event: ev, tier: SPONSOR_TIERS[i % SPONSOR_TIERS.length] }));
  const activeCollaborations = (sponsorRecord?.activeCollaborations || []).map(eventById).filter(Boolean);
  const requests = sponsorRecord?.requests || [];
  const tier = sponsorRecord?.tier || 'Prospective Partner';

  const handleLogout = () => { signOut(); navigate('/'); };
  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: sponsorRecord?.organizationName || user.fullName, role: 'sponsor', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Sponsorship', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">CULTURAL PARTNERSHIP DESK</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{sponsorRecord?.organizationName || user.fullName}</h1>
            <span className="inline-block mt-2 px-3 py-1 bg-[#C99A2E] text-[#11100C] font-mono text-[10px] font-bold uppercase tracking-widest">{tier}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">✦ ASK TANGY AI</Link>
            <button onClick={handleLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">LOG OUT ✕</button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto">
        <nav className="flex flex-wrap gap-2 border-b-2 border-[#C99A2E]/40 pb-3 mb-6">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase border transition-colors ${
                activeTab === tab.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]' : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING PARTNERSHIP DESK...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Partnership Tier</span>
                  <div className="font-display text-xl font-bold mt-1">{tier}</div>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Active Collaborations</span>
                  <div className="font-display text-4xl font-bold mt-1">{activeCollaborations.length}</div>
                </div>
                <div className="sm:col-span-2 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <p className="font-mono text-xs text-[#E7D5A4]/80 leading-relaxed">
                    {sponsorRecord
                      ? `${sponsorRecord.organizationName} has partnered with Tangy Sessions since ${fmtDate(sponsorRecord.createdAt?.slice(0, 10))}, supporting heritage preservation and independent artist grants.`
                      : 'Your organization hasn’t been matched to an archive record yet. Explore partnership tracks below to start a conversation with the curation desk.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Partnership Opportunities</h3>
                {opportunities.length === 0 ? (
                  <Empty>NO OPEN PARTNERSHIP SLOTS RIGHT NOW.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opportunities.map((o, i) => (
                      <div key={i} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                        <h4 className="font-display font-bold uppercase">{o.tier}</h4>
                        <p className="font-mono text-[10px] mt-1">{o.event.name} · {fmtDate(o.event.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collab' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Active Collaborations</h3>
                {activeCollaborations.length === 0 ? (
                  <Empty>NO ACTIVE COLLABORATIONS RIGHT NOW.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCollaborations.map((ev) => (
                      <div key={ev.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                        <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                        <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{fmtDate(ev.date)} · {ev.venue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="max-w-lg flex flex-col gap-4">
                <h3 className="font-display text-lg font-bold uppercase mb-1">Requests</h3>
                {requests.length === 0 ? (
                  <Empty>NO OPEN REQUESTS. FILE ONE BELOW IF YOU NEED SOMETHING FROM THE TANGY TEAM.</Empty>
                ) : (
                  <div className="flex flex-col gap-2">
                    {requests.map((r, i) => (
                      <div key={i} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3 flex justify-between items-center gap-3">
                        <span className="font-mono text-xs">{r.note || JSON.stringify(r)}</span>
                        <Badge status={r.status || 'pending'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'campaign' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Campaign / Event Info</h3>
                {activeCollaborations.length === 0 ? (
                  <Empty>NO LIVE CAMPAIGN DATA — SPONSOR AN UPCOMING SESSION TO SEE REACH FIGURES HERE.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCollaborations.map((ev) => (
                      <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-4">
                        <h4 className="font-display font-bold uppercase mb-2">{ev.name}</h4>
                        <div className="flex justify-between font-mono text-[10px] font-bold"><span>CAPACITY</span><span>{ev.capacity}</span></div>
                        <div className="flex justify-between font-mono text-[10px] font-bold"><span>TICKETS SOLD</span><span>{ev.sold}</span></div>
                        <div className="flex justify-between font-mono text-[10px] font-bold"><span>% FILLED</span><span>{Math.round((ev.sold / ev.capacity) * 100)}%</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'help' && (
              <div className="max-w-lg flex flex-col gap-4">
                <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <h3 className="font-display text-lg font-bold uppercase mb-2">Need help?</h3>
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about partnership tiers, benefits, or renewal timelines.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Sponsorship</option>
                        <option>Renewal</option>
                        <option>General</option>
                      </select>
                      <textarea required value={agentForm.question} onChange={(e) => setAgentForm({ ...agentForm, question: e.target.value })} placeholder="What do you need help with?" className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none h-20" />
                      <button type="submit" className="py-2 bg-[#11100C] text-[#E7D5A4] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">SEND TO TEAM →</button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};
