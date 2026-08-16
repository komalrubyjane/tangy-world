import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
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
  try { return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">{children}</div>
);

const VOLUNTEER_ROLES = ['Front of House', 'Guest Registration', 'Soundcheck Support', 'Social Media Coverage'];

const TABS = [
  { id: 'profile', label: '🤝 PROFILE' },
  { id: 'opportunities', label: '🪧 OPPORTUNITIES' },
  { id: 'application', label: '📋 APPLICATION' },
  { id: 'assigned', label: '📌 ASSIGNED EVENTS' },
  { id: 'tasks', label: '✅ TASKS' },
  { id: 'schedule', label: '🕓 SCHEDULE' },
  { id: 'help', label: '✦ HELP' },
];

export const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [agentForm, setAgentForm] = useState({ category: 'Volunteering', question: '' });
  const [agentSent, setAgentSent] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);
  const volunteerRecord = userService.getProfileTable('volunteer').find((v) => v.fullName.toLowerCase() === user.fullName.toLowerCase());
  const [tasks, setTasks] = useState(volunteerRecord?.tasks || []);

  const upcomingSessions = eventService.getUpcoming();
  const opportunities = upcomingSessions.map((ev, i) => ({ event: ev, role: VOLUNTEER_ROLES[i % VOLUNTEER_ROLES.length] }));
  const assignedEvents = (volunteerRecord?.assignedEvents || []).map(eventById).filter(Boolean);
  const interest = volunteerRecord?.interest || 'General Volunteering';
  const status = volunteerRecord?.status || 'pending';

  const toggleTask = (id) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const handleLogout = () => { signOut(); navigate('/'); };
  const handleAgentSubmit = (e) => {
    e.preventDefault();
    if (!agentForm.question.trim()) return;
    const req = agentService.create({ user: user.fullName, role: 'volunteer', category: agentForm.category, question: agentForm.question });
    setAgentSent(req.id);
    setAgentForm({ category: 'Volunteering', question: '' });
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-full bg-[#E7D5A4] text-[#11100C] border-2 border-[#C99A2E] flex flex-col items-center justify-center text-center">
              <span className="font-display text-sm font-bold leading-none">✦</span>
              <span className="font-mono text-[6px] font-bold mt-0.5">VOLUNTEER</span>
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">{interest}</span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.fullName}</h1>
              <Badge status={status} />
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
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING VOLUNTEER DESK...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Interest Area</span>
                  <div className="font-display text-xl font-bold mt-1">{interest}</div>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Events Assigned</span>
                  <div className="font-display text-4xl font-bold mt-1">{assignedEvents.length}</div>
                </div>
                <div className="sm:col-span-2 bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
                  <p className="font-mono text-xs text-[#E7D5A4]/80 leading-relaxed">
                    {volunteerRecord
                      ? `Thanks for volunteering with Tangy Sessions. Your application is ${status}.`
                      : 'Your volunteer profile hasn’t synced to the archive roster yet — this is normal for a fresh mock account. Explore open opportunities below.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'opportunities' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Open Volunteer Roles</h3>
                {opportunities.length === 0 ? (
                  <Empty>NO OPEN ROLES RIGHT NOW — CHECK BACK WHEN THE NEXT SESSION IS ANNOUNCED.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {opportunities.map((o, i) => (
                      <div key={i} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                        <h4 className="font-display font-bold uppercase">{o.role}</h4>
                        <p className="font-mono text-[10px] mt-1">{o.event.name} · {fmtDate(o.event.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'application' && (
              <div className="max-w-md bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-3">Your Application</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] font-bold uppercase">Interest</span>
                  <span className="font-mono text-xs font-bold">{interest}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold uppercase">Status</span>
                  <Badge status={status} />
                </div>
              </div>
            )}

            {activeTab === 'assigned' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Assigned Events</h3>
                {assignedEvents.length === 0 ? (
                  <Empty>NO EVENTS ASSIGNED TO YOU YET.</Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedEvents.map((ev) => (
                      <div key={ev.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                        <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                        <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{fmtDate(ev.date)} · {ev.venue}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Tasks</h3>
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
              </div>
            )}

            {activeTab === 'schedule' && (
              <div>
                <h3 className="font-display text-lg font-bold uppercase mb-3">Schedule</h3>
                {assignedEvents.length === 0 ? (
                  <Empty>NO SHIFTS SCHEDULED YET.</Empty>
                ) : (
                  <div className="flex flex-col gap-2 max-w-lg">
                    {assignedEvents.map((ev) => (
                      <div key={ev.id} className="flex justify-between items-center bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                        <span className="font-mono text-xs font-bold">{ev.name}</span>
                        <span className="font-mono text-[10px] text-[#C99A2E]">Arrive 90 min before doors ({ev.time})</span>
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
                  <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about shift timing, roles, or what to bring on the day.</p>
                  <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
                </div>
                <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
                  <h3 className="font-display text-lg font-bold uppercase mb-3">Request a Human Agent</h3>
                  {agentSent ? (
                    <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/40 text-[10px] font-bold">✓ REQUEST SENT — REF {agentSent}. THE TANGY TEAM WILL REACH OUT.</div>
                  ) : (
                    <form onSubmit={handleAgentSubmit} className="flex flex-col gap-3 text-xs">
                      <select value={agentForm.category} onChange={(e) => setAgentForm({ ...agentForm, category: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none">
                        <option>Volunteering</option>
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
