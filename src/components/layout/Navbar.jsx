import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Navbar = ({ onOpenProgramme }) => {
  const navigate = useNavigate();
  const { isAudioEnabled, isMuted, toggleMute } = useAudio();

  const handleNav = (path) => {
    if (path.startsWith('#')) {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        document.querySelector(path)?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-[#11100C]/90 backdrop-blur-md border-b-2 border-[#C99A2E]/40 px-4 md:px-8 py-3 flex items-center justify-between text-[#E7D5A4] font-mono text-[10px] md:text-[11px] tracking-widest shadow-xl">
      
      {/* LEFT: TANGY SESSIONS STAMP */}
      <div 
        onClick={() => handleNav('/')}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <span className="w-2 h-2 rounded-full bg-[#B94717] group-hover:scale-125 transition-transform" />
        <span className="font-display font-bold text-sm md:text-base tracking-tight text-[#E7D5A4] group-hover:text-[#C99A2E] transition-colors">
          TANGY SESSIONS
        </span>
        <span className="text-[#C99A2E] hidden lg:inline opacity-70">
          // HYDERABAD · 1974 ARCHIVE
        </span>
      </div>

      {/* CENTER: QUICK SECTIONS NAV */}
      <nav className="hidden lg:flex items-center gap-5 text-[#E7D5A4]/80">
        <button onClick={() => handleNav('/')} className="hover:text-[#C99A2E] transition-colors uppercase">
          01 COVER
        </button>
        <button onClick={() => handleNav('#manifesto')} className="hover:text-[#C99A2E] transition-colors uppercase">
          02 MANIFESTO
        </button>
        <button onClick={() => handleNav('#sessions')} className="hover:text-[#C99A2E] transition-colors uppercase">
          03 SESSIONS
        </button>
        <button onClick={() => handleNav('/artists')} className="hover:text-[#C99A2E] transition-colors uppercase text-[#C99A2E] font-bold">
          04 ARTISTS ✦
        </button>
        <button onClick={() => handleNav('#archive')} className="hover:text-[#C99A2E] transition-colors uppercase">
          05 ARCHIVE
        </button>
        <button onClick={() => handleNav('#diary')} className="hover:text-[#C99A2E] transition-colors uppercase">
          06 DIARY
        </button>
        <button onClick={() => handleNav('/crew')} className="hover:text-[#C99A2E] transition-colors uppercase text-[#C99A2E] font-bold">
          07 CREW ✦
        </button>
        <button onClick={() => handleNav('/private-sessions')} className="hover:text-[#C99A2E] transition-colors uppercase text-[#C99A2E] font-bold">
          08 PRIVATE ✦
        </button>
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
