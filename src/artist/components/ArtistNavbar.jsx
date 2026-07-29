import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';

export const ArtistNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { playSFX } = useAudio();
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = [
    { id: 1, title: 'Event Invitation', msg: 'You are invited to perform at Stepwell Vol. 4', time: '2h ago', unread: true },
    { id: 2, title: 'Slot Confirmed', msg: 'Your performance at Bansilal Stepwell is confirmed', time: '1d ago', unread: true }
  ];

  const handleNav = (path) => {
    playSFX('ticketClick');
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#191410] border-b-2 border-[#d1a437] px-4 md:px-8 py-3 flex items-center justify-between text-[#ecdcaf] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* BRAND & ROUTE HEADER */}
      <div 
        onClick={() => handleNav('/artist')} 
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="w-2 h-2 rounded-full bg-[#c2272a] group-hover:scale-125 transition-transform" />
        <span className="font-poster text-base md:text-lg tracking-wider text-[#ecdcaf] group-hover:text-[#d1a437]">
          TANGY ARTIST PORTAL
        </span>
        <span className="text-[#d1a437] hidden lg:inline opacity-80">
          // BANSILAL STEPWELL RECRUITMENT
        </span>
      </div>

      {/* CENTER ROUTE LINKS */}
      <nav className="hidden md:flex items-center gap-5">
        <button 
          onClick={() => handleNav('/artist')}
          className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
        >
          ROSTER
        </button>

        {user ? (
          <>
            <button 
              onClick={() => handleNav('/artist/dashboard')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/dashboard' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              DASHBOARD
            </button>

            <button 
              onClick={() => handleNav('/artist/profile')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/profile' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              PROFILE
            </button>

            <button 
              onClick={() => handleNav('/artist/calendar')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/calendar' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              CALENDAR
            </button>

            <button 
              onClick={() => handleNav('/artist/media')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/media' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              MEDIA
            </button>

            <button 
              onClick={() => handleNav('/artist/settings')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/settings' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              SETTINGS
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => handleNav('/artist/login')}
              className={`hover:text-[#d1a437] transition-colors uppercase ${location.pathname === '/artist/login' ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}
            >
              LOGIN
            </button>
            <button 
              onClick={() => handleNav('/artist/register')}
              className="px-3 py-1 bg-[#c2272a] text-[#ecdcaf] font-bold border border-[#191410] shadow-[2px_2px_0px_#ecdcaf] active:scale-95 transition-transform uppercase"
            >
              APPLY NOW
            </button>
          </>
        )}
      </nav>

      {/* RIGHT AUTH ACTIONS & NOTIFICATIONS */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => handleNav('/')}
          className="text-[#ecdcaf]/70 hover:text-[#ecdcaf] font-mono text-[9px] underline uppercase"
        >
          PUBLIC SITE ↗
        </button>

        {user && (
          <>
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-8 h-8 bg-[#0d0a07] border border-[#d1a437] flex items-center justify-center relative hover:bg-[#c2272a] transition-all"
              >
                <span>🔔</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#c2272a] text-[#ecdcaf] text-[8px] font-bold flex items-center justify-center border border-[#191410]">
                  2
                </span>
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-72 bg-[#191410] border-2 border-[#d1a437] p-3 shadow-2xl z-50 text-left flex flex-col gap-2">
                  <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase border-b border-[#d1a437]/30 pb-1">
                    NOTIFICATIONS
                  </span>
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 bg-[#0d0a07] border border-[#ecdcaf]/20 flex flex-col">
                      <span className="font-mono text-xs font-bold text-[#ecdcaf]">{n.title}</span>
                      <span className="font-sans text-[10px] text-[#ecdcaf]/80">{n.msg}</span>
                      <span className="font-mono text-[8px] text-[#d1a437] mt-1">{n.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LOGOUT */}
            <button
              onClick={() => { playSFX('ticketClick'); logout(); navigate('/artist/login'); }}
              className="px-3 py-1 bg-[#191410] text-[#ecdcaf] border border-[#ecdcaf]/40 hover:bg-[#c2272a] transition-all uppercase text-[9.5px] font-bold"
            >
              LOGOUT ➔
            </button>
          </>
        )}
      </div>

    </header>
  );
};
