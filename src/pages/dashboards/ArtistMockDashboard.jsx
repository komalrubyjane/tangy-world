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
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status || 'unlisted'}
  </span>
);

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
    {children}
  </div>
);

const TABS = [
  { id: 'profile', label: '🎤 PROFILE' },
  { id: 'portfolio', label: '🎧 PORTFOLIO' },
  { id: 'performances', label: '🎼 PERFORMANCES' },
  { id: 'availability', label: '📅 AVAILABILITY' },
  { id: 'sessions', label: '🏛️ SESSIONS' },
  { id: 'agent', label: '🗂️ AGENT REQUESTS' },
  { id: 'notices', label: '📣 NOTICES' },
  { id: 'settings', label: '⚙ SETTINGS' },
  { id: 'help', label: '✦ HELP' },
];

export const ArtistMockDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
  const [savedMsg, setSavedMsg] = useState(false);
  const [agentForm, setAgentForm] = useState({ category: 'Artist Application', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const artistRecord = userService.getProfileTable('artist').find((a) => a.name.toLowerCase() === user.fullName.toLowerCase());

  const [available, setAvailable] = useState(!artistRecord || artistRecord.availability !== 'Under review');

  const upcoming = (artistRecord?.upcomingPerformances || []).map(eventById).filter(Boolean);
  const past = (artistRecord?.pastPerformances || []).map(eventById).filter(Boolean);
  const portfolio = artistRecord?.portfolio || [];
  const applicationStatus = user.applicationStatus || artistRecord?.status || 'pending';
  const upcomingSessions = eventService.getUpcoming();
  const announcements = announcementService.getPublished();
  const myAgentRequests = agentService.getAll().filter((r) => r.user.toLowerCase() === user.fullName.toLowerCase());

  const handleLogout = () => { signOut(); navigate('/'); };
  const handleSettingsSave = (e) => { e.preventDefault(); setSavedMsg(true); };
  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: user.fullName, role: 'artist', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Artist Application', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#3c0f0e] border-4 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">ARTIST PORTAL // {artistRecord?.genre || 'PENDING GENRE TAG'}</span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.fullName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-[9px] uppercase text-[#E7D5A4]/60">Application Status:</span>
                <Badge status={applicationStatus} />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">✦ ASK TANGY AI</Link>
              <button onClick={handleLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">LOG OUT ✕</button>
            </div>
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
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING ARTIST PORTAL...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Genre</span>
                  <div className="font-display text-xl font-bold mt-1">{artistRecord?.genre || 'Not yet on file'}</div>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">City</span>
                  <div className="font-display text-xl font-bold mt-1">{artistRecord?.city || 'Hyderabad'}</div>
                </div>
                <div className="sm:col-span-2 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Bio</span>
                  <p className="font-mono text-xs text-[#E7D5A4]/80 mt-2 leading-relaxed">
                    {artistRecord?.bio || 'Your bio hasn’t been added yet. Once your application is approved, the curation desk will help you write one for the archive.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Portfolio Links</h3>
                {portfolio.length === 0 ? (
                  <Empty>NO PORTFOLIO LINKS ON FILE — SEND US YOUR MUSIC, SOCIAL OR PRESS LINKS VIA A HUMAN AGENT REQUEST.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {portfolio.map((link, i) => (
                      <a key={i} href={`https://${link}`} target="_blank" rel="noreferrer" className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3 font-mono text-xs font-bold hover:bg-[#C99A2E] break-all">
                        🔗 {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performances' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Upcoming Performances</h3>
                  {upcoming.length === 0 ? (
                    <Empty>NO UPCOMING PERFORMANCES BOOKED. APPROVED ARTISTS ARE SLOTTED IN BY THE CURATION DESK.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upcoming.map((ev) => (
                        <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                          <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                          <p className="font-mono text-[10px] mt-1">{fmtDate(ev.date)} · {ev.venue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Past Performances</h3>
                  {past.length === 0 ? (
                    <Empty>NO PAST PERFORMANCES ON RECORD YET.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {past.map((ev) => (
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

            {activeTab === 'availability' && (
              <div className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-3">Availability</h3>
                <p className="font-mono text-[11px] text-[#11100C]/70 mb-4">Toggle whether the curation desk can consider you for upcoming sessions.</p>
                <button
                  onClick={() => setAvailable((v) => !v)}
                  className={`w-full py-3 font-bold uppercase text-xs tracking-widest border-2 border-[#11100C] ${available ? 'bg-[#10b981] text-[#11100C]' : 'bg-[#ef4444] text-white'}`}
                >
                  {available ? '✓ AVAILABLE FOR BOOKINGS' : '✕ NOT AVAILABLE RIGHT NOW'}
                </button>
                <p className="font-mono text-[9px] text-[#11100C]/50 mt-3">Mock toggle — not persisted beyond this session.</p>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Tangy Sessions Calendar</h3>
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

            {activeTab === 'agent' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Your Agent Requests</h3>
                {myAgentRequests.length === 0 ? (
                  <Empty>NO REQUESTS FILED YET. USE THE HELP TAB TO REACH THE TANGY TEAM.</Empty>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myAgentRequests.map((r) => (
                      <div key={r.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-4 flex justify-between items-start gap-3">
                        <div>
                          <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase">{r.category}</span>
                          <p className="font-mono text-xs mt-1">{r.question}</p>
                        </div>
                        <Badge status={r.status} />
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

            {activeTab === 'settings' && (
              <div className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-4">Account Settings</h3>
                <form onSubmit={handleSettingsSave} className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Artist / Act Name</label>
                    <input value={settings.fullName} onChange={(e) => { setSettings({ ...settings, fullName: e.target.value }); setSavedMsg(false); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
                    <input value={settings.email} onChange={(e) => { setSettings({ ...settings, email: e.target.value }); setSavedMsg(false); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  {savedMsg && <div className="p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#0f5132] text-[10px] font-bold">✓ SAVED (MOCK ONLY — NOT PERSISTED)</div>}
                  <button type="submit" className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C]">SAVE CHANGES</button>
                </form>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="max-w-lg flex flex-col gap-4">
                <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <h3 className="font-display text-lg font-bold uppercase mb-2">Need help?</h3>
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about your application status, booking process, or the archive.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Artist Application</option>
                        <option>Booking</option>
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
