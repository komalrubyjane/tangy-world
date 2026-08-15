import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  
  // Active dropdown state for desktop & mobile
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef(null);

  // NAVIGATION CATEGORIES (Includes ARTISTS section with distinct Artist Portal links)
  const navCategories = [
    {
      title: 'About',
      path: '/about',
      items: [
        { label: 'Why Tangy', path: '/about#manifesto' },
        { label: 'Chronology', path: '/about#history' },
        { label: 'Tangy Team', path: '/about#founders' },
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

  // Lock body overflow only while mobile menu is open, and restore on close/unmount
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-[#11100C]/95 backdrop-blur-md border-b-2 border-[#C99A2E]/40 px-4 md:px-8 py-3 flex items-center justify-between text-[#E7D5A4] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* LEFT: BRAND LOGO */}
      <div 
        onClick={() => handleNav('/')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#B94717] group-hover:scale-125 transition-transform" />
        <span className="font-display font-bold text-sm md:text-base tracking-tight text-[#E7D5A4] group-hover:text-[#C99A2E] transition-colors uppercase">
          TANGY SESSIONS
        </span>
      </div>

      {/* CENTER: DESKTOP EDITORIAL DROPDOWN MENU */}
      <nav className="hidden xl:flex items-center gap-4 xl:gap-5 text-[#E7D5A4]">
        {navCategories.map((cat, idx) => {
          const isOpen = activeDropdown === cat.title;
          const isRightAligned = idx >= navCategories.length - 2;

          return (
            <div 
              key={cat.title}
              className="relative group"
              onMouseEnter={() => handleMouseEnter(cat.title)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Category Header Button */}
              <button 
                onClick={() => handleNav(cat.path)}
                className={`py-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest transition-colors hover:text-[#C99A2E] ${isOpen ? 'text-[#C99A2E] font-bold' : 'text-[#E7D5A4]/90'}`}
              >
                <span>{cat.title}</span>
                <span className="text-[8px] opacity-60 transition-transform duration-200 group-hover:rotate-180">▾</span>
              </button>

              {/* Cream Paper Dropdown Menu */}
              <div 
                className={`absolute top-full ${isRightAligned ? 'right-0' : 'left-0'} mt-2 w-52 bg-[#F5E9C9] text-[#11100C] p-3 border-2 border-[#C99A2E]/80 rounded-md shadow-[0_15px_35px_rgba(17,16,12,0.9)] z-[10001] transition-all duration-200 ease-out origin-top ${
                  isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95'
                }`}
              >
                {/* Paper Fiber Noise Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-multiply pointer-events-none rounded-md" />
                
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

      {/* RIGHT: MOBILE MENU TOGGLE BUTTON */}
      <div className="xl:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border border-[#C99A2E] text-[#C99A2E] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest active:scale-95 z-[10002] relative"
        >
          {isMobileMenuOpen ? 'CLOSE ✕' : 'MENU ☰'}
        </button>
      </div>

      {/* MOBILE ACCORDION NAV DRAWER OVERLAY (<1280px) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[49px] h-[calc(100dvh-49px)] bg-[#11100C]/98 text-[#E7D5A4] p-6 z-[10000] overflow-y-auto flex flex-col gap-4 border-t-2 border-[#C99A2E]/50 xl:hidden">
          <div className="font-mono text-xs text-[#C99A2E] font-bold tracking-[0.25em] uppercase border-b border-[#C99A2E]/30 pb-2">
            NAVIGATION MENU
          </div>

          <div className="flex flex-col gap-3 mt-2 pb-12">
            {navCategories.map((cat) => {
              const isCatOpen = activeDropdown === cat.title;

              return (
                <div key={cat.title} className="border-b border-[#E7D5A4]/10 pb-2">
                  <div className="w-full flex justify-between items-center py-1">
                    <button
                      onClick={() => handleNav(cat.path)}
                      className="font-mono text-sm font-bold text-[#E7D5A4] hover:text-[#C99A2E] uppercase text-left flex-1"
                    >
                      {cat.title}
                    </button>
                    <button
                      onClick={() => setActiveDropdown(isCatOpen ? null : cat.title)}
                      className="text-xs text-[#C99A2E] px-3 py-1 font-bold"
                    >
                      {isCatOpen ? '▲' : '▼'}
                    </button>
                  </div>

                  {isCatOpen && (
                    <div className="mt-2 pl-4 flex flex-col gap-2 bg-[#F5E9C9] text-[#11100C] p-3 rounded-md border border-[#C99A2E]">
                      {cat.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNav(item)}
                          className="text-left font-mono text-xs font-bold text-[#11100C] hover:text-[#C2272A] py-1.5 flex justify-between items-center border-b border-[#11100C]/10 last:border-0"
                        >
                          <span>{item.label}</span>
                          <span className="text-[#C2272A]">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </header>
  );
};
