import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { diaryEntries } from '../data/mockData';

export const BlogsPage = () => {
  const [category, setCategory] = useState('ALL');

  return (
    <div className="min-h-screen bg-[#1C0E08] text-[#E7D5A4] font-mono selection:bg-[#D19A24] selection:text-[#11100C]">
      <Navbar />

      <section className="relative pt-32 pb-16 px-6 max-w-6xl mx-auto text-center border-b-2 border-[#D19A24]/40">
        <span className="font-mono text-xs text-[#D19A24] tracking-[0.35em] uppercase font-bold mb-3 block">
          TANGY EDITORIALS // SHOW STORIES & MUSIC LAUNCHES
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          THE TANGY BLOG
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#D19A24]/30 py-4 uppercase">
          HANDWRITTEN DIARY ENTRIES, UNRELEASED RECORDING LOGS, SHOW STORIES, AND BEHIND THE SCENES EDITORIALS.
        </p>

        {/* CATEGORY FILTERS */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {['ALL', 'DIARY ENTRIES', 'SHOW STORIES', 'MUSIC LAUNCHES', 'BEHIND THE SCENES'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border border-[#D19A24] ${
                category === cat ? 'bg-[#D19A24] text-[#11100C]' : 'bg-transparent text-[#E7D5A4] hover:bg-[#D19A24]/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* BLOG ENTRIES LIST */}
      <section className="py-20 max-w-5xl mx-auto px-6 flex flex-col gap-12">
        {diaryEntries.map((entry, idx) => (
          <article key={entry.id} className="bg-[#F2E5C6] text-[#11100C] p-6 md:p-10 border-4 border-[#11100C] shadow-[15px_15px_0px_#11100C]">
            <div className="flex justify-between items-center font-mono text-xs font-bold text-[#7C2D18] border-b border-[#11100C]/30 pb-3 mb-4 uppercase">
              <span>ENTRY #00{idx+1} · {entry.date}</span>
              <span>HYDERABAD ARCHIVE</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-2">
                <h2 className="font-serif italic text-3xl md:text-5xl text-[#11100C] font-bold mb-4 leading-tight">
                  {entry.title}
                </h2>
                <p className="font-body text-base text-[#11100C]/90 leading-relaxed mb-6">
                  {entry.excerpt || "Acoustic notes echoing off 350-year-old limestone steps before the crowd arrives. Field recording log filed under cultural preservation."}
                </p>
                <div className="font-mono text-xs font-bold text-[#7C2D18] uppercase">
                  TAGS: HERITAGE · ACOUSTIC · FIELD RECORDING
                </div>
              </div>

              <div className="w-full aspect-[4/3] bg-black border-2 border-[#11100C] overflow-hidden">
                <img src={entry.image} alt={entry.title} className="w-full h-full object-cover filter grayscale contrast-125" />
              </div>
            </div>
          </article>
        ))}
      </section>

      <Footer />
    </div>
  );
};
