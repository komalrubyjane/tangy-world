import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useUserAuth } from '../../context/UserAuthContext';

// Vintage 1970s/80s CRT television with physical rabbit-ear antennas on top —
// a dock item alongside (not replacing) PROFILE, shown on every screen size.
// No existing Tangy TV image asset exists in the project (checked
// public/media, icons.svg, and src/assets), so this is a project-native
// inline SVG, no new image asset needed, currentColor so it matches the
// surrounding button's text color.
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

// Tiny monochrome line icons (currentColor) — replace the colour emoji so
// the dock reads as a printed control strip rather than a chat toolbar.
const Glyph = ({ d, className = 'w-[13px] h-[13px]' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const ICONS = {
  lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  passport: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l2 2" /></>,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-4 4-5.5 7-5.5s5.8 1.5 7 5.5" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  mail: <><rect x="3" y="6" width="18" height="12" rx="1" /><path d="M3 7l9 6 9-6" /></>,
};

export const MuseumQuickDock = ({
  onOpenShop,
  onOpenPassport,
  onOpenPostcard,
  onOpenTV
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
    <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[140] bg-[#181614] border border-[#C89D35]/55 outline outline-1 outline-[#181614] px-1 py-1 sm:px-2 sm:py-1.5 md:px-3 rounded-[3px] shadow-[0_6px_18px_rgba(0,0,0,0.45)] flex items-center justify-between sm:justify-start gap-0 sm:gap-1 md:gap-3 w-[calc(100vw-24px)] max-w-[420px] sm:w-auto sm:max-w-[96vw] select-none">
      
      {/* 1. PASSPORT (LOCKED / UNLOCKED) */}
      <div 
        className="relative group flex items-center flex-1 sm:flex-none"
        onMouseEnter={() => setActiveTooltip('passport')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={handlePassportClick}
          className={`flex-1 sm:flex-none justify-center px-1 py-1 sm:px-1.5 md:px-2.5 font-mono text-[9px] sm:text-[9.5px] md:text-[10.5px] font-medium tracking-[0.04em] sm:tracking-[0.12em] flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-h-[44px] sm:min-h-[36px] transition-colors text-nowrap ${
            isLoggedIn ? 'text-[#E7D5A4] hover:text-[#C99A2E]' : 'text-[#E7D5A4]/60 hover:text-[#E7D5A4]'
          }`}
        >
          <Glyph d={isLoggedIn ? ICONS.passport : ICONS.lock} />
          <span>PASSPORT</span>
          {!isLoggedIn && (
            <span className="hidden sm:inline text-[#C99A2E] text-[7px] px-1 py-0.5 font-mono font-medium tracking-[0.08em] border border-[#C99A2E]/40">
              LOCKED
            </span>
          )}
        </button>
        {activeTooltip === 'passport' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#EFE2C0] text-[#181614] font-mono text-[9px] tracking-[0.08em] px-2 py-1 border border-[#181614] shadow-[3px_3px_0_rgba(24,22,20,0.5)] whitespace-nowrap pointer-events-none animate-fadeIn">
            {isLoggedIn ? 'Digital Member Stamp Book' : 'Login to Unlock Your Passport'}
          </div>
        )}
      </div>

      <span className="hidden sm:block w-px h-4 bg-[#C89D35]/30 shrink-0" aria-hidden="true" />

      {/* 2. USER LOGIN / PROFILE — visible on every screen size (restored; a previous */}
      {/* pass had mistakenly replaced this with TV on mobile instead of adding TV     */}
      {/* alongside it) */}
      <div
        className="relative group flex items-center flex-1 sm:flex-none"
        onMouseEnter={() => setActiveTooltip('login')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={handleLoginClick}
          className="flex-1 sm:flex-none justify-center px-1 py-1 sm:px-1.5 md:px-2.5 font-mono text-[9px] sm:text-[9.5px] md:text-[10.5px] font-medium tracking-[0.04em] sm:tracking-[0.12em] text-[#E7D5A4] hover:text-[#C99A2E] flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-h-[44px] sm:min-h-[36px] transition-colors text-nowrap"
        >
          <Glyph d={isLoggedIn ? ICONS.person : ICONS.key} />
          <span>{isLoggedIn ? (user?.name?.split(' ')[0] || 'PROFILE') : 'LOGIN'}</span>
        </button>
        {activeTooltip === 'login' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#EFE2C0] text-[#181614] font-mono text-[9px] tracking-[0.08em] px-2 py-1 border border-[#181614] shadow-[3px_3px_0_rgba(24,22,20,0.5)] whitespace-nowrap pointer-events-none animate-fadeIn">
            {isLoggedIn ? 'Tangy Listener Account' : 'How Are You Joining Tangy?'}
          </div>
        )}
      </div>

      <span className="hidden sm:block w-px h-4 bg-[#C89D35]/30 shrink-0" aria-hidden="true" />

      {/* 2b. RETRO TV — now shown on every screen size, additive alongside PROFILE (not a replacement for it) */}
      <div
        className="relative group flex items-center flex-1 sm:flex-none"
        onMouseEnter={() => setActiveTooltip('tv')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenTV)}
          aria-label="Open Tangy TV"
          className="flex-1 sm:flex-none justify-center px-1 py-1 sm:px-1.5 md:px-2.5 font-mono text-[9px] sm:text-[9.5px] font-medium tracking-[0.04em] sm:tracking-[0.12em] text-[#E7D5A4] hover:text-[#C99A2E] flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-h-[44px] sm:min-h-[36px] transition-colors text-nowrap"
        >
          <RetroTVIcon />
          <span>TV</span>
        </button>
        {activeTooltip === 'tv' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#EFE2C0] text-[#181614] font-mono text-[9px] tracking-[0.08em] px-2 py-1 border border-[#181614] shadow-[3px_3px_0_rgba(24,22,20,0.5)] whitespace-nowrap pointer-events-none animate-fadeIn">
            Watch Tangy Sessions TV
          </div>
        )}
      </div>

      <span className="hidden sm:block w-px h-4 bg-[#C89D35]/30 shrink-0" aria-hidden="true" />

      {/* 3. KIRANA */}
      <div 
        className="relative group flex items-center flex-1 sm:flex-none"
        onMouseEnter={() => setActiveTooltip('store')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenShop)}
          className="flex-1 sm:flex-none justify-center px-1 py-1 sm:px-1.5 md:px-2.5 font-mono text-[9px] sm:text-[9.5px] md:text-[10.5px] font-medium tracking-[0.04em] sm:tracking-[0.12em] text-[#E7D5A4] hover:text-[#C99A2E] flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-h-[44px] sm:min-h-[36px] transition-colors text-nowrap"
        >
          <Glyph d={ICONS.bag} />
          <span>KIRANA</span>
          <span className="hidden sm:inline bg-[#8a2320] text-[#EFE2C0] text-[7px] px-1 py-0.5 font-mono font-medium tracking-[0.08em] ml-0.5 ">
            STORE
          </span>
        </button>
        {activeTooltip === 'store' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#EFE2C0] text-[#181614] font-mono text-[9px] tracking-[0.08em] px-2 py-1 border border-[#181614] shadow-[3px_3px_0_rgba(24,22,20,0.5)] whitespace-nowrap pointer-events-none animate-fadeIn">
            Tangy Kirana Merch Shop
          </div>
        )}
      </div>

      <span className="hidden sm:block w-px h-4 bg-[#C89D35]/30 shrink-0" aria-hidden="true" />

      {/* 4. POSTCARD */}
      <div 
        className="relative group flex items-center flex-1 sm:flex-none"
        onMouseEnter={() => setActiveTooltip('postcard')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenPostcard)}
          className="flex-1 sm:flex-none justify-center px-1 py-1 sm:px-1.5 md:px-2.5 font-mono text-[9px] sm:text-[9.5px] md:text-[10.5px] font-medium tracking-[0.04em] sm:tracking-[0.12em] text-[#E7D5A4] hover:text-[#C99A2E] flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 min-h-[44px] sm:min-h-[36px] transition-colors text-nowrap"
        >
          <Glyph d={ICONS.mail} />
          <span>POSTCARD</span>
        </button>
        {activeTooltip === 'postcard' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#EFE2C0] text-[#181614] font-mono text-[9px] tracking-[0.08em] px-2 py-1 border border-[#181614] shadow-[3px_3px_0_rgba(24,22,20,0.5)] whitespace-nowrap pointer-events-none animate-fadeIn">
            Send Heritage Postcard Message
          </div>
        )}
      </div>

    </div>
  );
};
