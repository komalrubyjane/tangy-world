import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { events, artists } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');

  const handleLogin = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    if (username && password) {
      setIsLoggedIn(true);
    }
  };

  const dashboardTabs = ['Overview', 'Events', 'Bookings', 'Artists', 'Volunteers', 'Private Sessions', 'Payments', 'Analytics', 'Settings'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-16 pb-20 select-none text-left"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <Navbar onOpenProgramme={() => navigate('/programme')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {!isLoggedIn ? (
          /* LOGIN SCREEN */
          <div className="w-full max-w-md mx-auto bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[12px_12px_0px_#4c1210] my-12">
            <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest block mb-1">RESTRICTED ACCESS</span>
            <h1 className="font-poster text-3xl text-[#191410] mb-6">ADMIN CONTROL DESK</h1>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="USERNAME"
                className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />

              <button
                type="submit"
                className="py-3.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all"
              >
                LOGIN TO DASHBOARD →
              </button>
            </form>
          </div>
        ) : (
          /* FULL DASHBOARD VIEW */
          <div className="flex flex-col gap-8">
            
            {/* HEADER */}
            <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-6 shadow-[10px_10px_0px_#4c1210] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">
                  ADMINISTRATOR DASHBOARD // HYDERABAD ARCHIVE
                </span>
                <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] leading-none my-1">
                  SYSTEM OVERVIEW & CONTROL
                </h1>
                <span className="font-mono text-xs text-[#d1a437]">Logged in as: {username}</span>
              </div>

              <button
                onClick={() => setIsLoggedIn(false)}
                className="px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf]"
              >
                LOGOUT ✕
              </button>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex gap-2 overflow-x-auto bg-[#e9decb] p-3 border-2 border-[#191410] shadow-md">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { playSFX('ticketClick'); setActiveTab(tab); }}
                  className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border text-nowrap transition-all ${activeTab === tab ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/30 hover:border-[#191410]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT AREA */}
            <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[8px_8px_0px_#191410]">
              <h3 className="font-poster text-2xl text-[#ecdcaf] mb-4">{activeTab.toUpperCase()} PANEL</h3>

              {activeTab === 'Overview' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-4 bg-[#0d0a07] border border-[#d1a437]/30">
                    <span className="text-[#ecdcaf]/60 block text-[9px]">TOTAL BOOKINGS</span>
                    <span className="font-poster text-2xl text-[#d1a437]">1,482</span>
                  </div>
                  <div className="p-4 bg-[#0d0a07] border border-[#d1a437]/30">
                    <span className="text-[#ecdcaf]/60 block text-[9px]">TOTAL REVENUE</span>
                    <span className="font-poster text-2xl text-[#c2272a]">₹11,85,600</span>
                  </div>
                  <div className="p-4 bg-[#0d0a07] border border-[#d1a437]/30">
                    <span className="text-[#ecdcaf]/60 block text-[9px]">ACTIVE ARTISTS</span>
                    <span className="font-poster text-2xl text-[#ecdcaf]">{artists.length}</span>
                  </div>
                  <div className="p-4 bg-[#0d0a07] border border-[#d1a437]/30">
                    <span className="text-[#ecdcaf]/60 block text-[9px]">VOLUNTEER CREW</span>
                    <span className="font-poster text-2xl text-emerald-400">64</span>
                  </div>
                </div>
              )}

              {activeTab === 'Events' && (
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {events.map((evt) => (
                    <div key={evt.id} className="p-3 bg-[#0d0a07] border border-[#ecdcaf]/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-poster text-base text-[#ecdcaf]">{evt.title}</h4>
                        <span className="text-[#ecdcaf]/60">{evt.date} · {evt.venue}</span>
                      </div>
                      <span className="text-[#d1a437] font-bold">{evt.status} ({evt.capacity} SEATS)</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab !== 'Overview' && activeTab !== 'Events' && (
                <div className="p-8 bg-[#0d0a07] text-[#ecdcaf]/70 font-mono text-xs border border-[#ecdcaf]/20 text-center">
                  ✦ {activeTab.toUpperCase()} DATA MANAGEMENT SYSTEM ACTIVE AND SYNCED WITH REALTIME DATABASE.
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      <Footer />
    </motion.div>
  );
};
