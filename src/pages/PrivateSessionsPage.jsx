import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gallery } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const PrivateSessionsPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [submitted, setSubmitted] = useState(false);

  const packages = [
    { title: "HOUSE SESSIONS", desc: "Intimate living room acoustic performances for 20-50 guests." },
    { title: "CORPORATE EVENTS", desc: "Curated heritage musical evenings for executive summits & brand launches." },
    { title: "HERITAGE VENUES", desc: "Full production inside private forts, stepwells, and ancient havelis." },
    { title: "CAFE PERFORMANCES", desc: "Acoustic coffee house pop-up sessions with vinyl listening stations." },
    { title: "WEDDING MUSIC", desc: "Classical fusion & sufi acoustic arrangements for wedding rituals." },
    { title: "BRAND COLLABORATIONS", desc: "Custom bespoke sonic experiences tailored for luxury brands." }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    setSubmitted(true);
  };

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
        
        {/* HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#315D73] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#315D73] tracking-[0.3em] uppercase">
              PRIVATE CURATION DESK // BESPOKE NIGHTS
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              BRING TANGY TO YOUR SPACE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#ecdcaf]/80 max-w-2xl">
              MAKE THE NIGHT YOUR OWN — PRIVATE GATHERINGS, HERITAGE HAVELIS, AND INTIMATE BRAND EXPERIENCES.
            </p>
          </div>

          <a 
            href="#private-form"
            onClick={() => playSFX('ticketClick')}
            className="px-6 py-3.5 bg-[#315D73] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            REQUEST SESSION ↓
          </a>
        </div>

        {/* PACKAGES */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-4">
            CURATED PRIVATE PACKAGES
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg, idx) => (
              <div key={idx} className="p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col gap-1">
                <span className="font-mono text-[9px] font-bold text-[#c2272a]">PACKAGE 0{idx+1}</span>
                <h3 className="font-poster text-xl text-[#191410]">{pkg.title}</h3>
                <p className="font-sans text-xs text-[#241a12]/80">{pkg.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* REQUEST FORM */}
        <div id="private-form" className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[12px_12px_0px_#4c1210] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            PRIVATE SESSION INQUIRY FORM
          </span>
          <h2 className="font-poster text-3xl sm:text-4xl text-[#191410] my-1">REQUEST A PRIVATE SESSION</h2>

          {submitted ? (
            <div className="p-6 bg-[#315D73] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410] my-6">
              ✓ PRIVATE INQUIRY RECEIVED // OUR EVENT DIRECTOR WILL REACH OUT WITHIN 24 HOURS!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <input type="text" required placeholder="PREFERRED DATE (DD/MM/YYYY)" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" required placeholder="VENUE / LOCATION CITY" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="number" required placeholder="EXPECTED GUEST COUNT" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <input type="text" placeholder="ESTIMATED BUDGET RANGE" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              <textarea rows={4} required placeholder="MESSAGE / SONIC PREFERENCES / SPECIAL REQUESTS" className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] md:col-span-2 outline-none resize-none" />

              <button
                type="submit"
                className="md:col-span-2 py-4 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#315D73] active:scale-95 transition-all"
              >
                SUBMIT PRIVATE SESSION REQUEST →
              </button>
            </form>
          )}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
