import { useNavigate } from 'react';
import { motion } from 'framer-motion';
import { diaryEntries, gallery } from '../data/mockData';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const DiaryPage = () => {
  const navigate = useNavigate();

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
        <div className="w-full bg-[#191410] border-4 border-[#c2272a] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              BEHIND THE SCENES JOURNAL // NOTEBOOK
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              TANGY DIARY & STORIES
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              UNSCRIPTED MOMENTS, PRODUCTION LOGS, MONSOON SESSIONS, AND ARTIST INTERVIEWS.
            </p>
          </div>
        </div>

        {/* DIARY ENTRIES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {diaryEntries.map((entry) => (
            <div key={entry.id} className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-3">
              <img src={entry.image} alt={entry.title} className="w-full aspect-[4/3] object-cover border-2 border-[#191410]" />
              <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{entry.date} · {entry.location}</span>
              <h3 className="font-poster text-2xl text-[#191410]">{entry.title}</h3>
              <p className="font-sans text-xs text-[#241a12]/90 leading-relaxed">{entry.content}</p>
            </div>
          ))}
        </div>

        {/* FILM CAMERA PHOTO GALLERY */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] uppercase block mb-4">
            35MM FILM CAMERA GALLERY
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {gallery.map(img => (
              <img key={img.id} src={img.src} alt={img.label} className="w-full aspect-square object-cover border border-[#ecdcaf]/20 filter contrast-125" />
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
