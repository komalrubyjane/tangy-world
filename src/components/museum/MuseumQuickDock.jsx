import { useAudio } from '../../audio/AudioContext';

export const MuseumQuickDock = ({ 
  onOpenSoundArchive, 
  onOpenVinyl, 
  onOpenProgramme, 
  onOpenShop, 
  onOpenArchive, 
  onOpenPassport, 
  onOpenPostcard 
}) => {
  const { playSFX } = useAudio();

  const handleAction = (cb) => {
    playSFX('ticketClick');
    cb();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[140] bg-[#191410]/95 backdrop-blur-md border-2 border-[#d1a437] px-3 py-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center gap-1.5 max-w-[95vw] overflow-x-auto select-none">
      
      {/* 1. CASSETTE SOUND ARCHIVE */}
      <button
        onClick={() => handleAction(onOpenSoundArchive)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Cassette Sound Archive"
      >
        <span>📻</span>
        <span className="hidden sm:inline">SOUND ARCHIVE</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 2. VINYL TURNTABLE */}
      <button
        onClick={() => handleAction(onOpenVinyl)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Vinyl Turntable"
      >
        <span>💿</span>
        <span className="hidden sm:inline">VINYL</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 3. TODAY'S PROGRAMME */}
      <button
        onClick={() => handleAction(onOpenProgramme)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Today's Programme"
      >
        <span>📜</span>
        <span className="hidden sm:inline">PROGRAMME</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 4. MAGAZINE SPREAD ARCHIVE */}
      <button
        onClick={() => handleAction(onOpenArchive)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Magazine Spread Archive"
      >
        <span>📚</span>
        <span className="hidden sm:inline">ARCHIVE</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 5. GENERAL STORE */}
      <button
        onClick={() => handleAction(onOpenShop)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="General Store"
      >
        <span>🛒</span>
        <span className="hidden sm:inline">STORE</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 6. PASSPORT */}
      <button
        onClick={() => handleAction(onOpenPassport)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Member Stamp Passport"
      >
        <span>Passport</span>
        <span className="hidden sm:inline">PASSPORT</span>
      </button>

      <span className="text-[#d1a437]/40 text-xs">|</span>

      {/* 7. POSTCARD */}
      <button
        onClick={() => handleAction(onOpenPostcard)}
        className="px-2.5 py-1 font-mono text-[9.5px] font-bold tracking-wider text-[#ecdcaf] hover:text-[#d1a437] flex items-center gap-1 hover:scale-105 active:scale-95 transition-all text-nowrap"
        title="Postcard Contact"
      >
        <span>✉️</span>
        <span className="hidden sm:inline">POSTCARD</span>
      </button>

    </div>
  );
};
