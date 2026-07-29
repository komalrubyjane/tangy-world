import { NavLink, Link } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Navbar = () => {
  const { isAudioEnabled, isMuted, toggleMute } = useAudio();

  const navLinks = [
    { label: "01 COVER", path: "/" },
    { label: "02 MANIFESTO", path: "/about" },
    { label: "03 SESSIONS", path: "/sessions" },
    { label: "04 ARTISTS", path: "/artists" },
    { label: "05 CREW", path: "/crew" },
    { label: "06 ARCHIVE", path: "/archive" },
    { label: "07 PROGRAMME", path: "/programme" },
    { label: "08 VINYL", path: "/vinyl" },
    { label: "09 DIARY", path: "/diary" },
    { label: "10 PRIVATE", path: "/private-sessions" },
    { label: "11 STORE", path: "/store" },
    { label: "12 ADMIN", path: "/admin" }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#11100C]/90 backdrop-blur-md border-b-2 border-[#C99A2E]/40 px-4 md:px-6 py-3 flex items-center justify-between text-[#E7D5A4] font-mono text-[10px] tracking-widest shadow-xl">
      
      {/* LEFT: TANGY SESSIONS STAMP */}
      <Link 
        to="/"
        className="flex items-center gap-2 group cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-[#B94717] group-hover:scale-125 transition-transform" />
        <span className="font-display font-bold text-sm md:text-base tracking-tight text-[#E7D5A4] group-hover:text-[#C99A2E] transition-colors">
          TANGY SESSIONS
        </span>
        <span className="text-[#C99A2E] hidden xl:inline opacity-70">
          // HYDERABAD · 1974 ARCHIVE
        </span>
      </Link>

      {/* CENTER: MULTI-PAGE ROUTE NAVIGATION LINKS */}
      <nav className="hidden xl:flex items-center gap-3.5 text-[#E7D5A4]/80">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => 
              `hover:text-[#C99A2E] transition-colors uppercase py-1 ${isActive ? 'text-[#C99A2E] font-bold border-b border-[#C99A2E]' : ''}`
            }
          >
            {link.label}
          </NavLink>
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

        <Link 
          to="/programme"
          className="btn-ticket py-1 px-3 text-[10px] shadow-none hover:shadow-xs uppercase"
        >
          PROGRAMME ✦
        </Link>
      </div>

    </header>
  );
};
