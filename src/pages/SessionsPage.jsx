import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { events } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const SessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [filterCity, setFilterCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter(evt => {
    const matchesCity = filterCity === 'ALL' || evt.city === filterCity;
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-16 pb-20 select-none"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <Navbar onOpenProgramme={() => navigate('/programme')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HERO SECTION BANNER */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-6 shadow-[10px_10px_0px_#4c1210] mb-10 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              LIVE CONCERT ARCHIVE // 2016 - 2026
            </span>
            <h1 className="font-poster text-4xl sm:text-5xl text-[#ecdcaf] leading-none my-1">
              SESSIONS PORTAL
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80">
              EXPLORE INTIMATE ACOUSTIC NIGHTS RECORDED LIVE ACROSS HISTORIC STEPWELLS & PALACES.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#d1a437] font-bold">{events.length} TOTAL SESSIONS</span>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-4 shadow-[6px_6px_0px_#191410] mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-mono text-xs font-bold uppercase">FILTER CITY:</span>
            {['ALL', 'HYDERABAD', 'MUMBAI', 'GOA'].map(city => (
              <button
                key={city}
                onClick={() => { playSFX('ticketClick'); setFilterCity(city); }}
                className={`px-3 py-1 font-mono text-[10px] font-bold uppercase border transition-all ${filterCity === city ? 'bg-[#191410] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/30 hover:border-[#191410]'}`}
              >
                {city}
              </button>
            ))}
          </div>

          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH SESSION, VENUE OR ARTIST..."
            className="w-full sm:w-72 p-2 bg-[#ecdcaf] text-[#191410] font-mono text-xs border border-[#191410] outline-none placeholder:text-[#191410]/60"
          />
        </div>

        {/* SESSIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((session, idx) => (
            <div 
              key={session.id}
              className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] shadow-[8px_8px_0px_#191410] flex flex-col justify-between text-left group hover:-translate-y-1 transition-all duration-300 relative"
            >
              {/* TAPE OVERLAY */}
              <div className="absolute -top-3 left-1/3 w-16 h-5 bg-[rgba(255,255,255,0.45)] rotate-[-2deg] border border-black/30 z-20 pointer-events-none" />

              <div>
                <div className="p-3 border-b-2 border-[#191410] flex justify-between items-center font-mono text-[9px] font-bold">
                  <span>ISSUE NO. 00{idx+1}</span>
                  <span className="text-[#c2272a]">{session.city}</span>
                </div>

                <div className="relative aspect-[4/3] border-b-2 border-[#191410] bg-black overflow-hidden">
                  <img 
                    src={session.image} 
                    alt={session.title} 
                    className="w-full h-full object-cover filter contrast-110 group-hover:scale-105 transition-transform duration-500" 
                  />
                  <span className="absolute top-2 left-2 bg-[#191410] text-[#d1a437] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#d1a437]/30">
                    REC · LIVE AT STEPWELL
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <span className="font-mono text-xs font-bold text-[#c2272a]">{session.date} · {session.time}</span>
                  <h3 className="font-poster text-2xl text-[#191410] leading-none my-1">{session.title}</h3>
                  <p className="font-mono text-xs text-[#241a12]/80 font-bold">{session.artist}</p>
                  <p className="font-sans text-xs text-[#241a12]/90 line-clamp-2 mt-1">{session.description}</p>
                </div>
              </div>

              <div className="p-4 pt-0 flex flex-col gap-2">
                <div className="font-mono text-[9px] text-[#241a12]/70 border-t border-dashed border-[#191410]/30 pt-2 flex justify-between">
                  <span>VENUE: {session.venue}</span>
                  <span>{session.capacity} SEATS</span>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { playSFX('ticketClick'); navigate(`/sessions/${session.slug || session.id}`); }}
                    className="flex-1 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-[10px] font-bold tracking-widest uppercase border border-[#191410] hover:bg-[#c2272a] transition-all"
                  >
                    READ STORY →
                  </button>
                  <button
                    onClick={() => { playSFX('ticketClick'); navigate(`/book/${session.slug || session.id}`); }}
                    className="flex-1 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold tracking-widest uppercase border border-[#191410] shadow-[2px_2px_0px_#191410] active:scale-95 transition-all"
                  >
                    BOOK ({session.price})
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
