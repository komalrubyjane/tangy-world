import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';

const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];

const STATUS_STYLES = {
  'SOLD OUT': { bg: '#5A120D', text: '#E7D5A4' },
  'AVAILABLE': { bg: '#2D5A1B', text: '#E7D5A4' },
  'ALMOST GONE': { bg: '#B94717', text: '#E7D5A4' },
  'UPCOMING': { bg: '#11100C', text: '#C99A2E' }
};

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
    <div className="min-h-screen bg-[#B94717] text-[#E7D5A4] font-mono selection:bg-[#11100C] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-multiply pointer-events-none" />
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
        <div className="bg-[#11100C] border-b-2 border-[#B94717] py-3 px-4 sm:px-6 mb-8">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#E7D5A4] border-2 border-dashed border-[#11100C]">
            LOADING SESSIONS...
          </div>
        )}

        {!eventsLoading && filteredEvents.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center font-mono text-xs font-bold text-[#11100C] bg-[#E7D5A4] border-2 border-dashed border-[#11100C]">
            NO SESSIONS MATCH THIS FILTER YET — CHECK BACK SOON.
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {!eventsLoading && filteredEvents.map((evt, idx) => {
            const statusStyle = STATUS_STYLES[evt.status] || STATUS_STYLES['AVAILABLE'];
            const isSoldOut = evt.status === 'SOLD OUT';
            return (
              <div key={evt.id} className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] sm:shadow-[12px_12px_0px_#11100C] flex flex-col justify-between overflow-hidden group hover:-translate-y-1 transition-transform duration-200">
                <div className="relative w-full aspect-[4/3] bg-black border-b-4 border-[#11100C] overflow-hidden">
                  <img src={evt.image} alt={evt.title} className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute top-2 right-2 font-mono text-[9px] px-2 py-1 font-bold uppercase" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                    {evt.status}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-[#11100C]/80 text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold">
                    TICKET #TK-1974-00{idx + 1}
                  </div>
                </div>
                <div className="p-4 sm:p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center font-mono text-[9px] sm:text-[10px] font-bold text-[#B94717] border-b-2 border-[#11100C] pb-2 mb-3 uppercase">
                    <span>{evt.date}</span>
                    <span>{evt.time}</span>
                  </div>
                  <h3 className="display text-2xl sm:text-3xl text-[#11100C] leading-tight mb-1">{evt.title}</h3>
                  <p className="font-mono text-[10px] sm:text-xs text-[#5A120D] font-bold uppercase mb-1">{evt.artist}</p>
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-[#B94717] mb-2">{evt.venue} · {evt.city}</p>
                  <p className="font-mono text-[10px] sm:text-xs text-[#11100C]/75 leading-relaxed mb-4 flex-1">{evt.description}</p>
                  <div className="flex justify-between items-center mb-3 font-mono text-[9px] uppercase text-[#11100C]/60">
                    <span>{evt.tags?.slice(0, 2).join(' · ')}</span>
                    <span className="font-bold text-[#B94717]">{evt.price}</span>
                  </div>
                  <button
                    onClick={() => { playSFX('ticketClick'); !isSoldOut && navigate(`/book/${evt.slug || evt.id}`); }}
                    disabled={isSoldOut}
                    className={`w-full py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-colors ${
                      isSoldOut ? 'bg-[#5A120D] text-[#E7D5A4]/60 border-[#5A120D] cursor-not-allowed' : 'bg-[#11100C] text-[#E7D5A4] border-[#11100C] hover:bg-[#B94717] hover:border-[#B94717]'
                    }`}
                  >
                    {isSoldOut ? 'SOLD OUT ✗' : 'BOOK TICKETS →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};
