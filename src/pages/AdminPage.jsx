import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../audio/AudioContext';

const MOCK_BOOKINGS = [
  { id: "TS-A1B2C3D4", name: "Arjun Mehta", email: "arjun@email.com", event: "Vol. 1", tickets: 2, amount: 1598, status: "confirmed", date: "2025-07-12", method: "UPI" },
  { id: "TS-E5F6G7H8", name: "Priya Sharma", email: "priya@email.com", event: "Vol. 2", tickets: 4, amount: 3996, status: "confirmed", date: "2025-07-14", method: "Card" },
  { id: "TS-I9J0K1L2", name: "Rahul Nair", email: "rahul@email.com", event: "Solstice", tickets: 1, amount: 1299, status: "pending", date: "2025-07-15", method: "UPI" },
  { id: "TS-M3N4O5P6", name: "Sneha Reddy", email: "sneha@email.com", event: "Vol. 1", tickets: 3, amount: 2397, status: "confirmed", date: "2025-07-16", method: "NetBanking" },
  { id: "TS-Q7R8S9T0", name: "Karan Patel", email: "karan@email.com", event: "Vol. 2", tickets: 2, amount: 1998, status: "refunded", date: "2025-07-16", method: "Card" },
  { id: "TS-U1V2W3X4", name: "Anjali Iyer", email: "anjali@email.com", event: "Solstice", tickets: 5, amount: 6495, status: "confirmed", date: "2025-07-17", method: "UPI" },
];

const MOCK_VOLUNTEERS = [
  { id: "VOL-A1B2C3D4", name: "Meera Pillai", email: "meera@email.com", role: "Social Media", event: "Vol. 1", status: "approved", applied: "2025-07-10" },
  { id: "VOL-E5F6G7H8", name: "Rohan Sinha", email: "rohan@email.com", role: "Crew", event: "Vol. 2", status: "pending", applied: "2025-07-12" },
  { id: "VOL-I9J0K1L2", name: "Lakshmi Rao", email: "lakshmi@email.com", role: "Hospitality", event: "Solstice", status: "approved", applied: "2025-07-13" },
  { id: "VOL-M3N4O5P6", name: "Aditya Gupta", email: "aditya@email.com", role: "Security", event: "Vol. 1", status: "pending", applied: "2025-07-14" },
];

const MOCK_ARTISTS = [
  { id: "ART-01", name: "Damini Bhatla", genre: "Sufi / Acoustic", status: "approved", sessions: "Vol. 1" },
  { id: "ART-02", name: "Varun Rao", genre: "Violin Fusion", status: "approved", sessions: "Vol. 2" },
  { id: "ART-03", name: "Kabir Collective", genre: "Folk Raga", status: "pending", sessions: "Solstice" },
];

const EVENTS_DATA = [
  { id: "EVT-01", name: "Tangy Sessions Vol. 1", date: "Aug 15, 2025", capacity: 200, sold: 148, revenue: 118152, status: "on-sale" },
  { id: "EVT-02", name: "Tangy Sessions Vol. 2", date: "Sep 20, 2025", capacity: 250, sold: 67, revenue: 66933, status: "on-sale" },
  { id: "EVT-03", name: "Tangy Sessions: Solstice", date: "Dec 21, 2025", capacity: 180, sold: 23, revenue: 29877, status: "on-sale" },
];

