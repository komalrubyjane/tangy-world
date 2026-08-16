import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
import { announcementService } from '../../services/announcementService';
import { agentService } from '../../services/agentService';

const STATUS_COLORS = {
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
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

const TABS = [
  { id: 'profile', label: '🍵 PROFILE' },
  { id: 'opportunities', label: '🪧 OPPORTUNITIES' },
  { id: 'applications', label: '📋 APPLICATIONS' },
  { id: 'collab', label: '🤝 COLLABORATIONS' },
  { id: 'sessions', label: '🏛️ SESSIONS' },
  { id: 'notices', label: '📣 NOTICES' },
  { id: 'help', label: '✦ HELP' },
];

export const VendorDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [agentForm, setAgentForm] = useState({ category: 'Vendor Opportunity', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const vendorRecord = userService.getProfileTable('vendor').find((v) => v.email?.toLowerCase() === user.email?.toLowerCase());
  const upcomingSessions = eventService.getUpcoming();

  const opportunities = upcomingSessions.flatMap((ev) => {
    const suffix = ev.id.replace('evt-', '');
    return [
      { id: `opp-food-${suffix}`, category: 'Food & Chai Stall', event: ev, slots: 3 },
      { id: `opp-craft-${suffix}`, category: 'Craft & Print Stall', event: ev, slots: 2 },
    ];
  });

  const appliedIds = vendorRecord?.opportunitiesApplied || [];
  const applications = appliedIds.map((id) => opportunities.find((o) => o.id === id) || { id, category: 'Collaboration Slot', event: null });

  const collaborations = (vendorRecord?.activeCollaborations || []).map(eventById).filter(Boolean);
  const currentWork = collaborations.filter((ev) => ev.status !== 'past');
  const pastWork = collaborations.filter((ev) => ev.status === 'past');

  const announcements = announcementService.getPublished();

  const handleLogout = () => { signOut(); navigate('/'); };
  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: vendorRecord?.businessName || user.fullName, role: 'vendor', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Vendor Opportunity', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#B94717] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest block">VENDOR STALL // {vendorRecord?.category || 'CATEGORY PENDING'}</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{vendorRecord?.businessName || user.fullName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-[9px] uppercase text-[#E7D5A4]/60">Status:</span>
              <Badge status={vendorRecord?.status || user.applicationStatus || 'pending'} />
            </div>
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
                activeTab === tab.id ? 'bg-[#B94717] text-[#E7D5A4] border-[#B94717] shadow-[3px_3px_0px_#11100C]' : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING VENDOR DESK...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Category</span>
                  <div className="font-display text-xl font-bold mt-1">{vendorRecord?.category || 'Not yet on file'}</div>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Contact Email</span>
                  <div className="font-display text-base font-bold mt-1 break-all">{vendorRecord?.email || user.email}</div>
                </div>
                <div className="sm:col-span-2 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">On the record</span>
                  <p className="font-mono text-xs text-[#E7D5A4]/80 mt-2 leading-relaxed">
                    {vendorRecord
                      ? `Registered with Tangy Sessions since ${fmtDate(vendorRecord.createdAt?.slice(0, 10))}. Currently ${currentWork.length} active collaboration${currentWork.length === 1 ? '' : 's'}.`
                      : 'Your vendor profile hasn’t been matched to an archive record yet. This is normal for a fresh mock account — apply to an opportunity below to get started.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Open Stall Opportunities</h3>
                {opportunities.length === 0 ? (
                  <Empty>NO OPEN OPPORTUNITIES RIGHT NOW — CHECK BACK WHEN THE NEXT SESSION IS ANNOUNCED.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opportunities.map((o) => (
                      <div key={o.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-display font-bold uppercase">{o.category}</h4>
                          {appliedIds.includes(o.id) && <Badge status="pending" />}
                        </div>
                        <p className="font-mono text-[10px] mt-1">{o.event.name} · {fmtDate(o.event.date)}</p>
                        <p className="font-mono text-[9px] mt-2 text-[#B94717] font-bold">{o.slots} STALL{o.slots === 1 ? '' : 'S'} AVAILABLE</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Your Applications</h3>
                {applications.length === 0 ? (
                  <Empty>YOU HAVEN'T APPLIED TO ANY OPPORTUNITIES YET.</Empty>
                ) : (
                  <div className="flex flex-col gap-3">
                    {applications.map((a) => (
                      <div key={a.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-4 flex justify-between items-center gap-3">
                        <div>
                          <h4 className="font-display font-bold uppercase">{a.category}</h4>
                          <p className="font-mono text-[10px] text-[#E7D5A4]/60 mt-1">{a.event ? `${a.event.name} · ${fmtDate(a.event.date)}` : a.id}</p>
                        </div>
                        <Badge status="pending" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collab' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Current Work</h3>
                  {currentWork.length === 0 ? (
                    <Empty>NO ACTIVE COLLABORATIONS RIGHT NOW.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentWork.map((ev) => (
                        <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                          <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                          <p className="font-mono text-[10px] mt-1">{fmtDate(ev.date)} · {ev.venue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Past Collaborations</h3>
                  {pastWork.length === 0 ? (
                    <Empty>NO PAST COLLABORATIONS ON RECORD.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pastWork.map((ev) => (
                        <div key={ev.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                          <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                          <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{fmtDate(ev.date)} · {ev.venue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Upcoming Sessions</h3>
                {upcomingSessions.length === 0 ? (
                  <Empty>NO SESSIONS ANNOUNCED RIGHT NOW.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upcomingSessions.map((ev) => (
                      <div key={ev.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                        <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                        <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{fmtDate(ev.date)} · {ev.venue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-lg font-bold uppercase mb-1">Announcements</h3>
                {announcements.length === 0 ? (
                  <Empty>NO ANNOUNCEMENTS PUBLISHED RIGHT NOW.</Empty>
                ) : announcements.map((a) => (
                  <div key={a.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-4">
                    <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase">{a.category}</span>
                    <h4 className="font-display font-bold uppercase">{a.title}</h4>
                    <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1">{a.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'help' && (
              <div className="max-w-lg flex flex-col gap-4">
                <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <h3 className="font-display text-lg font-bold uppercase mb-2">Need help?</h3>
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about stall setups, deadlines, or logistics for your next session.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Vendor Opportunity</option>
                        <option>Stall Logistics</option>
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
