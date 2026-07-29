import { digitalPassportStamps } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const DigitalPassportModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* TANGY MEMBER PASSPORT STAMP BOOK */}
      <div className="relative w-full max-w-2xl bg-[#3c0f0e] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[14px_14px_0px_#191410] flex flex-col gap-5 z-10 overflow-hidden">
        
        {/* PASSPORT COVER HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">Passport PASSPORT // MEMBER STAMP BOOK</span>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* MEMBER ID CARD */}
        <div className="bg-[#191410] p-4 border-2 border-[#d1a437] shadow-md flex items-center gap-4 text-left">
          <div className="w-16 h-16 bg-[#ecdcaf] text-[#191410] rounded-full border-2 border-[#c2272a] flex flex-col items-center justify-center text-center">
            <span className="font-poster text-lg font-bold">TS</span>
            <span className="font-mono text-[7px] font-bold">HYD</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-[#d1a437] font-bold tracking-widest uppercase">PASSPORT NO: TS-MEMBER-901</span>
            <h3 className="font-poster text-xl text-[#ecdcaf]">TANGY HERITAGE PASS</h3>
            <span className="font-mono text-xs text-[#ecdcaf]/80">Status: Verified Resident Listener</span>
          </div>
        </div>

        {/* SESSION STAMPS GRID */}
        <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {digitalPassportStamps.map((stamp) => (
            <div 
              key={stamp.id}
              onClick={() => playSFX('ticketClick')}
              className={`p-3 border-2 flex flex-col items-center text-center gap-1 transition-all ${stamp.active ? 'bg-[#e9decb] text-[#241a12] border-[#191410] rotate-[-2deg] shadow-md' : 'bg-[#191410] text-[#ecdcaf]/40 border-[#ecdcaf]/20 opacity-60'}`}
            >
              <span className="font-mono text-[8px] font-bold text-[#c2272a] uppercase">{stamp.stampNo}</span>
              <h4 className="font-poster text-sm leading-tight uppercase my-0.5">{stamp.title}</h4>
              <span className="font-mono text-[9px] opacity-80">{stamp.date} · {stamp.location}</span>
              {stamp.active ? (
                <span className="font-mono text-[8px] font-black text-emerald-800 border border-emerald-800 px-2 py-0.5 mt-1 uppercase">
                  ✓ STAMPED
                </span>
              ) : (
                <span className="font-mono text-[8px] font-bold text-[#ecdcaf]/40 border border-[#ecdcaf]/20 px-2 py-0.5 mt-1 uppercase">
                  LOCKED
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="font-mono text-[9.5px] text-[#ecdcaf]/60 text-center pt-2 border-t border-[#ecdcaf]/20">
          ✦ SHOW YOUR PASSPORT STAMPS AT THE ENTRY DESK FOR EXCLUSIVE POSTERS & DISPATCH CODES
        </div>

      </div>
    </div>
  );
};
