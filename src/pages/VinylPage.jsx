import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { vinylCatalog } from '../data/mockData';
import { VinylRecordPlayerModal } from '../components/museum/VinylRecordPlayerModal';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const VinylPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [isTurntableOpen, setIsTurntableOpen] = useState(false);

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
      <VinylRecordPlayerModal isOpen={isTurntableOpen} onClose={() => setIsTurntableOpen(false)} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#c2272a] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              VINYL CATALOG // 33⅓ RPM STEREO
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              THE VINYL COLLECTION
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              PRESSED DIRECTLY FROM 2-TRACK MASTER TAPES RECORDED LIVE INSIDE ANCIENT STEPWELLS.
            </p>
          </div>

          <button
            onClick={() => { playSFX('ticketClick'); setIsTurntableOpen(true); }}
            className="px-6 py-3.5 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            OPEN TURNTABLE PLAYER 💿
          </button>
        </div>

        {/* VINYL CATALOG GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {vinylCatalog.map((album) => (
            <div key={album.id} className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col md:flex-row gap-6 items-center">
              
              {/* SPINNING VINYL RECORD ARTWORK */}
              <div 
                onClick={() => { playSFX('ticketClick'); setIsTurntableOpen(true); }}
                className="w-48 h-48 rounded-full bg-[#0d0a07] border-4 border-[#191410] shadow-xl flex items-center justify-center relative cursor-pointer hover:rotate-45 transition-transform duration-700 shrink-0"
              >
                <div className="w-20 h-20 rounded-full bg-[#c2272a] text-[#ecdcaf] flex flex-col items-center justify-center text-center p-1">
                  <span className="font-poster text-[8px] uppercase">TANGY</span>
                  <span className="font-mono text-[6px] text-[#d1a437] font-bold">33⅓ RPM</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{album.catalogNo} · {album.year}</span>
                <h3 className="font-poster text-2xl text-[#191410]">{album.title}</h3>
                <p className="font-mono text-xs text-[#241a12]/80 font-bold">{album.artist}</p>
                <p className="font-sans text-xs text-[#241a12]/90 mt-1">{album.story}</p>

                <button
                  onClick={() => { playSFX('ticketClick'); setIsTurntableOpen(true); }}
                  className="mt-3 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-[10px] font-bold tracking-widest uppercase border border-[#191410] active:scale-95 transition-all"
                >
                  LISTEN ON TURNTABLE ▶
                </button>
              </div>

            </div>
          ))}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
