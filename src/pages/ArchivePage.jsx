import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { gallery } from '../data/mockData';

export const ArchivePage = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredGallery = gallery.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
          ANALOGUE CONTACT SHEETS // 35MM FIELD TAPES
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          THE FULL ARCHIVE
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-4 uppercase">
          EXPLORE RECORDINGS, 35MM CONTACT SHEETS, PERFORMANCE MEMORIES, AND HERITAGE ARCHIVES FROM 2016 TO PRESENT.
        </p>

        {/* SEARCH & CATEGORY FILTERS */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10">
          <div className="flex gap-2">
            {['ALL', 'VIDEOS', 'PHOTOS', 'AUDIO', 'MEMORIES'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider border border-[#C99A2E] ${
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
            className="bg-[#191410] border border-[#C99A2E]/60 text-[#E7D5A4] px-4 py-2 font-mono text-xs focus:outline-none focus:border-[#C99A2E] w-full md:w-64"
          />
        </div>
      </section>

      {/* GALLERY GRID */}
      <section className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGallery.map((item, idx) => (
          <div key={item.id} className="bg-[#E3D4AC] text-[#11100C] p-4 border-2 border-[#11100C] shadow-2xl rotate-[-1deg] hover:rotate-0 transition-transform">
            <div className="flex justify-between font-mono text-[9px] font-bold text-[#11100C] mb-2 uppercase">
              <span>EASTMAN 5247 // #{idx+1}</span>
              <span>HYD 2025</span>
            </div>
            <div className="w-full aspect-[4/3] bg-black border border-[#11100C] overflow-hidden mb-3">
              <img src={item.src} alt={item.label} className="w-full h-full object-cover filter grayscale sepia-[0.35] contrast-125 hover:grayscale-0 transition-all duration-500" />
            </div>
            <p className="font-mono text-xs font-bold uppercase text-[#11100C]">{item.label}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
};
