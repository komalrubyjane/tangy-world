import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';
import { useUserAuth } from '../../context/UserAuthContext';
import { useLenis } from './LenisProvider';
import { HOME_CHAPTERS } from '../../data/homeChapters';

export const Navbar = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  // Admin Portal visibility must follow the same DB-verified role /admin's own
  // StaffAuthGate checks — never a client-side, self-selectable role with no
  // backend authorization behind it.
  const { user: authUser, isLoggedIn } = useUserAuth();
  const isAdminUser = authUser?.role === 'admin' || authUser?.role === 'super_admin';

  // Active dropdown state for desktop & mobile
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef(null);
  const menuToggleRef = useRef(null);
  const menuPanelRef = useRef(null);
  const lenis = useLenis();
  // Current homepage chapter, broadcast by MicNavRail — shown as a compact
  // indicator in the mobile header (the full 01–10 rail is desktop-only).
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    const onChapter = (e) => setChapter(e.detail);
    window.addEventListener('tangy:chapter', onChapter);
    return () => window.removeEventListener('tangy:chapter', onChapter);
  }, []);

  // NAVIGATION CATEGORIES (Includes ARTISTS section with distinct Artist Portal links)
  const navCategories = [
    {
      title: 'About',
      path: '/about',
      items: [
        { label: 'Why Tangy', path: '/about#manifesto' },
        { label: 'Chronology', path: '/about#history' },
        { label: 'Tangy Team', path: '/about/team' },
        { label: 'Full Story', path: '/about' }
      ]
    },
    {
      title: 'Sessions',
      path: '/sessions',
      items: [
        { label: 'Upcoming Sessions', path: '/sessions#upcoming' },
        { label: 'Concert Culture', path: '/sessions#culture' },
        { label: 'Session Calendar', path: '/sessions#calendar' },
        { label: 'Join Waitlist', path: '/sessions#waitlist' }
      ]
    },
    {
      title: 'Archive',
      path: '/archive',
      items: [
        { label: 'Session Archive', path: '/archive#session-archive' },
        { label: 'Museum Timeline', path: '/archive#museum-timeline' },
        { label: 'Past Memories', path: '/archive#past-memories' },
        { label: '35mm Contact Sheets', path: '/archive#contact-sheets' }
      ]
    },
    {
      title: 'Artists',
      path: '/artist',
      items: [
        { label: 'Artists Directory', path: '/artist' },
        { label: 'Apply as an Artist', path: '/artist/register' },
        { label: 'Artist Login', path: '/artist/login' },
        { label: 'Artist Portal', path: '/artist/dashboard' }
      ]
    },
    {
      title: 'Crew',
      path: '/crew',
      items: [
        { label: 'Volunteer Opportunities', path: '/crew#volunteer' },
        { label: 'Production Team', path: '/crew#production' },
        { label: 'Stage Operations', path: '/crew#stage' },
        { label: 'Apply Now', path: '/apply/crew' }
      ]
    },
    {
      title: 'Collaborate',
      path: '/collaborate',
      items: [
        { label: 'Vendors', path: '/apply/vendors' },
        { label: 'Sponsors', path: '/apply/sponsors' },
        { label: 'Venue / Host', path: '/apply/venue-host' },
        { label: 'Explore Opportunities', path: '/collaborate' }
      ]
    },
    {
      title: 'Private',
      path: '/private-sessions',
      items: [
        { label: 'Private Gatherings', path: '/private-sessions#gatherings' },
        { label: 'Corporate Events', path: '/private-sessions#corporate' },
        { label: 'Weddings', path: '/private-sessions#weddings' },
        { label: 'Heritage Experiences', path: '/private-sessions#heritage' }
      ]
    },
    {
      title: 'Diary',
      path: '/blogs',
      items: [
        { label: 'Museum Journal', path: '/blogs#journal' },
        { label: 'Recent Stories', path: '/blogs#stories' },
        { label: 'Behind the Scenes', path: '/blogs#behind-the-scenes' }
      ]
    },
    {
      title: 'Contact',
      path: '/contact',
      items: [
        { label: 'Location & Map', path: '/contact#location' },
        { label: 'Email Dispatch', path: '/contact#dispatch' },
        { label: 'Instagram', path: 'https://instagram.com/tangysessions', external: true }
      ]
    }
  ];

  const handleNav = (item) => {
    playSFX('ticketClick');
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);

    if (typeof item === 'object' && item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
      return;
    }

    const pathStr = typeof item === 'string' ? item : item.path;
    if (!pathStr) return;

    if (pathStr.includes('#')) {
      const [routePath, hashTag] = pathStr.split('#');
      const targetRoute = routePath || '/';
      if (window.location.pathname !== targetRoute) {
        navigate(pathStr);
      } else {
        try {
          const el = document.getElementById(hashTag) || document.querySelector(`#${hashTag}`);
          el?.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
          document.getElementById(hashTag)?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(pathStr);
    }
  };

  const handleMouseEnter = (title) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    setActiveDropdown(title);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  // While the index panel is open: lock page scroll (body AND Lenis, which
  // otherwise keeps scrolling on wheel), close on Escape, move focus into the
  // panel, and hand focus back to the toggle on close.
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    lenis?.stop();
    const onKey = (e) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => menuPanelRef.current?.querySelector('button')?.focus(), 60);
    const toggle = menuToggleRef.current;
    return () => {
      document.body.style.overflow = '';
      lenis?.start();
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
      toggle?.focus({ preventScroll: true });
    };
  }, [isMobileMenuOpen, lenis]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-[#181614] border-b border-[#EFE2C0]/12 px-4 md:px-8 py-3 flex items-center justify-between text-[#EFE2C0] font-mono text-[10px] md:text-[11px] tracking-widest">
      
      {/* LEFT: BRAND LOGO */}
      <div 
        onClick={() => handleNav('/')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="font-display text-base md:text-lg leading-none tracking-[0.04em] text-[#EFE2C0] group-hover:text-[#C89D35] transition-colors uppercase">
          TANGY SESSIONS
        </span>
      </div>

      {/* CENTER: DESKTOP EDITORIAL DROPDOWN MENU */}
      <nav className="hidden xl:flex items-center text-[#E7D5A4]">
        {navCategories.map((cat, idx) => {
          const isOpen = activeDropdown === cat.title;
          const isRightAligned = idx >= navCategories.length - 2;

          return (
            <div 
              key={cat.title}
              className="relative group flex items-center"
              onMouseEnter={() => handleMouseEnter(cat.title)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Hairline separator between index entries, like a printed contents strip */}
              {idx > 0 && <span className="w-px h-3 bg-[#EFE2C0]/20 mx-4" aria-hidden="true" />}
              {/* Category Header Button */}
              <button 
                onClick={() => handleNav(cat.path)}
                className={`relative py-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest transition-colors hover:text-[#C99A2E] after:absolute after:left-0 after:right-3 after:-bottom-0.5 after:h-px after:bg-current after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 ${isOpen ? 'text-[#C99A2E] after:scale-x-100' : 'text-[#E7D5A4]/90'}`}
              >
                <span>{cat.title}</span>
                <span className="text-[8px] opacity-60 transition-transform duration-200 group-hover:rotate-180">▾</span>
              </button>

              {/* Cream Paper Dropdown Menu */}
              <div 
                className={`absolute top-full ${isRightAligned ? 'right-0' : 'left-0'} mt-3 w-52 bg-[#EFE2C0] text-[#181614] p-2 border border-[#181614] shadow-[4px_4px_0_rgba(24,22,20,0.6)] z-[10001] transition-all duration-200 ease-out origin-top ${
                  isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95'
                }`}
              >
                {/* Dropdown Items List */}
                <div className="relative z-10 flex flex-col gap-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNav(item)}
                      className="group/item flex items-center justify-between p-1.5 rounded-sm hover:bg-[#11100C]/10 text-left font-mono text-[10.5px] font-bold text-[#11100C] hover:text-[#C2272A] transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-[#C2272A]">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* RIGHT: CHAPTER INDICATOR (mobile, homepage) + MENU TOGGLE — Tangy AI lives
          in the floating assistant launcher, so it isn't duplicated here. */}
      <div className="flex items-center gap-2 sm:gap-3">
        {chapter !== null && HOME_CHAPTERS[chapter] && (
          <span className="lg:hidden flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-[#EFE2C0]/75" aria-live="polite">
            <span className="text-[#C89D35] tabular-nums">{String(chapter + 1).padStart(2, '0')}</span>
            <span className="w-3 h-px bg-[#EFE2C0]/30" aria-hidden="true" />
            <span className="hidden min-[360px]:inline max-w-[6.5rem] truncate">{HOME_CHAPTERS[chapter].label}</span>
          </span>
        )}

        {isLoggedIn && (
          <div className="hidden xl:flex items-center gap-2">
            <button
              onClick={() => handleNav('/profile')}
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#E7D5A4]/90 hover:text-[#C99A2E] border border-[#C99A2E]/40 px-2.5 py-1"
            >
              🛂 PASSPORT
            </button>
          </div>
        )}

        {isAdminUser && (
          <button
            onClick={() => handleNav('/admin')}
            className="hidden xl:inline-flex font-mono text-[10px] font-bold uppercase tracking-widest text-[#C99A2E] border border-[#C99A2E] px-2.5 py-1 hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors"
          >
            ADMIN PORTAL
          </button>
        )}

        <div className="xl:hidden">
          <button
            ref={menuToggleRef}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="archive-index-panel"
            className="min-h-[36px] border border-[#C99A2E] text-[#C99A2E] px-3 font-mono text-[10px] font-bold uppercase tracking-widest z-[10002] relative"
          >
            {isMobileMenuOpen ? 'Close ✕' : 'Index ☰'}
          </button>
        </div>
      </div>

      {/* ARCHIVE INDEX PANEL (<1280px) — always mounted so it can animate
          both ways: the sheet unrolls top-down (clip-path) and the numbered
          entries stagger in; closing reverses it. `inert` keeps it out of the
          tab order and away from assistive tech while closed. */}
      <div
        id="archive-index-panel"
        ref={menuPanelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Archive index"
        inert={!isMobileMenuOpen}
        className={`index-panel ${isMobileMenuOpen ? 'is-open' : ''} fixed inset-x-0 top-[49px] h-[calc(100dvh-49px)] theme-hero z-[10000] overflow-y-auto overscroll-contain xl:hidden`}
      >
        <div className="t-container py-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="index-item flex justify-between items-center archiveMetadata text-[#EFE2C0]/60 pb-3 border-b-[3px] border-double border-[#EFE2C0]/25" style={{ '--i': 0 }}>
            <span>Archive index</span>
            <span>Hyderabad · Est. 2016</span>
          </div>

          <ol className="list-none m-0 p-0">
            {navCategories.map((cat, idx) => {
              const isCatOpen = activeDropdown === cat.title;
              return (
                <li key={cat.title} className="index-item border-b border-[#EFE2C0]/12" style={{ '--i': idx + 1 }}>
                  <div className="flex items-center gap-4">
                    <span className="archiveMetadata text-[#C89D35] w-6 shrink-0 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                    <button
                      onClick={() => handleNav(cat.path)}
                      className="flex-1 text-left font-display uppercase text-[clamp(1.9rem,9vw,2.75rem)] leading-none py-3 text-[#EFE2C0] hover:text-[#C89D35] focus-visible:text-[#C89D35]"
                    >
                      {cat.title}
                    </button>
                    <button
                      onClick={() => setActiveDropdown(isCatOpen ? null : cat.title)}
                      aria-expanded={isCatOpen}
                      aria-label={`${isCatOpen ? 'Hide' : 'Show'} ${cat.title} pages`}
                      className="w-11 h-11 shrink-0 flex items-center justify-center font-mono text-lg text-[#C89D35] border border-[#EFE2C0]/15"
                    >
                      {isCatOpen ? '−' : '+'}
                    </button>
                  </div>

                  {isCatOpen && (
                    <ul className="list-none m-0 mb-4 ml-10 p-0 border-l border-[#C89D35]/40">
                      {cat.items.map((item) => (
                        <li key={item.label}>
                          <button
                            onClick={() => handleNav(item)}
                            className="w-full min-h-[44px] pl-4 pr-2 text-left font-mono text-xs uppercase tracking-[0.14em] text-[#EFE2C0]/85 hover:text-[#C89D35] flex justify-between items-center"
                          >
                            <span>{item.label}</span>
                            <span className="text-[#C89D35]" aria-hidden="true">→</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Utilities that live in the desktop header */}
          <div className="index-item flex flex-wrap gap-3 mt-8" style={{ '--i': navCategories.length + 1 }}>
            {isLoggedIn && (
              <button onClick={() => handleNav('/profile')} className="t-btn t-btn-ghost text-[#EFE2C0]">Profile / Passport</button>
            )}
            {isAdminUser && (
              <button onClick={() => handleNav('/admin')} className="t-btn t-btn-ghost text-[#C89D35]">Admin portal</button>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
