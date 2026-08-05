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

  // Core navigation categories in order:
  // About -> Sessions -> Archive -> Crew -> Collaborate -> Private -> Diary -> Inner Circle -> Contact
  const navCategories = [
    {
      title: 'About',
      path: '/about',
      items: [
        { label: 'Why Tangy', path: '/about#manifesto' },
        { label: 'Chronology', path: '/about#history' },
        { label: 'Tangy Team', path: '/about#founders' },
        { label: 'Media Highlights', path: '/media' },
        { label: 'Full Story', path: '/about' }
      ]
    },
    {
      title: 'Sessions',
      path: '/sessions',
      items: [
        { label: 'Upcoming Sessions', path: '/sessions' },
        { label: 'Concert Culture', path: '/sessions' },
        { label: 'Session Calendar', path: '/sessions' },
        { label: 'Join Waitlist', path: '/sessions' }
      ]
    },
    {
      title: 'Archive',
      path: '/archive',
      items: [
        { label: 'Session Archive', path: '/archive' },
        { label: 'Museum Timeline', path: '/archive' },
        { label: 'Past Memories', path: '/archive' },
        { label: '35mm Contact Sheets', path: '/archive' }
      ]
    },
    {
      title: 'Crew',
      path: '/apply/crew',
      items: [
        { label: 'Volunteer Opportunities', path: '/apply/crew' },
        { label: 'Production Team', path: '/crew' },
        { label: 'Stage Operations', path: '/crew' },
        { label: 'Apply Now', path: '/apply/crew' }
      ]
    },
    {
      title: 'Collaborate',
      path: '/apply/vendors',
      items: [
        { label: 'Vendors', path: '/apply/vendors' },
        { label: 'Sponsors', path: '/apply/sponsors' },
        { label: 'Venue / Host', path: '/apply/venue-host' },
        { label: 'Explore Opportunities', path: '/apply/vendors' }
      ]
    },
    {
      title: 'Private',
      path: '/private-sessions',
      items: [
        { label: 'Private Gatherings', path: '/private-sessions' },
        { label: 'Corporate Events', path: '/private-sessions' },
        { label: 'Weddings', path: '/private-sessions' },
        { label: 'Heritage Experiences', path: '/private-sessions' }
      ]
    },
    {
      title: 'Diary',
      path: '/blogs',
      items: [
        { label: 'Museum Journal', path: '/blogs' },
        { label: 'Recent Stories', path: '/blogs' },
        { label: 'Music Launches', path: '/blogs' },
        { label: 'Behind the Scenes', path: '/blogs' }
      ]
    },
    {
      title: 'Inner Circle',
      path: '/inner-circle',
      items: [
        { label: 'Membership Benefits', path: '/inner-circle' },
        { label: 'Early Access', path: '/inner-circle' },
        { label: 'Secret Events', path: '/inner-circle' },
        { label: 'Join Now', path: '/inner-circle' }
      ]
    },
    {
      title: 'Contact',
      path: '/contact',
      items: [
        { label: 'Location & Map', path: '/contact' },
        { label: 'Email Dispatch', path: 'mailto:hello@tangysessions.com', external: true },
        { label: 'Instagram', path: 'https://instagram.com/tangysessions', external: true },
        { label: 'Visit Tangy', path: '/contact' }
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
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#3A241A]/95 backdrop-blur-md border-b-2 border-[#9E6D35]/40 px-4 md:px-8 py-3 flex items-center justify-between text-[#D9C6A0] font-mono text-[10px] md:text-[11px] tracking-widest shadow-archival">
      
      {/* LEFT: BRAND LOGO */}
      <div 
        onClick={() => handleNav('/')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#7A2B24] group-hover:scale-125 transition-transform" />
        <span className="font-poster text-sm md:text-base tracking-wider text-[#D9C6A0] group-hover:text-[#9E6D35] transition-colors uppercase">
          TANGY SESSIONS
        </span>
      </div>

      {/* CENTER: DESKTOP ARCHIVAL DROPDOWN MENU */}
      <nav className="hidden xl:flex items-center gap-4 xl:gap-5 text-[#D9C6A0]">
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
                className={`py-1 flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest transition-colors hover:text-[#9E6D35] ${isOpen ? 'text-[#9E6D35] font-bold' : 'text-[#D9C6A0]/90'}`}
              >
                <span>{cat.title}</span>
                <span className="text-[8px] opacity-60 transition-transform duration-200 group-hover:rotate-180">▾</span>
              </button>

              {/* Cream Paper Dropdown Menu */}
              <div 
                className={`absolute top-full ${isRightAligned ? 'right-0' : 'left-0'} mt-2 w-52 bg-[#D9C6A0] text-[#35251A] p-3 border-2 border-[#9E6D35]/80 rounded-md shadow-archival z-[150] transition-all duration-200 ease-out origin-top ${
                  isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95'
                }`}
              >
                {/* Paper Fiber Noise Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none rounded-md" />
                
                {/* Dropdown Items List */}
                <div className="relative z-10 flex flex-col gap-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNav(item)}
                      className="group/item flex items-center justify-between p-1.5 rounded-sm hover:bg-[#35251A]/10 text-left font-mono text-[10.5px] font-bold text-[#35251A] hover:text-[#7A2B24] transition-colors"
                    >
                      <span>{item.label}</span>
                      <span className="opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-[#7A2B24]">→</span>
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
          className="border border-[#9E6D35] text-[#9E6D35] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest"
        >
          {isMobileMenuOpen ? 'CLOSE ✕' : 'MENU ☰'}
        </button>
      </div>

      {/* MOBILE ACCORDION NAV DRAWER OVERLAY (<1280px) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[49px] bottom-0 bg-[#3A241A]/98 text-[#D9C6A0] p-6 z-[130] overflow-y-auto flex flex-col gap-4 border-t-2 border-[#9E6D35]/50 xl:hidden">
          <div className="font-mono text-xs text-[#9E6D35] font-bold tracking-[0.25em] uppercase border-b border-[#9E6D35]/30 pb-2">
            NAVIGATION MENU
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {navCategories.map((cat) => {
              const isCatOpen = activeDropdown === cat.title;

              return (
                <div key={cat.title} className="border-b border-[#D9C6A0]/10 pb-2">
                  <button
                    onClick={() => setActiveDropdown(isCatOpen ? null : cat.title)}
                    className="w-full flex justify-between items-center font-mono text-sm font-bold text-[#D9C6A0] py-1 uppercase"
                  >
                    <span>{cat.title}</span>
                    <span className="text-xs text-[#9E6D35]">{isCatOpen ? '▲' : '▼'}</span>
                  </button>

                  {isCatOpen && (
                    <div className="mt-2 pl-4 flex flex-col gap-2 bg-[#D9C6A0] text-[#35251A] p-3 rounded-md border border-[#9E6D35]">
                      {cat.items.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNav(item)}
                          className="text-left font-mono text-xs font-bold text-[#35251A] hover:text-[#7A2B24] py-1 flex justify-between items-center"
                        >
                          <span>{item.label}</span>
                          <span className="text-[#7A2B24]">→</span>
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
