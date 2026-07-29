import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';

export const ArtistNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { playSFX } = useAudio();
  
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMobileDrawerOpen(false);
    setShowNotifs(false);
  }, [location.pathname]);

  const notifications = [
    { id: 1, title: 'Event Invitation', msg: 'You are invited to perform at Stepwell Vol. 4', time: '2h ago', unread: true },
    { id: 2, title: 'Slot Confirmed', msg: 'Your performance at Bansilal Stepwell is confirmed', time: '1d ago', unread: true }
  ];

  const handleNav = (path) => {
    playSFX('ticketClick');
    setMobileDrawerOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#191410] border-b-2 border-[#d1a437] px-3 sm:px-6 py-2.5 flex items-center justify-between text-[#ecdcaf] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* BRAND & ROUTE HEADER */}
      <div 
        onClick={() => handleNav('/artist')} 
        className="flex items-center gap-2 cursor-pointer group truncate max-w-[200px] sm:max-w-none"
      >
        <span className="w-2 h-2 rounded-full bg-[#c2272a] group-hover:scale-125 transition-transform flex-shrink-0" />
        <span className="font-poster text-sm sm:text-base md:text-lg tracking-wider text-[#ecdcaf] group-hover:text-[#d1a437] truncate">
          TANGY ARTIST PORTAL
        </span>
        <span className="text-[#d1a437] hidden xl:inline opacity-80">
          // BANSILAL STEPWELL
        </span>
      </div>

      {/* DESKTOP ROUTE LINKS (>=1024px) */}
      <nav className="hidden lg:flex items-center gap-4 xl:gap-5">
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

      {/* RIGHT ACTIONS & MOBILE TOGGLE */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* PUBLIC SITE LINK (DESKTOP) */}
        <button
          onClick={() => handleNav('/')}
          className="hidden sm:inline text-[#ecdcaf]/70 hover:text-[#ecdcaf] font-mono text-[9px] underline uppercase"
        >
          PUBLIC SITE ↗
        </button>

        {user && (
          <>
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-[#0d0a07] border border-[#d1a437] flex items-center justify-center relative hover:bg-[#c2272a] transition-all"
                aria-label="Notifications"
              >
                <span className="text-xs sm:text-sm">🔔</span>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#c2272a] text-[#ecdcaf] text-[7.5px] sm:text-[8px] font-bold flex items-center justify-center border border-[#191410]">
                  2
                </span>
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-64 sm:w-72 bg-[#191410] border-2 border-[#d1a437] p-3 shadow-2xl z-50 text-left flex flex-col gap-2">
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

            {/* LOGOUT (DESKTOP) */}
            <button
              onClick={() => { playSFX('ticketClick'); logout(); navigate('/artist/login'); }}
              className="hidden lg:inline px-3 py-1 bg-[#191410] text-[#ecdcaf] border border-[#ecdcaf]/40 hover:bg-[#c2272a] transition-all uppercase text-[9.5px] font-bold"
            >
              LOGOUT ➔
            </button>
          </>
        )}

        {/* HAMBURGER TOGGLE BUTTON (<1024px) */}
        <button
          onClick={() => { playSFX('ticketClick'); setMobileDrawerOpen(!mobileDrawerOpen); }}
          className="lg:hidden w-8 h-8 bg-[#0d0a07] border border-[#d1a437] text-[#d1a437] font-bold flex items-center justify-center text-base focus:outline-none"
          aria-label="Toggle mobile menu"
        >
          {mobileDrawerOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY (<1024px) */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed top-[45px] left-0 right-0 bottom-0 bg-[#191410]/95 backdrop-blur-md z-[150] border-t-2 border-[#d1a437] p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
          
          <div className="flex flex-col gap-4 font-mono text-xs font-bold text-left">
            <span className="text-[9px] text-[#d1a437] tracking-[0.3em] uppercase border-b border-[#d1a437]/30 pb-2">
              ARTIST PORTAL NAVIGATION
            </span>

            <button
              onClick={() => handleNav('/artist')}
              className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
            >
              01 // ARTISTS ROSTER
            </button>

            {user ? (
              <>
                <button
                  onClick={() => handleNav('/artist/dashboard')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/dashboard' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  02 // DASHBOARD
                </button>

                <button
                  onClick={() => handleNav('/artist/profile')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/profile' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  03 // PROFILE & BIO
                </button>

                <button
                  onClick={() => handleNav('/artist/calendar')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/calendar' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  04 // CALENDAR & SCHEDULE
                </button>

                <button
                  onClick={() => handleNav('/artist/media')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/media' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  05 // MEDIA MANAGER
                </button>

                <button
                  onClick={() => handleNav('/artist/settings')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/settings' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  06 // SETTINGS
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/artist/login')}
                  className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${location.pathname === '/artist/login' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}
                >
                  LOGIN TO PORTAL
                </button>

                <button
                  onClick={() => handleNav('/artist/register')}
                  className="p-3 text-left bg-[#c2272a] text-[#ecdcaf] uppercase font-bold border border-[#191410]"
                >
                  APPLY AS ARTIST →
                </button>
              </>
            )}
          </div>

          {/* BOTTOM DRAWER FOOTER */}
          <div className="flex flex-col gap-3 border-t border-[#ecdcaf]/20 pt-4 mt-6">
            <button
              onClick={() => handleNav('/')}
              className="w-full p-3 bg-[#0d0a07] text-[#ecdcaf]/80 hover:text-[#ecdcaf] border border-[#ecdcaf]/30 font-mono text-xs font-bold uppercase text-center"
            >
              RETURN TO PUBLIC SITE ↗
            </button>

            {user && (
              <button
                onClick={() => { playSFX('ticketClick'); logout(); navigate('/artist/login'); setMobileDrawerOpen(false); }}
                className="w-full p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase text-center border border-[#191410]"
              >
                LOGOUT SESSION ➔
              </button>
            )}
          </div>

        </div>
      )}

    </header>
  );
};
