import { useState } from 'react';
import { vinylCatalog } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const VinylRecordPlayerModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const [selectedVinyl, setSelectedVinyl] = useState(vinylCatalog[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const toggleSpin = () => {
    playSFX('ticketClick');
    setIsSpinning(!isSpinning);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* 33⅓ RPM TURNTABLE MODAL */}
      <div className="relative w-full max-w-3xl max-h-[90dvh] bg-[#191410] text-[#ecdcaf] border-4 border-[#c2272a] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-6 z-10 overflow-y-auto overflow-x-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#c2272a]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em]">💿 VINYL ARCHIVE // 33⅓ RPM TURNTABLE</span>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* TURNTABLE & VINYL DISK DISPLAY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* SPINNING VINYL RECORD DISK */}
          <div className="flex flex-col items-center gap-3">
            <div 
              onClick={toggleSpin}
              className={`w-64 h-64 rounded-full bg-[#0d0a07] border-8 border-[#191410] shadow-2xl flex items-center justify-center relative cursor-pointer group transition-all duration-700 ${isSpinning ? 'animate-[spin_3s_linear_infinite]' : ''}`}
            >
              {/* VINYL GROOVES */}
              <div className="absolute inset-2 rounded-full border border-white/10 opacity-70" />
              <div className="absolute inset-6 rounded-full border border-white/10 opacity-70" />
              <div className="absolute inset-10 rounded-full border border-white/10 opacity-70" />
              <div className="absolute inset-14 rounded-full border border-white/10 opacity-70" />

              {/* CENTER RECORD LABEL */}
              <div className="w-24 h-24 rounded-full bg-[#c2272a] text-[#ecdcaf] border-4 border-[#191410] flex flex-col items-center justify-center text-center p-1 shadow-md">
                <span className="font-poster text-[9px] leading-tight uppercase">TANGY SESSIONS</span>
                <span className="font-mono text-[7px] text-[#d1a437] font-bold">33⅓ RPM</span>
                <span className="font-mono text-[6px] tracking-widest">{selectedVinyl.catalogNo}</span>
              </div>
            </div>

            <button
              onClick={toggleSpin}
              className="font-mono text-xs font-bold px-4 py-2 bg-[#c2272a] text-[#ecdcaf] border border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
            >
              {isSpinning ? 'STOP TURNTABLE ⏹' : 'DROP NEEDLE & PLAY ▶'}
            </button>
          </div>

          {/* VINYL DETAILS & STORY */}
          <div className="flex flex-col gap-4 text-left">
            <div>
              <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">{selectedVinyl.catalogNo} · {selectedVinyl.speed}</span>
              <h3 className="font-poster text-2xl text-[#ecdcaf]">{selectedVinyl.title}</h3>
              <p className="font-mono text-xs text-[#c2272a] font-bold">{selectedVinyl.artist} ({selectedVinyl.year})</p>
            </div>

            <div className="bg-[#0d0a07] p-3 border border-[#ecdcaf]/20">
              <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">PREVIEW TRACK</span>
              <p className="font-sans text-xs italic text-[#ecdcaf]/90 my-1">{selectedVinyl.previewTrack}</p>
            </div>

            <div className="border-l-2 border-[#d1a437] pl-3 py-1">
              <span className="font-mono text-[9px] font-bold text-[#ecdcaf]/70 uppercase">LINER NOTES</span>
              <p className="font-mono text-xs text-[#ecdcaf]/80 mt-1">{selectedVinyl.story}</p>
            </div>

            {/* TOGGLE LYRICS */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="font-mono text-xs font-bold text-[#d1a437] underline text-left hover:text-[#ecdcaf] transition-colors"
            >
              {showLyrics ? 'HIDE LYRICS ✕' : 'VIEW LYRICS & LINER SHEET 📄'}
            </button>

            {showLyrics && (
              <div className="p-3 bg-[#e9decb] text-[#241a12] font-mono text-xs border border-[#191410] shadow-md animate-fadeIn">
                <p className="whitespace-pre-line font-serif italic">{selectedVinyl.lyrics}</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
