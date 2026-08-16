import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ArchiveStamp } from '../../components/ui/ArchiveStamp';
import { useMockAuth } from '../../context/MockAuthContext';
import { eventService } from '../../services/eventService';
import { bookingService } from '../../services/bookingService';
import { userService } from '../../services/userService';
import { announcementService } from '../../services/announcementService';
import { agentService } from '../../services/agentService';

const STATUS_COLORS = {
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  cancelled: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  refunded: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status}
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
  { id: 'overview', label: '🎫 OVERVIEW' },
  { id: 'passport', label: '📖 PASSPORT' },
  { id: 'bookings', label: '🎟️ BOOKINGS' },
  { id: 'saved', label: '♡ SAVED' },
  { id: 'waitlist', label: '⏳ WAITLIST' },
  { id: 'notices', label: '📣 NOTICES' },
  { id: 'settings', label: '⚙ SETTINGS' },
  { id: 'help', label: '✦ HELP' },
];

export const PatronDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ fullName: user?.fullName || '', email: user?.email || '', notify: true });
  const [savedMsg, setSavedMsg] = useState(false);
  const [agentForm, setAgentForm] = useState({ category: 'Booking', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const bookings = bookingService.getForUser(user.id);
  const patronRecord = userService.getProfileTable('patron').find((p) => p.email?.toLowerCase() === user.email?.toLowerCase());

  const upcomingBookings = bookings
    .map((b) => ({ ...b, event: eventById(b.eventId) }))
    .filter((b) => b.event && b.event.status !== 'past')
    .sort((a, b) => a.event.date.localeCompare(b.event.date));

  const pastBookings = bookings
    .map((b) => ({ ...b, event: eventById(b.eventId) }))
    .filter((b) => b.event && b.event.status === 'past')
    .sort((a, b) => b.event.date.localeCompare(a.event.date));

  const savedEvents = (patronRecord?.savedSessions || []).map(eventById).filter(Boolean);
  const stampsCount = bookings.length;
  const announcements = announcementService.getPublished();
  const passportId = patronRecord?.passportId || `TS-PASS-${String(user.id).slice(-4).toUpperCase()}`;
  const memberSince = patronRecord?.memberSince || user.createdAt;

  const handleLogout = () => { signOut(); navigate('/'); };

  const handleSettingsSave = (e) => {
    e.preventDefault();
    setSavedMsg(true);
  };

  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: user.fullName, role: 'patron', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Booking', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 bg-[#E7D5A4] text-[#11100C] rounded-full border-2 border-[#B94717] flex flex-col items-center justify-center text-center">
              <span className="font-display text-base font-bold leading-none">TS</span>
              <span className="font-mono text-[6px] font-bold">PATRON</span>
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">
                MEMBER PASSPORT NO. {passportId}
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.fullName}</h1>
              <span className="font-mono text-[10px] text-[#E7D5A4]/60">{user.email} · Member since {fmtDate(memberSince?.slice ? memberSince.slice(0, 10) : memberSince)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              ✦ ASK TANGY AI
            </Link>
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
        {loading ? (
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING PASSPORT...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Passport Stamps</span>
                  <div className="font-display text-4xl font-bold mt-1">{stampsCount}</div>
                  <p className="font-mono text-[10px] text-[#11100C]/60 mt-1">sessions attended so far</p>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Upcoming Bookings</span>
                  <div className="font-display text-4xl font-bold mt-1">{upcomingBookings.length}</div>
                  <p className="font-mono text-[10px] text-[#11100C]/60 mt-1">tickets confirmed</p>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Saved Sessions</span>
                  <div className="font-display text-4xl font-bold mt-1">{savedEvents.length}</div>
                  <p className="font-mono text-[10px] text-[#11100C]/60 mt-1">on your watchlist</p>
                </div>
                <div className="sm:col-span-3 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <h3 className="font-display text-lg font-bold uppercase mb-3 text-[#C99A2E]">Next up</h3>
                  {upcomingBookings.length === 0 ? (
                    <Empty>NO UPCOMING BOOKINGS YET — BROWSE SESSIONS AND BOOK YOUR NEXT NIGHT AT THE STEPWELL.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upcomingBookings.slice(0, 2).map((b) => (
                        <div key={b.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                          <h4 className="font-display font-bold uppercase">{b.event.name}</h4>
                          <p className="font-mono text-[10px] mt-1">{fmtDate(b.event.date)} · {b.event.venue}</p>
                          <Badge status={b.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'passport' && (
              <div className="bg-[#3c0f0e] border-4 border-[#C99A2E] p-5 sm:p-8 shadow-[10px_10px_0px_#11100C]">
                <span className="font-mono text-xs font-bold text-[#C99A2E] tracking-[0.3em]">PASSPORT // MEMBER STAMP BOOK</span>
                <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1 mb-5">Each Tangy Session you attend earns a stamp in your passport.</p>
                {stampsCount === 0 ? (
                  <Empty>NO STAMPS YET — YOUR FIRST BOOKING WILL START YOUR COLLECTION.</Empty>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {bookings.map((b, i) => {
                      const ev = eventById(b.eventId);
                      return <ArchiveStamp key={b.id} text={ev?.name?.replace('Tangy Sessions ', '') || 'SESSION'} rotation={`${(i % 2 === 0 ? -1 : 1) * (4 + i)}deg`} color={i % 2 === 0 ? 'gold' : 'orange'} />;
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Upcoming</h3>
                  {upcomingBookings.length === 0 ? (
                    <Empty>NO UPCOMING TICKETS. BOOK A SESSION TO SEE IT HERE.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {upcomingBookings.map((b) => (
                        <div key={b.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-display font-bold uppercase">{b.event.name}</h4>
                            <Badge status={b.status} />
                          </div>
                          <p className="font-mono text-[10px] mt-1">{fmtDate(b.event.date)} · {b.event.time} · {b.event.venue}</p>
                          <p className="font-mono text-[9px] mt-2 text-[#B94717] font-bold">{b.registrationCode} · QTY {b.quantity}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Ticket History</h3>
                  {pastBookings.length === 0 ? (
                    <Empty>NO PAST TICKETS ON RECORD.</Empty>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pastBookings.map((b) => (
                        <div key={b.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-display font-bold uppercase">{b.event.name}</h4>
                            <Badge status={b.checkedIn ? 'confirmed' : b.status} />
                          </div>
                          <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{fmtDate(b.event.date)} · {b.event.venue}</p>
                          {b.checkedIn && <p className="font-mono text-[9px] mt-2 text-[#10b981] font-bold">✓ CHECKED IN</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Saved Sessions</h3>
                {savedEvents.length === 0 ? (
                  <Empty>NOTHING SAVED YET — TAP THE HEART ICON ON ANY SESSION TO WATCH IT HERE.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedEvents.map((ev) => (
                      <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                        <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                        <p className="font-mono text-[10px] mt-1">{fmtDate(ev.date)} · {ev.venue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'waitlist' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Waitlist Status</h3>
                <Empty>YOU'RE NOT ON ANY WAITLISTS RIGHT NOW. WHEN A SESSION SELLS OUT, YOU'LL BE ABLE TO JOIN ITS WAITLIST FROM THE SESSION PAGE.</Empty>
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-lg font-bold uppercase mb-1">Announcements</h3>
                {announcements.length === 0 ? (
                  <Empty>NO ANNOUNCEMENTS PUBLISHED RIGHT NOW.</Empty>
                ) : announcements.map((a) => (
                  <div key={a.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-4 flex justify-between items-start gap-3">
                    <div>
                      <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase">{a.category}</span>
                      <h4 className="font-display font-bold uppercase">{a.title}</h4>
                      <p className="font-mono text-[10px] text-[#E7D5A4]/70 mt-1">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-4">Account Settings</h3>
                <form onSubmit={handleSettingsSave} className="flex flex-col gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Full Name</label>
                    <input value={settings.fullName} onChange={(e) => { setSettings({ ...settings, fullName: e.target.value }); setSavedMsg(false); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
                    <input value={settings.email} onChange={(e) => { setSettings({ ...settings, email: e.target.value }); setSavedMsg(false); }} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase">
                    <input type="checkbox" checked={settings.notify} onChange={(e) => { setSettings({ ...settings, notify: e.target.checked }); setSavedMsg(false); }} />
                    Notify me about new sessions
                  </label>
                  {savedMsg && <div className="p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#0f5132] text-[10px] font-bold">✓ SAVED (MOCK ONLY — NOT PERSISTED)</div>}
                  <button type="submit" className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C]">SAVE CHANGES</button>
                </form>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="max-w-lg flex flex-col gap-4">
                <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <h3 className="font-display text-lg font-bold uppercase mb-2">Need help?</h3>
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Tangy AI can answer questions about bookings, sessions and your passport instantly.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Booking</option>
                        <option>Tickets</option>
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
