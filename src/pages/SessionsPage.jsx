import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { events } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

const VENUE_FILTERS = ['ALL', 'STEPWELL', 'BARADARI', 'COURTYARD'];

export const SessionsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const filteredEvents = events.filter(evt => {
    if (filter === 'ALL') return true;
    return evt.venue?.toUpperCase().includes(filter);
  });

  const STATUS_STYLES = {
    'SOLD OUT': { bg: '#5A120D', text: '#E7D5A4' },
    'AVAILABLE': { bg: '#2D5A1B', text: '#E7D5A4' },
    'ALMOST GONE': { bg: '#B94717', text: '#E7D5A4' },
    'UPCOMING': { bg: '#11100C', text: '#C99A2E' }
  };

  return (
    <div className="min-h-screen bg-[#B94717] text-[#E7D5A4] font-mono selection:bg-[#11100C] selection:text-[#E7D5A4]">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-multiply pointer-events-none" />

        {/* Giant faded year watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.08]">
          <span className="font-display text-[22vw] leading-none text-[#11100C] font-bold">2026</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-xs text-[#E7D5A4]/80 tracking-[0.35em] uppercase font-bold mb-3 block">
            TANGY SESSIONS PROGRAMMING // 2026 CALENDAR
          </span>
          <h1 className="display text-5xl sm:text-8xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-4">
            ALL<br/>SESSIONS
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#11100C] py-3 sm:py-4 uppercase">
            EXPLORE CURRENT SESSIONS, FUTURE PROGRAMMING, AND HERITAGE CONCERT CULTURE IN HYDERABAD.
          </p>

          {/* VENUE FILTERS — scrollable on mobile */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 sm:justify-center sm:flex-wrap scrollbar-none">
            {VENUE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-3 sm:px-4 py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] flex-shrink-0 transition-colors ${
                  filter === f
                    ? 'bg-[#11100C] text-[#E7D5A4]'
                    : 'bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SESSION COUNT BAR */}
      <div className="bg-[#11100C] border-b-2 border-[#B94717] py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-mono text-[10px] text-[#E7D5A4]/60 uppercase tracking-widest">
          <span>{filteredEvents.length} SESSION{filteredEvents.length !== 1 ? 'S' : ''} FOUND</span>
          <span>HYDERABAD // HERITAGE CONCERT SERIES</span>
        </div>
      </div>

      {/* SESSIONS GRID */}
      <section className="py-10 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
        {filteredEvents.length === 0 && (
          <div className="col-span-3 text-center py-20">
            <p className="font-mono text-xs text-[#E7D5A4]/50 uppercase tracking-widest">NO SESSIONS MATCH THIS FILTER.</p>
          </div>
        )}

        {filteredEvents.map((evt, idx) => {
          const statusStyle = STATUS_STYLES[evt.status] || STATUS_STYLES['AVAILABLE'];
          const isSoldOut = evt.status === 'SOLD OUT';

          return (
            <div
              key={evt.id}
              className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] sm:shadow-[12px_12px_0px_#11100C] flex flex-col justify-between overflow-hidden group hover:-translate-y-1 transition-transform duration-200"
            >
              {/* IMAGE */}
              <div className="relative w-full aspect-[4/3] bg-black border-b-4 border-[#11100C] overflow-hidden">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
                />
                {/* Status badge */}
                <div
                  className="absolute top-2 right-2 font-mono text-[9px] px-2 py-1 font-bold uppercase"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {evt.status}
                </div>
                {/* Ticket number overlay */}
                <div className="absolute bottom-2 left-2 bg-[#11100C]/80 text-[#E7D5A4] font-mono text-[8px] px-2 py-0.5 font-bold">
                  TICKET #TK-1974-00{idx + 1}
                </div>
              </div>

              <div className="p-4 sm:p-6 flex flex-col flex-1">
                {/* Date & time row */}
                <div className="flex justify-between items-center font-mono text-[9px] sm:text-[10px] font-bold text-[#B94717] border-b-2 border-[#11100C] pb-2 mb-3 uppercase">
                  <span>{evt.date}</span>
                  <span>{evt.time}</span>
                </div>

                {/* Title */}
                <h3 className="display text-2xl sm:text-3xl text-[#11100C] leading-tight mb-1">{evt.title}</h3>

                {/* Artist */}
                <p className="font-mono text-[10px] sm:text-xs text-[#5A120D] font-bold uppercase mb-1">{evt.artist}</p>

                {/* Venue */}
                <p className="font-mono text-[10px] sm:text-xs font-bold text-[#B94717] mb-2">{evt.venue} · {evt.city}</p>

                {/* Description */}
                <p className="font-mono text-[10px] sm:text-xs text-[#11100C]/75 leading-relaxed mb-4 flex-1">
                  {evt.description}
                </p>

                {/* Tags & Price */}
                <div className="flex justify-between items-center mb-3 font-mono text-[9px] uppercase text-[#11100C]/60">
                  <span>{evt.tags?.slice(0, 2).join(' · ')}</span>
                  <span className="font-bold text-[#B94717]">{evt.price}</span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => !isSoldOut && navigate(`/book/${evt.slug || evt.id}`)}
                  disabled={isSoldOut}
                  className={`w-full py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 transition-colors ${
                    isSoldOut
                      ? 'bg-[#5A120D] text-[#E7D5A4]/60 border-[#5A120D] cursor-not-allowed'
                      : 'bg-[#11100C] text-[#E7D5A4] border-[#11100C] hover:bg-[#B94717] hover:border-[#B94717]'
                  }`}
                >
                  {isSoldOut ? 'SOLD OUT ✗' : 'BOOK TICKETS →'}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* VENUE INFO STRIP */}
      <section className="bg-[#11100C] border-t-8 border-[#B94717] py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold block mb-3">
            HERITAGE SANCTUARIES
          </span>
          <h3 className="display text-3xl sm:text-5xl text-[#E7D5A4] mb-6">WHERE MUSIC LIVES</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
            {[
              { name: 'BANSILALPET STEPWELL', year: '1670 AD', sessions: '14 sessions', location: 'Secunderabad, HYD' },
              { name: 'TARAMATI BARADARI', year: '1680 AD', sessions: '9 sessions', location: 'Ibrahim Bagh, HYD' },
              { name: 'OLD CITY COURTYARD', year: '1890 AD', sessions: '11 sessions', location: 'Charminar Lane, HYD' }
            ].map((v, i) => (
              <div key={i} className="bg-[#1C0E08] border-2 border-[#C99A2E]/40 p-4 sm:p-5">
                <p className="font-mono text-[9px] text-[#C99A2E] font-bold uppercase tracking-wider mb-1">{v.year} · {v.sessions}</p>
                <h4 className="display text-xl text-[#E7D5A4] mb-1 leading-tight">{v.name}</h4>
                <p className="font-mono text-[10px] text-[#E7D5A4]/50 uppercase">{v.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
