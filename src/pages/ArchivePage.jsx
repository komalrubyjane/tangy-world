import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionNav } from '../components/layout/SectionNav';
import { ArchiveIndex } from '../components/archive/ArchiveIndex';
import { archiveItems } from '../data/mockData';
import { useGalleryPhotos } from '../hooks/useContent';
import { RetroGrain, LotusStamp } from '../components/ui/RetroAssets';


const MUSEUM_MILESTONES = [
  { year: '2016', event: 'FIRST STEPWELL SESSION', details: 'Bansilalpet Stepwell cleared of debris; 45 guests gather for acoustic raga.' },
  { year: '2019', event: 'THE TARAMATI EXPANSION', title: 'Open-Air Heritage', details: '12 arches pavilion activated for 250 acoustics enthusiasts.' },
  { year: '2022', event: 'ANALOG TAPE INITIATIVE', details: '1/4-inch tape recording studio setup inside Old City Haveli.' },
  { year: '2025', event: '30+ SESSIONS ARCHIVED', details: 'Full heritage soundscape collection published in physical & digital archives.' }
];

export const ArchivePage = () => {
  const gallery = useGalleryPhotos();
  const [search, setSearch] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const filteredGallery = gallery.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#C89D35] selection:text-[#11100C] overflow-x-hidden printNoise">
      <Navbar />

      {/* LIGHTBOX */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Archive preview"
            className="max-w-full max-h-[90vh] object-contain border-2 border-[#E7D5A4]/30"
          />
          <button type="button" onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 min-h-[44px] text-[#E7D5A4] font-mono text-xs font-bold border border-[#E7D5A4]/50 px-3 py-1">
            CLOSE ✕
          </button>
        </div>
      )}

      {/* PAGE HERO */}
      <section id="session-archive" className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-condensed text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">ARCHIVE</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            ANALOGUE CONTACT SHEETS // 35MM FIELD TAPES
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            THE FULL<br/>ARCHIVE
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            EXPLORE RECORDINGS, 35MM CONTACT SHEETS, PERFORMANCE MEMORIES, AND HERITAGE ARCHIVES FROM 2016 TO PRESENT.
          </p>

          <SectionNav section="Archive" className="mt-6 sm:mt-8" />

          {/* FILTERS + SEARCH */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-10">

            <label htmlFor="archive-photo-search" className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold">Search photos</label>
            <input
              id="archive-photo-search"
              type="search"
              placeholder="SEARCH ARCHIVE PHOTOS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#191410] border border-[#C99A2E]/60 text-[#E7D5A4] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C99A2E] w-full sm:w-56"
            />
          </div>
        </div>
      </section>

      <ArchiveIndex />

      {/* 35MM CONTACT SHEETS GRID */}
      <section id="contact-sheets" className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          EASTMAN KODAK 5247 // 35MM CONTACT SHEET PRINTS — {filteredGallery.length} FRAMES
        </div>

        {filteredGallery.length === 0 && (
          <p className="font-mono text-xs text-[#E7D5A4]/60 uppercase text-center py-10">
            NO RECORDS MATCH YOUR SEARCH.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredGallery.map((item, idx) => (
            <div
              key={item.id}
              className="relative bg-[#181614] border border-[#E7D5A4]/15 p-1.5 sm:p-2 cursor-pointer group hover:border-[#C99A2E]/60 transition-all"
              onClick={() => setLightboxSrc(item.src)}
            >
              <RetroGrain index={idx % 2} opacity={0.12} blend="overlay" />
              <div className="relative flex justify-between font-mono text-[7px] sm:text-[8px] font-bold text-[#C99A2E] mb-1 uppercase">
                <span>FRAME {String(idx + 1).padStart(3, '0')}</span>
                <span>HYD 2025</span>
              </div>
              <div className="w-full aspect-square bg-black overflow-hidden mb-1.5">
                <img
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover filter grayscale sepia-[0.25] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <p className="font-mono text-[8px] sm:text-[9px] font-bold uppercase text-[#E7D5A4]/70 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MUSEUM TIMELINE SECTION */}
      <section id="museum-timeline" className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 bg-[#211915] printNoise border-t-4 border-[#C99A2E]/40 my-8">
        <div className="text-center mb-8">
          <span className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] block mb-2">
            ARCHIVAL CHRONOLOGY
          </span>
          <h2 className="display text-3xl sm:text-5xl text-[#E7D5A4]">MUSEUM TIMELINE</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MUSEUM_MILESTONES.map((m, i) => (
            <div key={i} className="relative bg-[#EFE2C0] paperTexture text-[#11100C] p-4 sm:p-5 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] overflow-hidden">
              <RetroGrain index={i % 2} opacity={0.1} blend="overlay" />
              <span className="relative font-mono text-xs font-bold text-[#B94717] block mb-1">{m.year}</span>
              <h3 className="relative display text-lg text-[#11100C] mb-2">{m.event}</h3>
              <p className="relative font-mono text-[10px] text-[#11100C]/80 leading-relaxed">{m.details}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PAST MEMORIES / ARCHIVE OBJECTS */}
      <section id="past-memories" className="py-10 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          PAST MEMORIES // PHYSICAL ARTEFACTS & FIELD DOCUMENTS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
          {archiveItems.map((item, i) => (
            <div key={item.id} className="relative bg-[#EFE2C0] paperTexture text-[#11100C] border-2 border-[#11100C] p-4 sm:p-6 shadow-[4px_4px_0px_#11100C] sm:shadow-[4px_4px_0px_#11100C] flex gap-4 items-start overflow-hidden">
              <RetroGrain index={i % 2} opacity={0.1} blend="overlay" />
              
              <div className="relative w-20 sm:w-28 flex-shrink-0 border-2 border-[#11100C] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full aspect-[3/4] object-cover filter grayscale sepia-[0.4]" />
                <LotusStamp index={i} bg="transparent" border="#C99A24" className="absolute -bottom-2 -right-2 w-7 h-7 shadow-md -rotate-6" />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="font-mono text-[8px] sm:text-[9px] font-bold text-[#B94717] uppercase tracking-wider mb-1">
                  {item.category} // {item.year}
                </div>
                <h3 className="display text-base sm:text-xl text-[#11100C] mb-2 leading-tight">{item.title}</h3>
                <p className="font-mono text-[10px] sm:text-xs text-[#B94717] font-bold uppercase mb-1">{item.headline}</p>
                <p className="font-mono text-[9px] sm:text-[10px] text-[#11100C]/75 leading-relaxed">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
