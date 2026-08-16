import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { gallery } from '../../data/mockData';

export const SessionArchivePage = () => {
  const [search, setSearch] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const filteredGallery = gallery.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      {lightboxSrc && (
        <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Archive preview" className="max-w-full max-h-[90vh] object-contain border-4 border-[#E7D5A4]/30" />
          <button className="absolute top-4 right-4 text-[#E7D5A4] font-mono text-xs font-bold border border-[#E7D5A4]/50 px-3 py-1">CLOSE ✕</button>
        </div>
      )}

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/archive" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ARCHIVE</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            ANALOGUE CONTACT SHEETS // 35MM FIELD TAPES
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            SESSION<br/>ARCHIVE
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            EVERY DOCUMENTED FRAME FROM TEN YEARS OF HERITAGE SESSIONS IN HYDERABAD.
          </p>

          <div className="flex justify-center mt-6 sm:mt-10">
            <input
              type="text"
              placeholder="SEARCH ARCHIVE RECORDS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#191410] border border-[#C99A2E]/60 text-[#E7D5A4] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C99A2E] w-full sm:w-72"
            />
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          EASTMAN KODAK 5247 // 35MM CONTACT SHEET PRINTS — {filteredGallery.length} FRAMES
        </div>

        {filteredGallery.length === 0 && (
          <p className="font-mono text-xs text-[#E7D5A4]/40 uppercase text-center py-10">NO RECORDS MATCH YOUR SEARCH.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredGallery.map((item, idx) => (
            <div key={item.id} className="bg-[#1A1510] border border-[#E7D5A4]/15 p-1.5 sm:p-2 cursor-pointer group hover:border-[#C99A2E]/60 transition-all" onClick={() => setLightboxSrc(item.src)}>
              <div className="flex justify-between font-mono text-[7px] sm:text-[8px] font-bold text-[#C99A2E] mb-1 uppercase">
                <span>FRAME {String(idx + 1).padStart(3, '0')}</span>
                <span>HYD 2025</span>
              </div>
              <div className="w-full aspect-square bg-black overflow-hidden mb-1.5">
                <img src={item.src} alt={item.label} className="w-full h-full object-cover filter grayscale sepia-[0.25] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
              </div>
              <p className="font-mono text-[8px] sm:text-[9px] font-bold uppercase text-[#E7D5A4]/70 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">EXPLORE MORE OF THE ARCHIVE</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/archive/museum-timeline" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">MUSEUM TIMELINE →</a>
          <a href="/archive/past-memories" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">PAST MEMORIES →</a>
          <a href="/archive/contact-sheets" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">CONTACT SHEETS →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
