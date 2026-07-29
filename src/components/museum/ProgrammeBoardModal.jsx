import { todaysProgramme } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const ProgrammeBoardModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* VINTAGE THEATRE SPLIT-FLAP PROGRAMME BOARD */}
      <div className="relative w-full max-w-2xl bg-[#191410] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-5 z-10 overflow-hidden">
        
        {/* BOARD HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">📜 TODAY'S PROGRAMME // TIMELINE BOARD</span>
            <span className="w-2 h-2 rounded-full bg-[#c2272a] animate-ping" />
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="font-mono text-[10px] text-[#ecdcaf]/70 uppercase text-center border-b border-[#ecdcaf]/10 pb-2">
          BANSILALPET STEPWELL · HYDERABAD · LIVE RUNNING ORDER
        </div>

        {/* SPLIT-FLAP PROGRAMME ITEMS */}
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {todaysProgramme.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => playSFX('ticketClick')}
              className={`p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-all ${item.status === 'ACTIVE' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf] shadow-md scale-[1.01]' : 'bg-[#0d0a07] text-[#ecdcaf] border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-[#191410] text-[#d1a437] px-2 py-1 border border-[#d1a437]/30">
                  {item.time}
                </span>
                <div>
                  <h4 className="font-poster text-base text-[#ecdcaf] tracking-wide">{item.title}</h4>
                  <p className="font-mono text-xs opacity-80">{item.desc}</p>
                </div>
              </div>

              <span className={`font-mono text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase border w-fit ${item.status === 'ACTIVE' ? 'bg-[#ecdcaf] text-[#191410] border-[#191410]' : item.status === 'COMPLETE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-[#191410] text-[#ecdcaf]/60 border-[#ecdcaf]/20'}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="font-mono text-[9.5px] text-[#ecdcaf]/60 text-center pt-2 border-t border-[#ecdcaf]/20">
          ✦ TIMINGS SUBJECT TO MONSOON & ACOUSTIC SOUNDCHECKS
        </div>

      </div>
    </div>
  );
};
