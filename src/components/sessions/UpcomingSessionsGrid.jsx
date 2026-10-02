import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, isUpcomingEvent } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { PosterEventCard } from '../ui/PosterEventCard';

// The upcoming-sessions listing (venue filter + poster cards) shown on
// /sessions. One implementation; previously duplicated in SessionsPage and
// UpcomingSessionsPage.
const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];
const NOTICE = 'max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#EFE2C0] paperTexture border-2 border-dashed border-[#11100C]';

export const UpcomingSessionsGrid = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { events, loading, error } = useEvents();
  const [filter, setFilter] = useState('ALL');

  const upcoming = events.filter(isUpcomingEvent);
  const shown = upcoming.filter((evt) => filter === 'ALL' || evt.venue?.toUpperCase().includes(filter));

  return (
    <section className="pt-10 pb-16" aria-label="Upcoming sessions">
      <div className="bg-[#181614] border-b-2 border-[#B94717] py-3 px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-mono text-[10px] text-[#E7D5A4]/60 uppercase tracking-widest">
          <span>{shown.length} SESSION{shown.length !== 1 ? 'S' : ''} AVAILABLE</span>
          <span>HYDERABAD // HERITAGE CONCERT SERIES</span>
        </div>
      </div>

      <div className="flex gap-2 justify-center mb-8 overflow-x-auto px-4 pb-1 scrollbar-none">
        {VENUE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`whitespace-nowrap px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] flex-shrink-0 transition-colors ${
              filter === f ? 'bg-[#11100C] text-[#E7D5A4]' : 'bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <div className={NOTICE} role="status">LOADING SESSIONS...</div>}
      {!loading && error && <div className={NOTICE} role="alert">WE COULDN’T LOAD THE SESSIONS RIGHT NOW — PLEASE TRY AGAIN SHORTLY.</div>}
      {!loading && !error && shown.length === 0 && <div className={NOTICE}>NO SESSIONS MATCH THIS FILTER YET — CHECK BACK SOON.</div>}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {!loading && shown.map((evt, idx) => (
          <PosterEventCard
            key={evt.id}
            event={evt}
            idx={idx}
            onBook={() => { playSFX('ticketClick'); navigate(`/sessions/${evt.slug || evt.id}`); }}
          />
        ))}
      </div>
    </section>
  );
};
