import { useState, useMemo } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useMockAuth } from '../context/MockAuthContext';
import { bookingService } from '../services/bookingService';
import { eventService } from '../services/eventService';
import { userService } from '../services/userService';
import { ROLE_META } from '../services/mockAuthService';
import { resetAllMockData } from '../data/mock/store';

const ROLE_LABELS = {
  ...Object.fromEntries(Object.entries(ROLE_META).map(([k, v]) => [k, v.label])),
  admin: 'Admin (Dev)',
};

const STATUS_COLORS = {
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  cancelled: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  refunded: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status || 'n/a'}
  </span>
);

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const iso = typeof d === 'string' && d.length === 10 ? `${d}T00:00:00` : d;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

const Section = ({ title, children, delay = 0 }) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="mb-6"
  >
    {title && (
      <h2 className="font-mono text-[10px] font-bold text-[#C99A2E] tracking-[0.25em] uppercase mb-3 border-b border-[#C99A2E]/30 pb-2">
        {title}
      </h2>
    )}
    {children}
  </motion.section>
);

const Empty = ({ children }) => (
  <div className="p-6 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
    {children}
  </div>
);

// Find a role-table row matching the logged-in dev/mock session by email.
// The 9 deterministic dev accounts (patron@tangysessions.test, etc.) are a
// separate hand-seeded identity from the role tables, so there may be no
// match at all — that's expected, not an error.
function findProfileRow(role, email) {
  if (!email) return null;
  const rows = userService.getProfileTable(role);
  return rows.find((r) => r.email && r.email.toLowerCase() === email.toLowerCase()) || null;
}

function QrPlaceholder({ code }) {
  return (
    <div className="w-24 h-24 shrink-0 bg-[#F5E9C9] border-2 border-[#11100C] flex flex-col items-center justify-center p-1.5 gap-0.5">
      <div
        className="w-full flex-1 opacity-80"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #11100C 0 3px, transparent 3px 6px), repeating-linear-gradient(0deg, #11100C 0 3px, transparent 3px 6px)',
          backgroundBlendMode: 'multiply',
        }}
      />
      <span className="font-mono text-[6px] font-bold text-[#11100C] tracking-tight leading-none text-center break-all">{code}</span>
    </div>
  );
}

const BookingCard = ({ b }) => (
  <div className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3 flex gap-3">
    <QrPlaceholder code={b.registrationCode} />
    <div className="min-w-0 flex-1">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-display font-bold uppercase text-sm leading-tight">{b.event?.name || 'Unknown session'}</h4>
        <Badge status={b.status} />
      </div>
      <p className="font-mono text-[10px] mt-1 opacity-80">{fmtDate(b.event?.date)} · {b.event?.venue || '—'}</p>
      <p className="font-mono text-[9px] mt-2 text-[#B94717] font-bold">{b.registrationCode} · QTY {b.quantity}</p>
      {b.checkedIn && <p className="font-mono text-[9px] mt-1 text-[#0f5132] font-bold">✓ CHECKED IN</p>}
    </div>
  </div>
);

