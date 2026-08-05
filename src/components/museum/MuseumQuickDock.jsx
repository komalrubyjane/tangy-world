import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';

export const MuseumQuickDock = ({ 
  onOpenShop, 
  onOpenPassport, 
  onOpenPostcard 
}) => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [activeTooltip, setActiveTooltip] = useState(null);

  const handleAction = (cb) => {
    playSFX('ticketClick');
    if (typeof cb === 'function') {
      cb();
    }
  };

  const handleLoginNav = () => {
    playSFX('ticketClick');
    navigate('/artist/login');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[140] bg-[#4B2D22]/95 backdrop-blur-md border-2 border-[#9E6D35] px-4 py-2 rounded-full shadow-archival flex items-center gap-2 md:gap-4 max-w-[96vw] overflow-x-auto select-none">
      
      {/* 1. PASSPORT */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('passport')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenPassport)}
          className="px-2.5 py-1 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#D9C6A0] hover:text-[#9E6D35] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">🛂</span>
          <span>PASSPORT</span>
        </button>
        {activeTooltip === 'passport' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#D9C6A0] text-[#35251A] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#9E6D35] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Digital Member Stamp Book
          </div>
        )}
      </div>

      <span className="text-[#9E6D35]/40 font-mono text-xs font-bold">|</span>

      {/* 2. LOGIN */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('login')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={handleLoginNav}
          className="px-2.5 py-1 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#D9C6A0] hover:text-[#9E6D35] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">🔑</span>
          <span>LOGIN</span>
        </button>
        {activeTooltip === 'login' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#D9C6A0] text-[#35251A] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#9E6D35] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Artist & Crew Portal Access
          </div>
        )}
      </div>

      <span className="text-[#9E6D35]/40 font-mono text-xs font-bold">|</span>

      {/* 3. STORE (WITH COMING SOON BADGE) */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('store')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenShop)}
          className="px-2.5 py-1 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#D9C6A0] hover:text-[#9E6D35] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">🛍️</span>
          <span>STORE</span>
          <span className="bg-[#7A2B24] text-[#D9C6A0] text-[7px] px-1 py-0.5 rounded font-mono font-bold tracking-tighter ml-0.5 animate-pulse">
            COMING SOON
          </span>
        </button>
        {activeTooltip === 'store' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#D9C6A0] text-[#35251A] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#9E6D35] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Official Tangy Merchandise [Coming Soon]
          </div>
        )}
      </div>

      <span className="text-[#9E6D35]/40 font-mono text-xs font-bold">|</span>

      {/* 4. POSTCARD */}
      <div 
        className="relative group flex items-center"
        onMouseEnter={() => setActiveTooltip('postcard')}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          onClick={() => handleAction(onOpenPostcard)}
          className="px-2.5 py-1 font-mono text-[9.5px] md:text-[10.5px] font-bold tracking-wider text-[#D9C6A0] hover:text-[#9E6D35] flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all text-nowrap"
        >
          <span className="text-xs">✉️</span>
          <span>POSTCARD</span>
        </button>
        {activeTooltip === 'postcard' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#D9C6A0] text-[#35251A] font-mono text-[8.5px] font-bold px-2 py-1 rounded border border-[#9E6D35] shadow-md whitespace-nowrap pointer-events-none animate-fadeIn">
            Send Heritage Postcard Message
          </div>
        )}
      </div>

    </div>
  );
};
