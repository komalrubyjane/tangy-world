// MOCK admin console preview — reachable ONLY at /admin-mock, gated by
// MockProtectedRoute (localStorage-only, zero Supabase). This is entirely
// separate from the REAL admin system at /admin (src/pages/AdminPage.jsx,
// gated by src/admin/StaffAuthGate.jsx with real Supabase auth). It does not
// replace, bypass, or share any code/session with the real admin — it exists
// purely so the admin@tangysessions.test dev account has somewhere to land.
import { useNavigate, Link } from 'react-router-dom';
import { useMockAuth } from '../../context/MockAuthContext';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
import { announcementService } from '../../services/announcementService';

export const AdminMockDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();

  const events = eventService.getAll();
  const accounts = userService.getAllAccounts();
  const announcements = announcementService.getPublished();
  const byRole = accounts.reduce((acc, a) => {
    acc[a.role] = (acc[a.role] || 0) + 1;
    return acc;
  }, {});

  const handleLogout = () => { signOut(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-[#3c0f0e] border-2 border-[#B94717] p-3 mb-4 text-[10px] font-bold uppercase tracking-wide text-[#E7D5A4]">
          ⚠ DEVELOPMENT / DEMO ADMIN CONSOLE — MOCK DATA ONLY, NOT THE REAL TANGY SESSIONS ADMIN.
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 bg-[#C99A2E] text-[#11100C] border-2 border-[#11100C] flex flex-col items-center justify-center text-center -rotate-3">
              <span className="font-display text-base font-bold leading-none">ADM</span>
              <span className="font-mono text-[6px] font-bold">MOCK ONLY</span>
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">Development Admin</span>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{user.name || user.fullName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">✦ ASK TANGY AI</Link>
            <button onClick={handleLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">LOG OUT ✕</button>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
            <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Sessions</span>
            <div className="font-display text-4xl font-bold mt-1">{events.length}</div>
          </div>
          <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
            <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Accounts</span>
            <div className="font-display text-4xl font-bold mt-1">{accounts.length}</div>
          </div>
          <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
            <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Announcements</span>
            <div className="font-display text-4xl font-bold mt-1">{announcements.length}</div>
          </div>
          <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C]">
            <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">Roles Represented</span>
            <div className="font-display text-4xl font-bold mt-1">{Object.keys(byRole).length}</div>
          </div>
        </div>

        <h3 className="font-display text-lg font-bold uppercase mb-3">Accounts by Role</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {Object.entries(byRole).map(([role, count]) => (
            <div key={role} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3 flex justify-between items-center">
              <span className="font-mono text-[10px] font-bold uppercase">{role}</span>
              <span className="font-mono text-xs font-bold text-[#C99A2E]">{count}</span>
            </div>
          ))}
        </div>

        <h3 className="font-display text-lg font-bold uppercase mb-3">Recent Sessions</h3>
        {events.length === 0 ? (
          <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">NO SESSIONS IN MOCK DATA.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {events.slice(0, 6).map((ev) => (
              <div key={ev.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-3">
                <h4 className="font-display font-bold uppercase">{ev.name}</h4>
                <p className="font-mono text-[10px] mt-1 text-[#E7D5A4]/70">{ev.date} · {ev.venue}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};
