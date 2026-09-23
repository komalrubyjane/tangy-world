import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { PosterEventCard } from '../../components/ui/PosterEventCard';

const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];

export const UpcomingSessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const { events, loading: eventsLoading } = useEvents();
  const [filter, setFilter] = useState('ALL');

  const upcomingEvents = events.filter((e) => e.dbStatus !== 'past');
  const filteredEvents = upcomingEvents.filter(evt => {
    if (filter === 'ALL') return true;
    return evt.venue?.toUpperCase().includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#211915] text-[#E7D5A4] font-mono selection:bg-[#181614] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">
        <div className="relative z-10">
          <a href="/sessions" className="font-mono text-[10px] text-[#E7D5A4]/70 tracking-widest uppercase hover:text-[#E7D5A4] transition-colors">← BACK TO SESSIONS</a>
          <span className="font-mono text-xs text-[#E7D5A4]/80 tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            TANGY SESSIONS PROGRAMMING // 2026 CALENDAR
          </span>
          <h1 className="display text-5xl sm:text-8xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-4">
            UPCOMING<br/>SESSIONS
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#11100C] py-3 sm:py-4 uppercase">
            EVERY CONFIRMED SESSION ON THE 2026 CALENDAR, BOOKABLE DIRECTLY FROM THIS PAGE.
          </p>
        </div>
      </section>

      <section className="pt-10 pb-16">
        <div className="bg-[#181614] border-b-2 border-[#B94717] py-3 px-4 sm:px-6 mb-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center font-mono text-[10px] text-[#E7D5A4]/60 uppercase tracking-widest">
            <span>{filteredEvents.length} SESSION{filteredEvents.length !== 1 ? 'S' : ''} AVAILABLE</span>
            <span>HYDERABAD // HERITAGE CONCERT SERIES</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-8 overflow-x-auto px-4 pb-1 scrollbar-none">
          {VENUE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] flex-shrink-0 transition-colors ${
                filter === f ? 'bg-[#11100C] text-[#E7D5A4]' : 'bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {eventsLoading && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#EFE2C0] paperTexture border-2 border-dashed border-[#11100C]">
            LOADING SESSIONS...
          </div>
        )}

        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#EFE2C0] paperTexture border-2 border-dashed border-[#11100C]">
            NO SESSIONS MATCH THIS FILTER YET — CHECK BACK SOON.
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {!eventsLoading && filteredEvents.map((evt, idx) => (
            <PosterEventCard
              key={evt.id}
              event={evt}
              idx={idx}
              onBook={() => { playSFX('ticketClick'); navigate(`/book/${evt.slug || evt.id}`); }}
            />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
