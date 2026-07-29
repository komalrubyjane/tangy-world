import { useNavigate } from 'react';
import { motion } from 'framer-motion';
import { founders } from '../data/mockData';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const AboutPage = () => {
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
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              MANIFESTO & VISION // EST. 2016
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              THE TANGY STORY
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              AN INTERACTIVE SCREEN-PRINTED MUSIC ARCHIVE DEDICATED TO PRESERVING UNDERGROUND ACOUSTICS & HERITAGE SPACES.
            </p>
          </div>
        </div>

        {/* MANIFESTO BLOCK */}
        <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-2">
            OUR MANIFESTO
          </span>
          <blockquote className="font-poster text-2xl sm:text-3xl text-[#191410] leading-tight my-2">
            "THIS WORLD HAS A SOUND. LISTEN CLOSELY."
          </blockquote>
          <p className="font-sans text-sm sm:text-base text-[#241a12]/90 leading-relaxed max-w-3xl">
            Tangy Sessions is a living archive of music, people, and historic spaces in Hyderabad. We transform 300-year-old stepwells and open-air pavilions into intimate acoustic sanctuaries where listeners stand still and subwoofers echo off ancient masonry.
          </p>
        </div>

        {/* FOUNDERS SECTION */}
        <div className="bg-[#191410] border-2 border-[#ecdcaf]/30 p-6 shadow-[8px_8px_0px_#191410] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#d1a437] tracking-[0.3em] uppercase block mb-6">
            THE FOUNDERS ARCHIVE
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {founders.map((founder) => (
              <div key={founder.id} className="bg-[#e9decb] text-[#241a12] p-6 border-2 border-[#191410] flex flex-col gap-3">
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{founder.role}</span>
                <h3 className="font-poster text-3xl text-[#191410]">{founder.name}</h3>
                <img src={founder.image} alt={founder.name} className="w-full aspect-[4/3] object-cover border border-[#191410]" />
                <p className="font-mono text-xs text-[#241a12]/90 italic border-l-4 border-[#c2272a] pl-3">
                  "{founder.bio}"
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
