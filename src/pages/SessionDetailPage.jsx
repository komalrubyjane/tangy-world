import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { events, artists, gallery } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const SessionDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  const session = useMemo(() => {
    return events.find(e => e.slug === slug || e.id === slug) || events[0];
  }, [slug]);

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

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-left">
        
        {/* BACK LINK */}
        <div className="mb-6">
          <button
            onClick={() => { playSFX('ticketClick'); navigate('/sessions'); }}
            className="font-mono text-xs font-bold text-[#ecdcaf] hover:text-[#d1a437] border border-[#ecdcaf]/30 px-3 py-1.5 bg-[#191410] shadow-[4px_4px_0px_#191410]"
          >
            ← BACK TO SESSIONS ARCHIVE
          </button>
        </div>

        {/* HERO EDITORIAL POSTER */}
        <div className="w-full bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[12px_12px_0px_#191410] mb-10 flex flex-col md:flex-row gap-8 items-center">
          <img 
            src={session.image} 
            alt={session.title} 
            className="w-full md:w-1/2 aspect-[4/3] object-cover border-2 border-[#191410] filter contrast-110 shadow-md" 
          />
          <div className="flex flex-col gap-3 flex-1">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] uppercase tracking-widest">
              HYDERABAD LIVE SESSIONS · {session.date}
            </span>
            <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none my-1">
              {session.title}
            </h1>
            <p className="font-mono text-sm text-[#c2272a] font-bold">{session.artist} · {session.venue}</p>
            <p className="font-sans text-sm text-[#241a12]/90 leading-relaxed">{session.description}</p>
            
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => { playSFX('ticketClick'); navigate(`/book/${session.slug || session.id}`); }}
                className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
              >
                BOOK TICKETS ({session.price}) →
              </button>
            </div>
          </div>
        </div>

        {/* SETLIST & STORY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          
          {/* SETLIST */}
          <div className="bg-[#191410] border-2 border-[#d1a437] p-6 shadow-[6px_6px_0px_#191410] flex flex-col gap-4">
            <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">01 // LIVE SETLIST & RECORDING</span>
            {session.setlist ? (
              <div className="flex flex-col gap-2">
                {session.setlist.map((track, idx) => (
                  <div key={idx} className="p-3 bg-[#0d0a07] border border-[#ecdcaf]/20 font-mono text-xs text-[#ecdcaf] flex justify-between">
                    <span>{track}</span>
                    <span className="text-[#d1a437]">LIVE</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-[#ecdcaf]/70">Setlist archives available on 2-track master tape.</p>
            )}
          </div>

          {/* HISTORICAL STORY */}
          <div className="bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] p-6 shadow-[6px_6px_0px_#c2272a] flex flex-col gap-3">
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">02 // FIELD NOTES & STORY</span>
            <h3 className="font-poster text-2xl text-[#191410]">BEHIND THE ECHOES</h3>
            <p className="font-sans text-sm text-[#191410]/90 leading-relaxed font-normal">
              {session.story || "A living archive of music, people, and historic spaces in Hyderabad."}
            </p>
          </div>

        </div>

        {/* GALLERY */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[6px_6px_0px_#191410] mb-10 flex flex-col gap-4">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">03 // ATMOSPHERE GALLERY</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gallery.slice(0, 4).map((img) => (
              <img key={img.id} src={img.src} alt={img.label} className="w-full aspect-[4/3] object-cover border border-[#ecdcaf]/20 filter contrast-110" />
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
