import { Link } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const Menu = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();

  const navLinks = [
    { label: "01 COVER (HOME)", path: "/" },
    { label: "02 MANIFESTO", path: "/manifesto" },
    { label: "03 SESSIONS ARCHIVE", path: "/sessions" },
    { label: "04 ARTISTS LINEAGE", path: "/artists" },
    { label: "05 PRINTED ARCHIVE", path: "/archive" },
    { label: "06 VINYL SHELF", path: "/vinyl" },
    { label: "07 HERITAGE VENUES", path: "/heritage" },
    { label: "08 DIARY JOURNAL", path: "/diary" },
    { label: "09 CREW & VOLUNTEERS", path: "/crew" },
    { label: "10 FOUNDERS DESK", path: "/founders" },
    { label: "11 PRIVATE SESSIONS", path: "/private" },
    { label: "12 POSTCARD CONTACT", path: "/contact" }
  ];

  const handleNavClick = () => {
    playSFX('ticketClick');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* MENU DRAWER */}
      <div className="relative w-full max-w-md bg-[#191410] text-[#ecdcaf] border-l-4 border-[#d1a437] p-8 shadow-2xl flex flex-col justify-between overflow-y-auto z-10">
        
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-4">
          <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">📜 PROGRAMME INDEX</span>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        <nav className="flex flex-col gap-3 my-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={handleNavClick}
              className="font-poster text-xl text-[#ecdcaf] hover:text-[#d1a437] border-b border-[#ecdcaf]/10 pb-2 transition-colors text-left"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="font-mono text-[10px] text-[#ecdcaf]/60 text-center uppercase border-t border-[#ecdcaf]/20 pt-4">
          TANGY SESSIONS // HYDERABAD // EST. 2016
        </div>

      </div>
    </div>
  );
};
