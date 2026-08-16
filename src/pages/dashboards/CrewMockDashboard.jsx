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
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status || 'unassigned'}
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

const OPS_NOTES = {
  'Stage Operations': [
    'Confirm rigging & line array checks 3 hours before doors.',
    'Walk the stone floor for trip hazards — heritage sites have uneven surfaces.',
    'Coordinate hand signals with the sound desk; no radios during unamplified sets.',
  ],
  default: [
    'Report to the production lead at call time, not doors time.',
    'Heritage venues mean no drilling, no adhesive tape on stone — use sandbags & rope ties.',
    'Keep the backstage corridor clear for artist load-in.',
  ],
};

const TABS = [
  { id: 'profile', label: '🎬 PROFILE' },
  { id: 'assignments', label: '📌 ASSIGNMENTS' },
  { id: 'tasks', label: '✅ TASKS' },
  { id: 'schedule', label: '🕓 SCHEDULE' },
  { id: 'sessions', label: '🏛️ SESSIONS' },
  { id: 'ops', label: '📻 OPS NOTES' },
  { id: 'notices', label: '📣 NOTICES' },
  { id: 'help', label: '✦ HELP' },
];

export const CrewMockDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [agentForm, setAgentForm] = useState({ category: 'Production', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const crewRecord = userService.getProfileTable('crew').find((c) => c.fullName.toLowerCase() === user.fullName.toLowerCase());
  const [tasks, setTasks] = useState(crewRecord?.tasks || []);

  const assignedEvents = (crewRecord?.assignedEvents || []).map(eventById).filter(Boolean);
  const schedule = (crewRecord?.schedule || []).map((s) => ({ ...s, ev: eventById(s.event) }));
  const upcomingSessions = eventService.getUpcoming();
  const announcements = announcementService.getPublished();
  const opsNotes = OPS_NOTES[crewRecord?.role] || OPS_NOTES.default;

  const toggleTask = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const handleLogout = () => { signOut(); navigate('/'); };
  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: user.fullName, role: 'crew', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Production', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 bg-[#C99A2E] text-[#11100C] border-2 border-[#11100C] flex flex-col items-center justify-center text-center -rotate-3">
              <span className="font-display text-base font-bold leading-none">CREW</span>
              <span className="font-mono text-[6px] font-bold">ALL ACCESS</span>
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">{crewRecord?.role || 'CREW ROLE PENDING'}</span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.fullName}</h1>
              <Badge status={crewRecord?.status || 'pending'} />
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
                activeTab === tab.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]' : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING CALL SHEET...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Role</span>
                  <div className="font-display text-xl font-bold mt-1">{crewRecord?.role || 'Not yet assigned'}</div>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Open Tasks</span>
                  <div className="font-display text-4xl font-bold mt-1">{tasks.filter((t) => !t.done).length}</div>
                </div>
                <div className="sm:col-span-2 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">On the crew roster since</span>
                  <p className="font-mono text-xs text-[#E7D5A4]/80 mt-2 leading-relaxed">
                    {crewRecord ? fmtDate(crewRecord.createdAt?.slice(0, 10)) : 'Not yet on the archive roster — your profile will sync once the production lead confirms your role.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Assigned Sessions</h3>
                {assignedEvents.length === 0 ? (
                  <Empty>NO SESSIONS ASSIGNED TO YOU YET.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedEvents.map((ev) => (
                      <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                        <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                        <p className="font-mono text-[10px] mt-1">{fmtDate(ev.date)} · {ev.venue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Production Tasks</h3>
                {tasks.length === 0 ? (
                  <Empty>NO TASKS ASSIGNED RIGHT NOW.</Empty>
                ) : (
                  <div className="flex flex-col gap-2 max-w-lg">
                    {tasks.map((t) => (
                      <label key={t.id} className={`flex items-center gap-3 p-3 border-2 border-[#11100C] cursor-pointer ${t.done ? 'bg-[#10b981]/20' : 'bg-[#E7D5A4]'} text-[#11100C]`}>
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                        <span className={`font-mono text-xs font-bold ${t.done ? 'line-through opacity-60' : ''}`}>{t.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="font-mono text-[9px] text-[#E7D5A4]/40 mt-3">Mock checklist — toggles are local to this session only.</p>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Call Time Schedule</h3>
                {schedule.length === 0 ? (
                  <Empty>NO CALL TIMES ISSUED YET.</Empty>
                ) : (
                  <div className="flex flex-col gap-2 max-w-lg">
                    {schedule.map((s, i) => (
                      <div key={i} className="flex justify-between items-center bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                        <span className="font-mono text-xs font-bold">{s.ev?.name || s.event}</span>
                        <span className="font-mono text-xs font-bold text-[#C99A2E]">{s.callTime}</span>
                      </div>
                    ))}
                  </div>
                )}
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

            {activeTab === 'ops' && (
              <div className="max-w-lg bg-[#3c0f0e] border-4 border-[#C99A2E] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-3">Stage Operations Notes</h3>
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {opsNotes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2"><span>✦</span><span>{n}</span></li>
                  ))}
                </ul>
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
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about call times, load-in procedure, or venue restrictions.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Production</option>
                        <option>Scheduling</option>
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