// -------------------- Role dossier config --------------------
// Each role's mock table uses different field names for the "primary name"
// and holds different lists of related eventIds — this maps each role to
// how to read its own row shape.
const DOSSIER_CONFIG = {
  artist: (row) => ({
    facts: [
      ['Genre', row.genre],
      ['City', row.city],
      ['Status', row.status],
      ['Availability', row.availability],
      ['Instagram', row.instagram],
      ['SoundCloud', row.soundcloud],
    ],
    bio: row.bio,
    eventLists: [
      ['Upcoming performances', row.upcomingPerformances],
      ['Past performances', row.pastPerformances],
    ],
    extra: row.invitations?.length ? `${row.invitations.length} pending invitation(s)` : null,
  }),
  vendor: (row) => ({
    facts: [
      ['Business', row.businessName],
      ['Contact', row.contactName],
      ['Category', row.category],
      ['Status', row.status],
      ['Location', row.location],
    ],
    eventLists: [['Active collaborations', row.activeCollaborations]],
    extra: row.opportunitiesApplied?.length ? `${row.opportunitiesApplied.length} opportunity application(s)` : null,
  }),
  crew: (row) => ({
    facts: [
      ['Department', row.department],
      ['Role', row.role],
      ['Status', row.status],
      ['Skills', (row.skills || []).join(', ')],
    ],
    eventLists: [['Assigned events', row.assignedEvents]],
    extra: row.tasks?.length ? `${row.tasks.filter((t) => !t.done).length}/${row.tasks.length} open task(s)` : null,
  }),
  volunteer: (row) => ({
    facts: [
      ['Interest', row.interest],
      ['Availability', row.availability],
      ['Status', row.status],
      ['All interests', (row.interests || []).join(', ')],
    ],
    eventLists: [['Assigned events', row.assignedEvents]],
    extra: row.tasks?.length ? `${row.tasks.length} task(s) on file` : null,
  }),
  sponsor: (row) => ({
    facts: [
      ['Organization', row.organizationName],
      ['Contact', row.contactName],
      ['Tier', row.tier],
      ['Status', row.status],
    ],
    eventLists: [['Active collaborations', row.activeCollaborations]],
    extra: row.proposals?.length ? `${row.proposals.length} proposal(s) on file` : null,
  }),
  venue: (row) => ({
    facts: [
      ['Property', row.propertyName],
      ['Contact', row.contactName],
      ['Location', row.location],
      ['Capacity', row.capacity],
      ['Status', row.status],
    ],
    eventLists: [['Upcoming events', row.upcomingEvents]],
    extra: row.hostingRequests?.length ? `${row.hostingRequests.length} hosting request(s)` : null,
  }),
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading, isLoggedIn, signOut } = useMockAuth();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [notify, setNotify] = useState(true);
  const [resetArmed, setResetArmed] = useState(false);

  const events = eventService.getAll();
  const eventById = (id) => events.find((e) => e.id === id);

  const patronRow = useMemo(() => (user?.role === 'patron' ? findProfileRow('patron', user.email) : null), [user]);
  const dossierRow = useMemo(
    () => (user && DOSSIER_CONFIG[user.role] ? findProfileRow(user.role, user.email) : null),
    [user]
  );

  const bookings = useMemo(() => {
    if (!user || user.role !== 'patron') return [];
    return bookingService.getForUser(user.id).map((b) => ({ ...b, event: eventById(b.eventId) }));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingBookings = bookings.filter((b) => b.event && b.event.status !== 'past');
  const pastBookings = bookings.filter((b) => !b.event || b.event.status === 'past');

  if (!loading && !isLoggedIn) {
    return <Navigate to="/join/login" replace />;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">
        LOADING PASSPORT...
      </div>
    );
  }

  const startEdit = () => {
    setEditForm({
      fullName: dossierRow?.fullName || dossierRow?.name || patronRow?.fullName || user.fullName || '',
      email: user.email || '',
      phone: dossierRow?.phone || patronRow?.phone || '',
      bio: dossierRow?.bio || patronRow?.bio || '',
    });
    setEditing(true);
    setSavedMsg('');
  };

  const saveEdit = (e) => {
    e.preventDefault();
    const targetRow = dossierRow || patronRow;
    const role = dossierRow ? user.role : patronRow ? 'patron' : null;
    if (targetRow && role) {
      const nameField = 'fullName' in targetRow ? 'fullName' : 'name' in targetRow ? 'name' : null;
      const patch = { phone: editForm.phone, bio: editForm.bio };
      if (nameField) patch[nameField] = editForm.fullName;
      userService.updateProfile(role, targetRow.id, patch);
      setSavedMsg('✓ SAVED TO YOUR PROFILE RECORD.');
    } else {
      setSavedMsg('✓ SAVED (DEV ACCOUNT — LOCAL TO THIS SESSION ONLY, NOT PERSISTED).');
    }
    setEditing(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPwMsg('✓ PASSWORD UPDATED (MOCK — NO REAL CREDENTIAL WAS CHANGED).');
    setPwForm({ current: '', next: '', confirm: '' });
    window.setTimeout(() => setPwMsg(''), 4000);
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handleResetClick = () => {
    if (!resetArmed) {
      setResetArmed(true);
      window.setTimeout(() => setResetArmed(false), 5000);
      return;
    }
    resetAllMockData();
  };

  const displayName = dossierRow?.fullName || dossierRow?.name || dossierRow?.businessName || dossierRow?.organizationName || dossierRow?.propertyName || patronRow?.fullName || user.fullName;
  const memberSince = patronRow?.memberSince || dossierRow?.createdAt || user.createdAt;
  const location = patronRow?.location || dossierRow?.location || dossierRow?.city;
  const bio = patronRow?.bio || dossierRow?.bio;
  const phone = patronRow?.phone || dossierRow?.phone;
  const dossier = dossierRow && DOSSIER_CONFIG[user.role] ? DOSSIER_CONFIG[user.role](dossierRow) : null;

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* HEADER */}
        <Section delay={0}>
          <div className="bg-[#3c0f0e] border-4 border-[#C99A2E] p-5 sm:p-7 shadow-[8px_8px_0px_#11100C] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#E7D5A4] text-[#11100C] rounded-full border-2 border-[#B94717] flex items-center justify-center">
                <span className="font-display text-xl sm:text-2xl font-bold">{initials(displayName)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-[0.25em] block mb-1">
                  ✦ TANGY DIGITAL PASSPORT
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase leading-tight truncate">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase border border-[#C99A2E] text-[#C99A2E] bg-[#11100C]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                  <span className="font-mono text-[10px] text-[#E7D5A4]/70">Member since {fmtDate(memberSince)}</span>
                  {location && <span className="font-mono text-[10px] text-[#E7D5A4]/70">· {location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                  ✦ ASK TANGY AI
                </Link>
                {user.role !== 'admin' && (
                  <Link
                    to={ROLE_META[user.role]?.dashboard || '/'}
                    className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  >
                    DASHBOARD →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* DETAILS */}
        <Section title="Details" delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#191410] border border-[#C99A2E]/40 p-4">
              <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Email</span>
              <div className="font-mono text-xs mt-1 break-all">{user.email}</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/40 p-4">
              <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Phone</span>
              <div className="font-mono text-xs mt-1">{phone || '—'}</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/40 p-4">
              <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Notifications</span>
              <div className="font-mono text-xs mt-1">{(patronRow?.preferences?.notifications ?? notify) ? 'Enabled' : 'Disabled'}</div>
            </div>
            {bio && (
              <div className="sm:col-span-3 bg-[#191410] border border-[#C99A2E]/40 p-4">
                <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Bio</span>
                <p className="font-mono text-xs mt-1.5 leading-relaxed text-[#E7D5A4]/85">{bio}</p>
              </div>
            )}
            {patronRow?.preferences?.music?.length > 0 && (
              <div className="sm:col-span-3 bg-[#191410] border border-[#C99A2E]/40 p-4">
                <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Music preferences</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patronRow.preferences.music.map((m) => (
                    <span key={m} className="px-2 py-0.5 text-[9px] font-bold uppercase border border-[#C99A2E]/50 text-[#E7D5A4]/80">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* PATRON: ACTIVITY */}
        {user.role === 'patron' && (
          <Section title={`Activity — ${patronRow?.passportId || 'No passport ID on file'}`} delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-4 shadow-[5px_5px_0px_#11100C]">
                <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Passport Stamps</span>
                <div className="font-display text-3xl font-bold mt-1">{bookings.length}</div>
              </div>
              <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-4 shadow-[5px_5px_0px_#11100C]">
                <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Upcoming</span>
                <div className="font-display text-3xl font-bold mt-1">{upcomingBookings.length}</div>
              </div>
              <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-4 shadow-[5px_5px_0px_#11100C]">
                <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Past Sessions</span>
                <div className="font-display text-3xl font-bold mt-1">{pastBookings.length}</div>
              </div>
            </div>

            <h3 className="font-display text-base font-bold uppercase mb-2 text-[#E7D5A4]/90">Upcoming bookings</h3>
            {upcomingBookings.length === 0 ? (
              <Empty>NO UPCOMING BOOKINGS. BROWSE SESSIONS AND BOOK YOUR NEXT NIGHT AT THE STEPWELL.</Empty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {upcomingBookings.map((b) => <BookingCard key={b.id} b={b} />)}
              </div>
            )}

            <h3 className="font-display text-base font-bold uppercase mb-2 text-[#E7D5A4]/90">Ticket history</h3>
            {pastBookings.length === 0 ? (
              <Empty>NO PAST TICKETS ON RECORD.</Empty>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pastBookings.map((b) => <BookingCard key={b.id} b={b} />)}
              </div>
            )}
          </Section>
        )}

        {/* ROLE DOSSIER */}
        {user.role !== 'patron' && user.role !== 'admin' && (
          <Section title="Extended profile" delay={0.1}>
            {!dossierRow ? (
              <Empty>
                NO EXTENDED PROFILE ON FILE YET FOR THIS ACCOUNT. Dev accounts aren't linked to the hand-seeded {ROLE_LABELS[user.role] || user.role} roster —
                once a real application record exists for this email, its details will appear here.
              </Empty>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dossier.facts
                    .filter(([, v]) => v !== undefined && v !== null && v !== '')
                    .map(([label, value]) => (
                      <div key={label} className="bg-[#191410] border border-[#C99A2E]/40 p-4 flex justify-between items-center gap-3">
                        <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">{label}</span>
                        <span className="font-mono text-xs text-right">{typeof value === 'string' && ['status'].includes(label.toLowerCase()) ? <Badge status={value} /> : String(value)}</span>
                      </div>
                    ))}
                </div>

                {dossier.extra && (
                  <div className="bg-[#C99A2E]/10 border border-[#C99A2E]/40 p-3 font-mono text-[10px] text-[#C99A2E] font-bold uppercase">
                    {dossier.extra}
                  </div>
                )}

                {dossier.eventLists.map(([label, ids]) => {
                  const list = (ids || []).map(eventById).filter(Boolean);
                  return (
                    <div key={label}>
                      <h3 className="font-display text-sm font-bold uppercase mb-2 text-[#E7D5A4]/90">{label}</h3>
                      {list.length === 0 ? (
                        <Empty>NONE ON FILE.</Empty>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {list.map((ev) => (
                            <div key={ev.id} className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3">
                              <h4 className="font-display font-bold uppercase text-sm">{ev.name}</h4>
                              <p className="font-mono text-[10px] mt-1">{fmtDate(ev.date)} · {ev.venue}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ADMIN */}
        {user.role === 'admin' && (
          <Section title="Admin" delay={0.1}>
            <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="font-mono text-xs text-[#E7D5A4]/80 leading-relaxed max-w-md">
                This is a development admin account. Full management tools — bookings, events, applications, inbox and more — live in the admin console.
              </p>
              <Link
                to="/admin"
                className="shrink-0 bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-mono text-xs font-bold uppercase tracking-widest px-4 py-2.5 border-2 border-[#11100C]"
              >
                OPEN ADMIN CONSOLE →
              </Link>
            </div>
          </Section>
        )}

        {/* ACCOUNT SETTINGS */}
        <Section title="Account" delay={0.15}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Edit profile */}
            <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
              <h3 className="font-display text-base font-bold uppercase mb-3">Edit profile</h3>
              {!editing ? (
                <button onClick={startEdit} className="w-full py-2.5 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">
                  EDIT NAME, PHONE &amp; BIO
                </button>
              ) : (
                <form onSubmit={saveEdit} className="flex flex-col gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Full name</label>
                    <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full p-2.5 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Phone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-2.5 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Bio</label>
                    <textarea rows={3} value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full p-2.5 bg-[#F5E9C9] border-2 border-[#11100C] outline-none resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2.5 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">SAVE</button>
                    <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-transparent text-[#11100C] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">CANCEL</button>
                  </div>
                </form>
              )}
              {savedMsg && <div className="mt-3 p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#0f5132] text-[10px] font-bold">{savedMsg}</div>}

              <label className="flex items-center gap-2 text-[10px] font-bold uppercase mt-4 pt-4 border-t border-[#11100C]/20">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Notify me about new sessions &amp; replies
              </label>
            </div>

            {/* Change password (mock) */}
            <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
              <h3 className="font-display text-base font-bold uppercase mb-3 text-[#E7D5A4]">Change password</h3>
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-3 text-xs">
                <input type="password" required placeholder="Current password" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} className="w-full p-2.5 bg-[#11100C] border border-[#C99A2E]/60 text-[#E7D5A4] outline-none" />
                <input type="password" required minLength={6} placeholder="New password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full p-2.5 bg-[#11100C] border border-[#C99A2E]/60 text-[#E7D5A4] outline-none" />
                <input type="password" required placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full p-2.5 bg-[#11100C] border border-[#C99A2E]/60 text-[#E7D5A4] outline-none" />
                <button type="submit" className="py-2.5 bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">UPDATE PASSWORD (MOCK)</button>
              </form>
              {pwMsg && <div className="mt-3 p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold">{pwMsg}</div>}

              <button
                onClick={handleLogout}
                className="w-full mt-5 py-2.5 bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] font-mono text-[10px] font-bold uppercase tracking-widest"
              >
                LOG OUT ✕
              </button>
            </div>
          </div>

          {/* Dev reset — tucked away, small, requires a confirm click */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetClick}
              className={`font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-colors ${
                resetArmed
                  ? 'bg-[#ef4444] text-white border-[#ef4444]'
                  : 'text-[#E7D5A4]/40 border-[#E7D5A4]/20 hover:text-[#ef4444] hover:border-[#ef4444]/40'
              }`}
            >
              {resetArmed ? 'CLICK AGAIN TO CONFIRM — WIPES ALL MOCK DATA' : 'DEVELOPMENT — RESET ALL MOCK DATA'}
            </button>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
};
