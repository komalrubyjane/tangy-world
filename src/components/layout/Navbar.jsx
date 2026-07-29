import { Link, useLocation } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Navbar = ({ onOpenProgramme }) => {
  const { isAudioEnabled, isMuted, toggleMute } = useAudio();
  const location = useLocation();

  const navLinks = [
    { label: "01 COVER", path: "/" },
    { label: "02 MANIFESTO", path: "/manifesto" },
    { label: "03 SESSIONS", path: "/sessions" },
    { label: "04 ARTISTS", path: "/artists" },
    { label: "05 ARCHIVE", path: "/archive" },
    { label: "06 VINYL", path: "/vinyl" },
    { label: "07 HERITAGE", path: "/heritage" },
    { label: "08 DIARY", path: "/diary" },
    { label: "09 CREW", path: "/crew" },
    { label: "10 FOUNDERS", path: "/founders" },
    { label: "11 PRIVATE", path: "/private" },
    { label: "12 CONTACT", path: "/contact" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#11100C]/90 backdrop-blur-md border-b-2 border-[#C99A2E]/40 px-4 md:px-8 py-3 flex items-center justify-between text-[#E7D5A4] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* LEFT: TANGY SESSIONS STAMP */}
      <Link 
        to="/"
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="w-2 h-2 rounded-full bg-[#B94717] group-hover:scale-125 transition-transform" />
        <span className="font-display font-bold text-sm md:text-base tracking-tight text-[#E7D5A4] group-hover:text-[#C99A2E] transition-colors">
          TANGY SESSIONS
        </span>
        <span className="text-[#C99A2E] hidden xl:inline opacity-70">
          // HYDERABAD · 1974 ARCHIVE
        </span>
      </Link>

      {/* CENTER: QUICK MULTI-PAGE NAVIGATION */}
      <nav className="hidden lg:flex items-center gap-4 text-[#E7D5A4]/80 overflow-x-auto">
        {navLinks.slice(0, 8).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`hover:text-[#C99A2E] transition-colors uppercase ${location.pathname === link.path ? 'text-[#C99A2E] font-bold border-b border-[#C99A2E]' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* RIGHT: SOUND SYSTEM & PROGRAMME BUTTONS */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleMute}
          className="border border-[#E7D5A4]/40 bg-[#41261B]/60 hover:bg-[#C99A2E] hover:text-[#11100C] px-2.5 py-1 transition-colors font-bold uppercase flex items-center gap-1.5"
        >
          <span className="opacity-70 hidden sm:inline">SOUND</span>
          <span>{!isAudioEnabled || isMuted ? "[ OFF ]" : "[ ON ● ]"}</span>
        </button>

        <button 
          onClick={onOpenProgramme}
          className="btn-ticket py-1 px-3 text-[10px] shadow-none hover:shadow-xs"
        >
          PROGRAMME ✦
        </button>
      </div>

    </header>
  );
};
