import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../audio/AudioContext';
import { useEvents } from '../../hooks/useEvents';

// The programme board lists the real upcoming sessions (events table), not a
// running order — there is no per-session schedule data to show honestly.
export const ProgrammeBoardModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const navigate = useNavigate();
  const { events, loading } = useEvents();

  if (!isOpen) return null;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !['past', 'cancelled', 'draft'].includes(e.dbStatus) && (!e.rawDate || e.rawDate >= today)).slice(0, 8);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="programme-title">
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      <div className="relative w-full max-w-2xl bg-[#191410] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-5 z-10 overflow-hidden">
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <span id="programme-title" className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">📜 THE PROGRAMME // UPCOMING SESSIONS</span>
          <button onClick={onClose} className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 min-h-[36px] text-[#ecdcaf] hover:bg-[#c2272a] transition-all">
            ✕ CLOSE
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {loading && <p className="font-mono text-xs text-center opacity-70 m-0">Loading the programme…</p>}
          {!loading && upcoming.length === 0 && <p className="font-mono text-xs text-center opacity-70 m-0 py-6">The next sessions will be announced soon.</p>}
          {upcoming.map((evt) => (
            <button
              key={evt.id}
              type="button"
              onClick={() => { playSFX('ticketClick'); onClose(); navigate(`/sessions/${evt.slug || evt.id}`); }}
              className="p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left bg-[#0d0a07] text-[#ecdcaf] border-[#ecdcaf]/20 hover:border-[#d1a437] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d1a437]"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold bg-[#191410] text-[#d1a437] px-2 py-1 border border-[#d1a437]/30 whitespace-nowrap">{evt.date}</span>
                <span>
                  <span className="block font-poster text-base tracking-wide">{evt.title}</span>
                  <span className="block font-mono text-xs opacity-80">{[evt.time, evt.venue].filter(Boolean).join(' · ')}</span>
                </span>
              </span>
              <span className="font-mono text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase border w-fit bg-[#191410] text-[#ecdcaf]/80 border-[#ecdcaf]/20">
                {evt.status === 'SOLD OUT' ? 'SOLD OUT · WAITLIST' : 'BOOK →'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