export const AdminPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('tangy_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [artists, setArtists] = useState(MOCK_ARTISTS);
  const [events, setEvents] = useState(EVENTS_DATA);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    if (username === 'admin' && password === 'tangy2025') {
      sessionStorage.setItem('tangy_admin_auth', 'true');
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Admin Credentials. Default: admin / tangy2025');
    }
  };

  const handleLogout = () => {
    playSFX('ticketClick');
    sessionStorage.removeItem('tangy_admin_auth');
    setIsAdminLoggedIn(false);
  };

  const updateBookingStatus = (id, newStatus) => {
    playSFX('ticketClick');
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const updateVolunteerStatus = (id, newStatus) => {
    playSFX('ticketClick');
    setVolunteers(volunteers.map(v => v.id === id ? { ...v, status: newStatus } : v));
  };

  const updateArtistStatus = (id, newStatus) => {
    playSFX('ticketClick');
    setArtists(artists.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // ADMIN LOGIN SCREEN
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#11100C] flex items-center justify-center p-4 text-[#E7D5A4] font-mono">
        <div 
          className="w-full max-w-md bg-[#191410] border-2 border-[#C99A2E] p-8 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative"
          style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}
        >
          <div className="absolute -top-3 left-1/3 w-24 h-5 bg-[rgba(201,154,46,0.4)] rotate-[-2deg] border border-[#C99A2E]/50 pointer-events-none" />

          <div className="text-center border-b border-[#C99A2E]/30 pb-4 mb-6">
            <div className="text-[9px] font-bold tracking-[0.3em] text-[#C99A2E] uppercase mb-1">
              [ ✦ ] RESTRICTED ACCESS
            </div>
            <h1 className="font-display text-3xl font-bold text-[#E7D5A4] tracking-tight">
              TANGY ADMIN PORTAL
            </h1>
            <p className="font-serif italic text-xs text-[#E7D5A4]/70 mt-1">
              Archival &amp; Operations Management Dashboard
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#C99A2E] uppercase mb-1">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#C99A2E] uppercase mb-1">
                Security Passcode
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
              />
            </div>

            {loginError && (
              <div className="text-[10px] text-[#C2272A] bg-[#C2272A]/10 border border-[#C2272A]/40 p-2 text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#C99A2E] text-[#11100C] hover:bg-[#E7D5A4] font-mono text-xs font-bold uppercase tracking-widest py-3 border border-[#11100C] transition-colors shadow-[4px_4px_0px_#11100C] active:scale-95"
            >
              AUTHENTICATE ADMIN →
            </button>
          </form>

          <div className="mt-6 text-center text-[9px] text-[#E7D5A4]/40 border-t border-[#C99A2E]/20 pt-4">
            PROPERTY OF TANGY SESSIONS · HYDERABAD
          </div>
        </div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD INTERFACE
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const totalTicketsSold = events.reduce((sum, e) => sum + e.sold, 0);

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono p-4 md:p-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#191410] border-2 border-[#C99A2E] p-4 md:p-6 mb-8 rounded-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B94717] animate-pulse" />
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#E7D5A4]">
              TANGY SESSIONS ADMIN
            </h1>
          </div>
          <p className="font-serif italic text-xs text-[#E7D5A4]/70 mt-0.5">
            Central Archival Command &amp; Operations Control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-xs tracking-wider"
          >
            ← VIEW WEBSITE
          </button>
          <button
            onClick={handleLogout}
            className="bg-[#C2272A] text-white hover:bg-[#11100C] border border-[#C2272A] px-3 py-1.5 text-xs font-bold tracking-wider"
          >
            LOG OUT ✕
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-2 mb-8 border-b-2 border-[#C99A2E]/40 pb-3">
        {[
          { id: 'overview', label: '📊 OVERVIEW' },
          { id: 'bookings', label: '🎫 BOOKINGS' },
          { id: 'volunteers', label: '🤝 VOLUNTEERS' },
          { id: 'artists', label: '🎷 ARTISTS' },
          { id: 'events', label: '🏛️ EVENTS' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { playSFX('ticketClick'); setActiveTab(tab.id); }}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${
              activeTab === tab.id
                ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]'
                : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 rounded-sm">
              <div className="text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">TOTAL REVENUE</div>
              <div className="text-3xl font-bold text-[#E7D5A4]">₹{totalRevenue.toLocaleString()}</div>
              <div className="text-[9px] text-[#E7D5A4]/50 mt-1">Across 3 live sessions</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 rounded-sm">
              <div className="text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">TICKETS ISSUED</div>
              <div className="text-3xl font-bold text-[#E7D5A4]">{totalTicketsSold}</div>
              <div className="text-[9px] text-[#E7D5A4]/50 mt-1">Out of 630 capacity</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 rounded-sm">
              <div className="text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">VOLUNTEER CREW</div>
              <div className="text-3xl font-bold text-[#E7D5A4]">{volunteers.length}</div>
              <div className="text-[9px] text-[#E7D5A4]/50 mt-1">{volunteers.filter(v=>v.status==='approved').length} approved</div>
            </div>
            <div className="bg-[#191410] border border-[#C99A2E]/60 p-5 rounded-sm">
              <div className="text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">ARTIST ROSTER</div>
              <div className="text-3xl font-bold text-[#E7D5A4]">{artists.length}</div>
              <div className="text-[9px] text-[#E7D5A4]/50 mt-1">{artists.filter(a=>a.status==='approved').length} active performers</div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
            <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">
              RECENT BOOKINGS ACTIVITY
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                    <th className="py-2">TICKET ID</th>
                    <th className="py-2">PATRON</th>
                    <th className="py-2">EVENT</th>
                    <th className="py-2">AMOUNT</th>
                    <th className="py-2">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map(b => (
                    <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                      <td className="py-2.5 font-bold text-[#C99A2E]">{b.id}</td>
                      <td className="py-2.5">{b.name} ({b.email})</td>
                      <td className="py-2.5">{b.event}</td>
                      <td className="py-2.5">₹{b.amount}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          b.status === 'confirmed' ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40' :
                          b.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40' :
                          'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
          <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">
            CONCERT TICKET RESERVATIONS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                  <th className="py-2">TICKET ID</th>
                  <th className="py-2">NAME</th>
                  <th className="py-2">EMAIL</th>
                  <th className="py-2">EVENT</th>
                  <th className="py-2">TICKETS</th>
                  <th className="py-2">AMOUNT</th>
                  <th className="py-2">STATUS</th>
                  <th className="py-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-b border-[#E7D5A4]/10">
                    <td className="py-3 font-bold text-[#C99A2E]">{b.id}</td>
                    <td className="py-3">{b.name}</td>
                    <td className="py-3 opacity-70">{b.email}</td>
                    <td className="py-3">{b.event}</td>
                    <td className="py-3">{b.tickets}</td>
                    <td className="py-3 font-bold">₹{b.amount}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                        b.status === 'confirmed' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        b.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                        'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      {b.status !== 'confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'confirmed')}
                          className="bg-[#10b981] text-[#11100C] px-2 py-0.5 text-[9px] font-bold uppercase"
                        >
                          CONFIRM
                        </button>
                      )}
                      {b.status !== 'refunded' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'refunded')}
                          className="bg-[#ef4444] text-white px-2 py-0.5 text-[9px] font-bold uppercase"
                        >
                          REFUND
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VOLUNTEERS */}
      {activeTab === 'volunteers' && (
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
          <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">
            CREW &amp; VOLUNTEER APPLICATIONS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                  <th className="py-2">APP ID</th>
                  <th className="py-2">APPLICANT</th>
                  <th className="py-2">ROLE</th>
                  <th className="py-2">EVENT</th>
                  <th className="py-2">STATUS</th>
                  <th className="py-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.id} className="border-b border-[#E7D5A4]/10">
                    <td className="py-3 font-bold text-[#C99A2E]">{v.id}</td>
                    <td className="py-3">{v.name}<br/><span className="opacity-60">{v.email}</span></td>
                    <td className="py-3 font-bold">{v.role}</td>
                    <td className="py-3">{v.event}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                        v.status === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        v.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                        'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      {v.status !== 'approved' && (
                        <button
                          onClick={() => updateVolunteerStatus(v.id, 'approved')}
                          className="bg-[#10b981] text-[#11100C] px-2 py-0.5 text-[9px] font-bold uppercase"
                        >
                          APPROVE
                        </button>
                      )}
                      {v.status !== 'rejected' && (
                        <button
                          onClick={() => updateVolunteerStatus(v.id, 'rejected')}
                          className="bg-[#ef4444] text-white px-2 py-0.5 text-[9px] font-bold uppercase"
                        >
                          REJECT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ARTISTS */}
      {activeTab === 'artists' && (
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
          <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">
            ARTIST APPLICATIONS &amp; PORTAL ROSTER
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
                  <th className="py-2">ARTIST ID</th>
                  <th className="py-2">ARTIST NAME</th>
                  <th className="py-2">GENRE / SOUND</th>
                  <th className="py-2">TARGET SESSION</th>
                  <th className="py-2">STATUS</th>
                  <th className="py-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {artists.map(a => (
                  <tr key={a.id} className="border-b border-[#E7D5A4]/10">
                    <td className="py-3 font-bold text-[#C99A2E]">{a.id}</td>
                    <td className="py-3 font-bold text-sm">{a.name}</td>
                    <td className="py-3">{a.genre}</td>
                    <td className="py-3">{a.sessions}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                        a.status === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' :
                        'bg-[#f59e0b]/20 text-[#f59e0b]'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      {a.status !== 'approved' && (
                        <button
                          onClick={() => updateArtistStatus(a.id, 'approved')}
                          className="bg-[#10b981] text-[#11100C] px-2 py-0.5 text-[9px] font-bold uppercase"
                        >
                          APPROVE ARTIST
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: EVENTS */}
      {activeTab === 'events' && (
        <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
          <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">
            CONCERT SESSIONS MANAGEMENT
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map(evt => (
              <div key={evt.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-[#C99A2E] font-bold">{evt.id} · {evt.date}</div>
                  <h4 className="font-display text-xl font-bold text-[#E7D5A4] mt-1">{evt.name}</h4>
                  <div className="mt-3 text-xs space-y-1">
                    <div>Cap: <span className="font-bold">{evt.capacity}</span></div>
                    <div>Tickets Sold: <span className="font-bold text-[#10b981]">{evt.sold}</span></div>
                    <div>Revenue: <span className="font-bold text-[#C99A2E]">₹{evt.revenue.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#C99A2E]/20 flex justify-between items-center">
                  <span className="bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 text-[9px] font-bold uppercase">
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
