import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { archiveItems } from '../data/mockData';
import { ArchiveSpreadModal } from '../components/museum/ArchiveSpreadModal';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const ArchivePage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [selectedSpread, setSelectedSpread] = useState(false);

  const timelineYears = [
    { year: "2016", title: "THE FIRST SPARK", desc: "First acoustic sessions inside living rooms & private stepwells." },
    { year: "2018", title: "UNDERGROUND RECORDINGS", desc: "Acquiring 2-track tape recorders for live acoustics." },
    { year: "2020", title: "STEPWELL SANCTUARY", desc: "Bansilalpet Stepwell becomes primary acoustic home." },
    { year: "2023", title: "PAN-INDIA EXPANSION", desc: "Curating intimate nights across Goa, Mumbai, and Delhi." },
    { year: "2025", title: "DIGITAL MUSEUM ERA", desc: "Preserving over 200+ performances for future generations." }
  ];

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
      <ArchiveSpreadModal isOpen={selectedSpread} onClose={() => setSelectedSpread(false)} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              TANGY DIGITAL ARCHIVE // 10-YEAR CHRONOLOGY
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              THE HERITAGE ARCHIVE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              AN INTERACTIVE LIBRARY OF CONCERT POSTERS, TICKET STUBS, VINYL SLEEVES, AND FIELD NOTES.
            </p>
          </div>

          <button
            onClick={() => { playSFX('ticketClick'); setSelectedSpread(true); }}
            className="px-6 py-3.5 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            OPEN MAGAZINE SPREAD 📚
          </button>
        </div>

        {/* INTERACTIVE TIMELINE */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-6">
            10-YEAR HISTORICAL TIMELINE
          </span>
          <div className="flex flex-col gap-4">
            {timelineYears.map((item, idx) => (
              <div key={idx} className="bg-[#e9decb] text-[#241a12] p-4 border-2 border-[#191410] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-4">
                  <span className="font-poster text-3xl text-[#c2272a]">{item.year}</span>
                  <div>
                    <h3 className="font-poster text-xl text-[#191410]">{item.title}</h3>
                    <p className="font-mono text-xs text-[#241a12]/80">{item.desc}</p>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase border border-[#c2272a] px-2 py-0.5">VERIFIED FILE</span>
              </div>
            ))}
          </div>
        </div>

        {/* ARCHIVE ITEMS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {archiveItems.map((item) => (
            <div key={item.id} className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-3">
              <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover border-2 border-[#191410]" />
              <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{item.category} · YEAR {item.year}</span>
              <h3 className="font-poster text-2xl text-[#191410]">{item.title}</h3>
              <p className="font-sans text-xs text-[#241a12]/90">{item.details}</p>
              <button
                onClick={() => { playSFX('ticketClick'); setSelectedSpread(true); }}
                className="mt-2 py-2.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border border-[#191410] active:scale-95 transition-all"
              >
                READ MAGAZINE SPREAD →
              </button>
            </div>
          ))}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
