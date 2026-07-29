import { useNavigate } from 'react';
import { motion } from 'framer-motion';
import { todaysProgramme, events } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const ProgrammePage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-16 pb-20 select-none text-left"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <Navbar onOpenProgramme={() => navigate('/programme')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* NEWSPAPER EDITORIAL HERO BANNER */}
        <div className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[12px_12px_0px_#191410] mb-12 flex flex-col gap-4 relative">
          <div className="flex justify-between items-center border-b-2 border-[#191410] pb-2 font-mono text-[9.5px] font-bold uppercase">
            <span>THE DAILY DISPATCH — EDITION NO. 840</span>
            <span>HYDERABAD, INDIA</span>
            <span>PRICE: ₹50</span>
          </div>

          <h1 className="font-poster text-4xl sm:text-7xl text-[#191410] leading-none text-center my-2">
            TODAY'S PROGRAMME & TIMETABLE
          </h1>

          <div className="font-mono text-xs text-[#c2272a] font-bold text-center border-y border-dashed border-[#191410]/40 py-1.5 uppercase">
            BANSILALPET STEPWELL · LIVE RUNNING ORDER & TIMINGS
          </div>
        </div>

        {/* TIMETABLE SCHEDULE BOARD */}
        <div className="bg-[#191410] border-4 border-[#d1a437] p-6 shadow-[10px_10px_0px_#4c1210] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-6">
            PROGRAMME SCHEDULE TIMETABLE
          </span>

          <div className="flex flex-col gap-3">
            {todaysProgramme.map((item, idx) => (
              <div 
                key={idx}
                className={`p-4 border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${item.status === 'ACTIVE' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf]' : 'bg-[#0d0a07] text-[#ecdcaf] border-[#ecdcaf]/20'}`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold bg-[#191410] text-[#d1a437] px-3 py-1 border border-[#d1a437]/30">
                    {item.time}
                  </span>
                  <div>
                    <h3 className="font-poster text-xl text-[#ecdcaf]">{item.title}</h3>
                    <p className="font-mono text-xs opacity-80">{item.desc}</p>
                  </div>
                </div>

                <span className={`font-mono text-[9px] font-bold tracking-widest px-3 py-1 uppercase border ${item.status === 'ACTIVE' ? 'bg-[#ecdcaf] text-[#191410] border-[#191410]' : item.status === 'COMPLETE' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-[#191410] text-[#ecdcaf]/60 border-[#ecdcaf]/20'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* UPCOMING SESSIONS CALENDAR */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-4">
            UPCOMING SESSIONS CALENDAR
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[9px] font-bold text-[#c2272a]">{evt.date}</span>
                  <h4 className="font-poster text-xl text-[#191410] my-1">{evt.title}</h4>
                  <p className="font-mono text-xs text-[#241a12]/80">{evt.venue}</p>
                </div>
                <button
                  onClick={() => { playSFX('ticketClick'); navigate(`/book/${evt.slug || evt.id}`); }}
                  className="mt-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-[10px] font-bold uppercase border border-[#191410]"
                >
                  BOOK ({evt.price}) →
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
