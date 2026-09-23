import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useUserAuth } from '../context/UserAuthContext';
import { bookingService } from '../lib/bookingService';
import { supabase } from '../lib/supabaseClient';

const STATUS_COLORS = {
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  paid: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
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

const BookingCard = ({ b }) => (
  <div className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] p-3 flex gap-3">
    <div className="min-w-0 flex-1">
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-display font-bold uppercase text-sm leading-tight">{b.events?.name || 'Unknown session'}</h4>
        <Badge status={b.status} />
      </div>
      <p className="font-mono text-[10px] mt-1 opacity-80">{fmtDate(b.events?.event_date)} · {b.events?.venue || '—'}</p>
      <p className="font-mono text-[9px] mt-2 text-[#B94717] font-bold">{b.registration_code} · QTY {b.quantity}</p>
    </div>
  </div>
);

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading, isLoggedIn, logout } = useUserAuth();

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setBookingsLoading(true);
    const data = await bookingService.getMyBookings(user.id);
    setBookings(data || []);
    setBookingsLoading(false);
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBookings = bookings.filter((b) => b.events?.event_date && b.events.event_date >= today);
  const pastBookings = bookings.filter((b) => !b.events?.event_date || b.events.event_date < today);

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
    setEditForm({ fullName: user.full_name || '', phone: user.phone || '' });
    setEditing(true);
    setSavedMsg('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update({ full_name: editForm.fullName, phone: editForm.phone }).eq('id', user.id);
    setSavedMsg(error ? 'Could not save — please try again.' : '✓ SAVED TO YOUR PROFILE RECORD.');
    setEditing(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwMsg(error ? error.message : '✓ PASSWORD UPDATED.');
    if (!error) {
      setPwForm({ next: '', confirm: '' });
      window.setTimeout(() => setPwMsg(''), 4000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user.full_name || user.email;
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

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
                    {user.role === 'user' ? 'Patron' : user.role}
                  </span>
                  <span className="font-mono text-[10px] text-[#E7D5A4]/70">Member since {fmtDate(user.member_since?.slice ? user.member_since.slice(0, 10) : user.member_since)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                  ✦ ASK TANGY AI
                </Link>
                {!isAdmin && (
                  <Link
                    to="/dashboard"
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
              <div className="font-mono text-xs mt-1">{user.phone || '—'}</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/40 p-4">
              <span className="font-mono text-[9px] font-bold uppercase text-[#C99A2E]">Passport ID</span>
              <div className="font-mono text-xs mt-1">{user.passport_id || '—'}</div>
            </div>
          </div>
        </Section>

        {/* ACTIVITY */}
        {!isAdmin && (
          <Section title="Activity" delay={0.1}>
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

            {bookingsLoading ? (
              <div className="p-6 text-center font-mono text-[11px] text-[#E7D5A4]/50">LOADING BOOKINGS...</div>
            ) : (
              <>
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
              </>
            )}
          </Section>
        )}

        {/* ADMIN */}
        {isAdmin && (
          <Section title="Admin" delay={0.1}>
            <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="font-mono text-xs text-[#E7D5A4]/80 leading-relaxed max-w-md">
                Full management tools — bookings, events, applications, inbox and more — live in the admin console.
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
                  EDIT NAME &amp; PHONE
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
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-2.5 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">SAVE</button>
                    <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-transparent text-[#11100C] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">CANCEL</button>
                  </div>
                </form>
              )}
              {savedMsg && <div className="mt-3 p-2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#0f5132] text-[10px] font-bold">{savedMsg}</div>}
            </div>

            {/* Change password */}
            <div className="bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
              <h3 className="font-display text-base font-bold uppercase mb-3 text-[#E7D5A4]">Change password</h3>
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-3 text-xs">
                <input type="password" required minLength={6} placeholder="New password" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} className="w-full p-2.5 bg-[#11100C] border border-[#C99A2E]/60 text-[#E7D5A4] outline-none" />
                <input type="password" required placeholder="Confirm new password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="w-full p-2.5 bg-[#11100C] border border-[#C99A2E]/60 text-[#E7D5A4] outline-none" />
                <button type="submit" className="py-2.5 bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-bold uppercase text-[10px] tracking-widest border-2 border-[#11100C]">UPDATE PASSWORD</button>
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
        </Section>
      </main>

      <Footer />
    </div>
  );
};
