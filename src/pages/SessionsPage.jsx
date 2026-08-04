import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { events } from '../data/mockData';
import { useNavigate } from 'react-router-dom';

export const SessionsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');

  const filteredEvents = events.filter(evt => {
    if (filter === 'ALL') return true;
    return evt.venue?.toUpperCase().includes(filter);
  });

  return (
    <div className="min-h-screen bg-[#B94717] text-[#E7D5A4] font-mono selection:bg-[#11100C] selection:text-[#E7D5A4]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">
        <span className="font-mono text-xs text-[#E7D5A4] tracking-[0.35em] uppercase font-bold mb-3 block">
          TANGY SESSIONS PROGRAMMING // 1974 CALENDAR
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          ALL SESSIONS & CONCERTS
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#11100C] py-4 uppercase">
          EXPLORE CURRENT SESSIONS, FUTURE PROGRAMMING, AND HERITAGE CONCERT CULTURE IN HYDERABAD.
        </p>

        {/* VENUE FILTERS */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['ALL', 'STEPWELL', 'HAVELI', 'COURTYARD'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest border-2 border-[#11100C] transition-colors ${
                filter === f ? 'bg-[#11100C] text-[#E7D5A4]' : 'bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* SESSIONS GRID */}
      <section className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEvents.map((evt, idx) => (
          <div key={evt.id} className="bg-[#E7D5A4] text-[#11100C] p-6 border-4 border-[#11100C] shadow-[15px_15px_0px_#11100C] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center font-mono text-[9.5px] font-bold text-[#B94717] border-b-2 border-[#11100C] pb-2 mb-4 uppercase">
                <span>TICKET #TK-1974-00{idx+1}</span>
                <span>{evt.date}</span>
              </div>

              <div className="w-full aspect-[4/3] bg-black border-2 border-[#11100C] overflow-hidden mb-4">
                <img src={evt.image} alt={evt.title} className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500" />
              </div>

              <h3 className="display text-3xl text-[#11100C] leading-none mb-2">{evt.title}</h3>
              <p className="font-mono text-xs font-bold text-[#B94717] mb-2">{evt.venue}</p>
              <p className="font-mono text-xs text-[#11100C]/80 mb-6">{evt.time} · {evt.tags?.join(', ')}</p>
            </div>

            <button
              onClick={() => navigate(`/book/${evt.slug || evt.id}`)}
              className="btn-ticket w-full text-center text-xs font-mono font-bold uppercase !bg-[#11100C] !text-[#E7D5A4] hover:!bg-[#B94717]"
            >
              BOOK TICKETS →
            </button>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
};
