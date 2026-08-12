import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { gallery, archiveItems } from '../data/mockData';

const TABS = ['ALL', 'GALLERY', 'ARCHIVE OBJECTS', 'PRESS'];

const PRESS_CLIPS = [
  {
    id: 'p1',
    title: '"Tangy Sessions: Hyderabad\'s Most Intimate Music Night"',
    pub: 'THE DECCAN CHRONICLE',
    year: '2024',
    quote: 'In a city building more auditoriums, Tangy Sessions is doing the opposite — digging up forgotten stepwells and staging music inside them.',
    image: '/media/gallery/tangy5.jpg'
  },
  {
    id: 'p2',
    title: '"Heritage Acoustics and the Underground Sound Movement"',
    pub: 'ROLLING STONE INDIA',
    year: '2024',
    quote: 'What happens when you stop building stages and start collaborating with 350-year-old stone? You get Tangy Sessions.',
    image: '/media/gallery/tangy8.jpg'
  },
  {
    id: 'p3',
    title: '"Sold Out in 3 Minutes: The New Breed of Cultural Events"',
    pub: 'INDIAN EXPRESS',
    year: '2025',
    quote: 'Tangy Sessions tickets disappear faster than any stadium show in Hyderabad. The reason: authenticity is genuinely rare.',
    image: '/media/gallery/tangy3.jpg'
  }
];

const MUSEUM_MILESTONES = [
  { year: '2016', event: 'FIRST STEPWELL SESSION', details: 'Bansilalpet Stepwell cleared of debris; 45 guests gather for acoustic raga.' },
  { year: '2019', event: 'THE TARAMATI EXPANSION', title: 'Open-Air Heritage', details: '12 arches pavilion activated for 250 acoustics enthusiasts.' },
  { year: '2022', event: 'ANALOG TAPE INITIATIVE', details: '1/4-inch tape recording studio setup inside Old City Haveli.' },
  { year: '2025', event: '30+ SESSIONS ARCHIVED', details: 'Full heritage soundscape collection published in physical & digital archives.' }
];

export const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const filteredGallery = gallery.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
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
            className="max-w-full max-h-[90vh] object-contain border-4 border-[#E7D5A4]/30"
          />
          <button className="absolute top-4 right-4 text-[#E7D5A4] font-mono text-xs font-bold border border-[#E7D5A4]/50 px-3 py-1">
            CLOSE ✕
          </button>
        </div>
      )}

      {/* PAGE HERO */}
      <section id="session-archive" className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-display text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">ARCHIVE</span>
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

          {/* Quick Section Anchors */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              { label: 'SESSION ARCHIVE', hash: '#session-archive' },
              { label: 'MUSEUM TIMELINE', hash: '#museum-timeline' },
              { label: 'PAST MEMORIES', hash: '#past-memories' },
              { label: '35MM CONTACT SHEETS', hash: '#contact-sheets' }
            ].map((link) => (
              <a
                key={link.hash}
                href={link.hash}
                className="px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors"
              >
                {link.label} ↓
              </a>
            ))}
          </div>

          {/* FILTERS + SEARCH */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-10">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3 py-1.5 font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider border border-[#C99A2E] flex-shrink-0 transition-colors ${
                    activeTab === tab ? 'bg-[#C99A2E] text-[#11100C]' : 'bg-transparent text-[#E7D5A4] hover:bg-[#C99A2E]/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="SEARCH ARCHIVE RECORDS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#191410] border border-[#C99A2E]/60 text-[#E7D5A4] px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#C99A2E] w-full sm:w-56"
            />
          </div>
        </div>
      </section>

      {/* 35MM CONTACT SHEETS GRID */}
      <section id="contact-sheets" className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          EASTMAN KODAK 5247 // 35MM CONTACT SHEET PRINTS — {filteredGallery.length} FRAMES
        </div>

        {filteredGallery.length === 0 && (
          <p className="font-mono text-xs text-[#E7D5A4]/40 uppercase text-center py-10">
            NO RECORDS MATCH YOUR SEARCH.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredGallery.map((item, idx) => (
            <div
              key={item.id}
              className="bg-[#1A1510] border border-[#E7D5A4]/15 p-1.5 sm:p-2 cursor-pointer group hover:border-[#C99A2E]/60 transition-all"
              onClick={() => setLightboxSrc(item.src)}
            >
              <div className="flex justify-between font-mono text-[7px] sm:text-[8px] font-bold text-[#C99A2E] mb-1 uppercase">
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
      <section id="museum-timeline" className="py-12 sm:py-16 max-w-6xl mx-auto px-4 sm:px-6 bg-[#1C0E08] border-t-4 border-[#C99A2E]/40 my-8">
        <div className="text-center mb-8">
          <span className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] block mb-2">
            ARCHIVAL CHRONOLOGY
          </span>
          <h2 className="display text-3xl sm:text-5xl text-[#E7D5A4]">MUSEUM TIMELINE</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MUSEUM_MILESTONES.map((m, i) => (
            <div key={i} className="bg-[#E7D5A4] text-[#11100C] p-4 sm:p-5 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C]">
              <span className="font-mono text-xs font-bold text-[#B94717] block mb-1">{m.year}</span>
              <h3 className="display text-lg text-[#11100C] mb-2">{m.event}</h3>
              <p className="font-mono text-[10px] text-[#11100C]/80 leading-relaxed">{m.details}</p>
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
          {archiveItems.map((item) => (
            <div key={item.id} className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-4 sm:p-6 shadow-[6px_6px_0px_#11100C] sm:shadow-[12px_12px_0px_#11100C] flex gap-4 items-start">
              <div className="w-20 sm:w-28 flex-shrink-0 border-2 border-[#11100C] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full aspect-[3/4] object-cover filter grayscale sepia-[0.4]" />
              </div>
              <div className="flex-1 min-w-0">
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

      {/* PRESS CLIPPINGS */}
      <section className="py-10 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-6 border-b border-[#C99A2E]/30 pb-2">
          PRESS ARCHIVE // MEDIA COVERAGE & EDITORIAL FEATURES
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          {PRESS_CLIPS.map((clip) => (
            <div key={clip.id} className="bg-[#F5E9C9] text-[#11100C] border-4 border-[#11100C] p-4 sm:p-8 shadow-[4px_4px_0px_#11100C] sm:shadow-[10px_10px_0px_#11100C] grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 items-center">
              <div className="sm:col-span-1 w-full h-28 sm:h-full overflow-hidden border-2 border-[#11100C]">
                <img src={clip.image} alt={clip.title} className="w-full h-full object-cover filter grayscale sepia-[0.4]" />
              </div>
              <div className="sm:col-span-3">
                <div className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-wider mb-2">
                  {clip.pub} // {clip.year}
                </div>
                <h3 className="font-serif italic text-lg sm:text-2xl text-[#11100C] mb-3 leading-tight">{clip.title}</h3>
                <p className="font-body text-xs sm:text-sm text-[#11100C]/80 leading-relaxed italic border-l-4 border-[#C99A2E] pl-3">
                  "{clip.quote}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
