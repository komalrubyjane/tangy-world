import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';
import { NotificationBell } from '../../portal/NotificationBell';

// Artist workspace navigation. Sections that live as tabs inside the
// dashboard have their own URLs (/artist/dashboard/<section>).
const ARTIST_NAV = [
  { label: 'Overview', to: '/artist/dashboard', desktop: true },
  { label: 'Calendar', to: '/artist/calendar', desktop: true },
  { label: 'My events', to: '/artist/dashboard/events' },
  { label: 'Requests', to: '/artist/requests', desktop: true },
  { label: 'Requirements', to: '/artist/dashboard/requirements' },
  { label: 'Documents', to: '/artist/dashboard/documents' },
  { label: 'Media', to: '/artist/media', desktop: true },
  { label: 'Messages', to: '/artist/dashboard/messages', desktop: true },
  { label: 'Announcements', to: '/artist/dashboard/announcements' },
  { label: 'Notifications', to: '/artist/dashboard/notifications' },
  { label: 'Profile', to: '/artist/profile', desktop: true },
  { label: 'Settings', to: '/artist/settings', desktop: true },
];

export const ArtistNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { playSFX } = useAudio();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const isActive = (n) => {
    const [path, query] = n.to.split('?');
    if (location.pathname !== path) return false;
    const tab = new URLSearchParams(location.search).get('tab');
    return query ? `tab=${tab}` === query : !tab || tab === 'overview';
  };

  const handleNav = (path) => {
    playSFX('ticketClick');
    setMobileDrawerOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#181614] printNoise border-b-2 border-[#d1a437] px-3 sm:px-6 py-2.5 flex items-center justify-between text-[#ecdcaf] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* BRAND & ROUTE HEADER */}
      <div 
        onClick={() => handleNav('/artist')} 
        className="flex items-center gap-2 cursor-pointer group truncate max-w-[200px] sm:max-w-none"
      >
        <span className="w-2 h-2 rounded-full bg-[#B5532A] group-hover:scale-125 transition-transform flex-shrink-0" />
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
            {ARTIST_NAV.filter((n) => n.desktop).map((n) => (
              <button key={n.label} onClick={() => handleNav(n.to)} aria-current={isActive(n) ? 'page' : undefined}
                className={`hover:text-[#d1a437] transition-colors uppercase ${isActive(n) ? 'text-[#d1a437] font-bold' : 'opacity-80'}`}>
                {n.label}
              </button>
            ))}
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
              onClick={() => handleNav('/artist/apply')}
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
            {/* NOTIFICATION BELL — real notifications (0018), not sample data */}
            <div className="bg-[#0d0a07] border border-[#d1a437]">
              <NotificationBell userId={user.userId} allHref="/artist/dashboard/notifications" />
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
        <div className="lg:hidden fixed top-[45px] left-0 right-0 bottom-0 bg-[#181614]/95 backdrop-blur-md z-[150] border-t-2 border-[#d1a437] p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
          
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
                {ARTIST_NAV.map((n, idx) => (
                  <button key={n.label} onClick={() => handleNav(n.to)} aria-current={isActive(n) ? 'page' : undefined}
                    className={`p-3 text-left border border-[#ecdcaf]/20 uppercase transition-all ${isActive(n) ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]' : 'bg-[#0d0a07] text-[#ecdcaf]'}`}>
                    {String(idx + 2).padStart(2, '0')} // {n.label}
                  </button>
                ))}
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
                  onClick={() => handleNav('/artist/apply')}
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
