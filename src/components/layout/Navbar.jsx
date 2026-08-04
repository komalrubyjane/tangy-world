import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Navbar = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  
  // Active dropdown state for desktop & mobile
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const leaveTimeoutRef = useRef(null);

  const navCategories = [
    {
      title: 'About',
      items: [
        { label: 'Why Tangy', path: '/about#manifesto' },
        { label: 'Chronology', path: '/about#history' },
        { label: 'Media Highlights', path: '/media' },
        { label: 'Archive Preview', path: '/archive' },
        { label: 'Tangy Team', path: '/about#founders' }
      ]
    },
    {
      title: 'Sessions',
      items: [
        { label: 'Current Sessions', path: '/sessions' },
        { label: 'Future Programming', path: '/sessions' },
        { label: 'Concert Culture', path: '/about' },
        { label: 'Glimpse of the Past', path: '/archive' },
        { label: 'Join Waitlist', path: '/sessions' }
      ]
    },
    {
      title: 'Formats',
      items: [
        { label: 'Heritage Shows', path: '/sessions' },
        { label: 'Glamping', path: '/private-sessions' },
        { label: 'Private Sessions', path: '/private-sessions' },
        { label: 'Corporate', path: '/private-sessions' }
      ]
    },
    {
      title: 'Archive',
      items: [
        { label: 'Session Archive', path: '/archive' },
        { label: 'Videos', path: '/media' },
        { label: 'Photos', path: '/archive' },
        { label: 'Audio', path: '/archive' },
        { label: 'Open Archive', path: '/archive' }
      ]
    },
    {
      title: 'Apply',
      items: [
        { label: 'Artist', path: '/artist/register' },
        { label: 'Crew', path: '/apply/crew' },
        { label: 'Venue / Host', path: '/apply/venue-host' },
        { label: 'Private Sessions', path: '/private-sessions' },
        { label: 'Sponsors', path: '/apply/sponsors' },
        { label: 'Vendors', path: '/apply/vendors' }
      ]
    },
    {
      title: 'Blogs',
      items: [
        { label: 'Tangy Diary', path: '/blogs' },
        { label: 'Show Stories', path: '/blogs' },
        { label: 'Music Launches', path: '/blogs' },
        { label: 'Behind the Scenes', path: '/blogs' },
        { label: 'Opinion Pieces', path: '/blogs' }
      ]
    },
    {
      title: 'Media',
      items: [
        { label: 'Press Coverage', path: '/media' },
        { label: 'Interviews', path: '/media' },
        { label: 'Videos', path: '/media' },
        { label: 'Podcasts', path: '/media' },
        { label: 'Gallery', path: '/archive' }
      ]
    },
    {
      title: 'Contact',
      items: [
        { label: 'Email', path: 'mailto:hello@tangysessions.com', external: true },
        { label: 'Instagram', path: 'https://instagram.com/tangysessions', external: true },
        { label: 'YouTube', path: 'https://youtube.com/tangysessions', external: true },
        { label: 'Visit Us', path: '/contact' }
      ]
    }
  ];

  const handleNav = (item) => {
    playSFX('ticketClick');
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);

    if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
      return;
    }

    const path = item.path || item;
    if (typeof path === 'string' && path.startsWith('#')) {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (typeof path === 'string') {
      navigate(path);
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

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#11100C]/95 backdrop-blur-md border-b-2 border-[#C99A2E]/40 px-4 md:px-8 py-3 flex items-center justify-between text-[#E7D5A4] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* LEFT: SIMPLIFIED BRAND TITLE */}
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
      <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[#E7D5A4]">
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
                className={`py-1 flex items-center gap-1 font-mono text-xs uppercase tracking-widest transition-colors hover:text-[#C99A2E] ${isOpen ? 'text-[#C99A2E] font-bold' : 'text-[#E7D5A4]/90'}`}
              >
                <span>{cat.title}</span>
                <span className="text-[8px] opacity-60 transition-transform duration-200 group-hover:rotate-180">▾</span>
              </button>

              {/* Cream Paper Dropdown Menu */}
              <div 
                className={`absolute top-full ${isRightAligned ? 'right-0' : 'left-0'} mt-2 w-52 bg-[#F5E9C9] text-[#11100C] p-3 border-2 border-[#C99A2E]/80 rounded-md shadow-[0_15px_35px_rgba(17,16,12,0.9)] z-[150] transition-all duration-200 ease-out origin-top ${
                  isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95'
                }`}
              >
                {/* Paper Fiber Noise Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply pointer-events-none rounded-md" />
                
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
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border border-[#C99A2E] text-[#C99A2E] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
        >
          {isMobileMenuOpen ? 'CLOSE ✕' : 'MENU ☰'}
        </button>
      </div>

      {/* MOBILE ACCORDION NAV DRAWER OVERLAY (<1024px) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[49px] bottom-0 bg-[#11100C]/98 text-[#E7D5A4] p-6 z-[130] overflow-y-auto flex flex-col gap-4 border-t-2 border-[#C99A2E]/50 lg:hidden">
          <div className="font-mono text-xs text-[#C99A2E] font-bold tracking-[0.25em] uppercase border-b border-[#C99A2E]/30 pb-2">
            NAVIGATION MENU
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {navCategories.map((cat) => {
              const isCatOpen = activeDropdown === cat.title;

              return (
                <div key={cat.title} className="border-b border-[#E7D5A4]/10 pb-2">
                  <button
                    onClick={() => setActiveDropdown(isCatOpen ? null : cat.title)}
                    className="w-full flex justify-between items-center font-mono text-sm font-bold text-[#E7D5A4] py-1 uppercase"
                  >
                    <span>{cat.title}</span>
                    <span className="text-xs text-[#C99A2E]">{isCatOpen ? '▲' : '▼'}</span>
                  </button>

                  {isCatOpen && (
                    <div className="mt-2 pl-4 flex flex-col gap-2 bg-[#F5E9C9] text-[#11100C] p-3 rounded-md border border-[#C99A2E]">
                      {cat.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNav(item)}
                          className="text-left font-mono text-xs font-bold text-[#11100C] hover:text-[#C2272A] py-1 flex justify-between items-center"
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
