import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useUserAuth } from '../../context/UserAuthContext';

// Vintage 1970s/80s CRT television with physical rabbit-ear antennas on top —
// a NEW mobile-only dock item alongside (not replacing) PROFILE. No existing
// Tangy TV image asset exists in the project (checked public/media, icons.svg,
// and src/assets), so this is a project-native inline SVG, no new image asset
// needed, currentColor so it matches the surrounding button's text color.
const RetroTVIcon = ({ className = 'w-[15px] h-[15px]' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* rabbit-ear antennas */}
    <path d="M9 2.5L11.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M15 2.5L12.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="9" cy="2.5" r="0.9" fill="currentColor" />
    <circle cx="15" cy="2.5" r="0.9" fill="currentColor" />
    {/* chunky television body */}
    <rect x="2.5" y="7" width="19" height="12.5" rx="2.2" stroke="currentColor" strokeWidth="1.3" />
    {/* rounded CRT screen */}
    <rect x="4.5" y="9" width="10.5" height="8.5" rx="1.4" stroke="currentColor" strokeWidth="1.1" />
    {/* control knobs */}
    <circle cx="18.3" cy="11.7" r="1" stroke="currentColor" strokeWidth="1" />
    <circle cx="18.3" cy="15" r="1" stroke="currentColor" strokeWidth="1" />
    {/* speaker grille */}
    <path d="M17 17.3h2.6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    {/* feet */}
    <path d="M7.5 19.5L6.5 21.5M16.5 19.5L17.5 21.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const MuseumQuickDock = ({
  onOpenShop,
  onOpenPassport,
  onOpenPostcard
}) => {
  const { playSFX } = useAudio();
  const { isLoggedIn, openLoginModal, user } = useUserAuth();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const handleAction = (cb) => {
    playSFX('ticketClick');
    if (typeof cb === 'function') {
      cb();
    }
  };

  const handlePassportClick = () => {
    playSFX('ticketClick');
    if (isLoggedIn) {
      if (typeof onOpenPassport === 'function') {
        onOpenPassport();
      }
    } else {
      openLoginModal();
    }
  };

  const handleLoginClick = () => {
    playSFX('ticketClick');
    openLoginModal();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[140] bg-[#191410]/95 backdrop-blur-md border-2 border-[#C99A2E] px-2.5 py-2 md:px-4 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.9)] flex items-center gap-1 md:gap-4 max-w-[96vw] overflow-x-auto select-none">
      
      {/* 1. PASSPORT (LOCKED / UNLOCKED) */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('passport')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={handlePassportClick}
          className={`px-1.5 py-1 md:px-2.5 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap ${
            isLoggedIn ? 'text-[#E7D5A4] hover:text-[#C99A2E]' : 'text-[#E7D5A4]/60 hover:text-[#E7D5A4]'
          }`}
        >
          <span className="text-xs">{isLoggedIn ? '🛂' : '🔒'}</span>
          <span>PASSPORT</span>
          {!isLoggedIn && (
            <span className="bg-[#11100C] text-[#C99A2E] text-[7px] px-1 py-0.5 rounded font-mono font-bold tracking-tight border border-[#C99A2E]/40">
              LOCKED
            </span>
          )}
        </button>
        {activeTooltip === 'passport' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#F5E9C9] text-[#11100C] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#C99A2E] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            {isLoggedIn ? 'Digital Member Stamp Book' : 'Login to Unlock Your Passport'}
          </div>
        )}
      </div>

      <span className="text-[#C99A2E]/40 font-mono text-xs font-bold">|</span>

      {/* 2. USER LOGIN / PROFILE — visible on every screen size (restored; a previous */}
      {/* pass had mistakenly replaced this with TV on mobile instead of adding TV     */}
      {/* alongside it) */}
      <div
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('login')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={handleLoginClick}
          className="px-1.5 py-1 md:px-2.5 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#E7D5A4] hover:text-[#C99A2E] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">{isLoggedIn ? '👤' : '🔑'}</span>
          <span>{isLoggedIn ? (user?.name?.split(' ')[0] || 'PROFILE') : 'LOGIN'}</span>
        </button>
        {activeTooltip === 'login' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#F5E9C9] text-[#11100C] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#C99A2E] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            {isLoggedIn ? 'Tangy Listener Account' : 'Customer & Patron Sign In'}
          </div>
        )}
      </div>

      <span className="text-[#C99A2E]/40 font-mono text-xs font-bold md:hidden">|</span>

      {/* 2b. RETRO TV — NEW mobile-only item, additive alongside PROFILE (not a replacement for it) */}
      <div
        className="relative group flex md:hidden items-center"
        onMouseEnter={() => setActiveTooltip('tv')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => playSFX('ticketClick')}
          aria-label="Tangy TV"
          className="px-1.5 py-1 md:px-2.5 font-mono text-[9.5px] font-bold tracking-wider text-[#E7D5A4] hover:text-[#C99A2E] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <RetroTVIcon />
          <span>TV</span>
        </button>
        {activeTooltip === 'tv' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#F5E9C9] text-[#11100C] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#C99A2E] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Tangy TV
          </div>
        )}
      </div>

      <span className="text-[#C99A2E]/40 font-mono text-xs font-bold">|</span>

      {/* 3. KIRANA */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('store')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenShop)}
          className="px-1.5 py-1 md:px-2.5 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#E7D5A4] hover:text-[#C99A2E] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">🛍️</span>
          <span>KIRANA</span>
          <span className="bg-[#C2272A] text-white text-[7px] px-1 py-0.5 rounded font-mono font-bold tracking-tighter ml-0.5 animate-pulse">
            STORE
          </span>
        </button>
        {activeTooltip === 'store' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#F5E9C9] text-[#11100C] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#C99A2E] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Tangy Kirana Merch Shop
          </div>
        )}
      </div>

      <span className="text-[#C99A2E]/40 font-mono text-xs font-bold">|</span>

      {/* 4. POSTCARD */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('postcard')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenPostcard)}
          className="px-1.5 py-1 md:px-2.5 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#E7D5A4] hover:text-[#C99A2E] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">✉️</span>
          <span>POSTCARD</span>
        </button>
        {activeTooltip === 'postcard' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#F5E9C9] text-[#11100C] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#C99A2E] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Send Heritage Postcard Message
          </div>
        )}
      </div>

    </div>
  );
};
