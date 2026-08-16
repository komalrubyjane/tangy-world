import { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { diaryEntries } from '../../data/mockData';

const BEHIND_THE_SCENES_IDS = [6, 7];

export const BehindTheScenesPage = () => {
  const [expanded, setExpanded] = useState(null);
  const entries = diaryEntries.filter(e => BEHIND_THE_SCENES_IDS.includes(e.id));
  const fallbackEntries = entries.length > 0 ? entries : diaryEntries;

  return (
    <div className="min-h-screen bg-[#1C0E08] text-[#E7D5A4] font-mono selection:bg-[#D19A24] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#D19A24]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/diary" className="font-mono text-[10px] text-[#D19A24]/70 tracking-widest uppercase hover:text-[#D19A24] transition-colors">← BACK TO DIARY</a>
          <span className="font-mono text-xs text-[#D19A24] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            PRODUCTION LOGS // OFF-STAGE
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            BEHIND THE<br/>SCENES
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#D19A24]/30 py-3 sm:py-4 uppercase">
            RIGGING, RECORDING, AND EVERYTHING THAT HAPPENS BEFORE THE FIRST NOTE.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-12">
        {fallbackEntries.map((entry, idx) => {
          const isExpanded = expanded === entry.id;
          return (
            <article key={entry.id} className="bg-[#F2E5C6] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] sm:shadow-[15px_15px_0px_#11100C] overflow-hidden">
              <div className="flex justify-between items-center font-mono text-[9px] sm:text-xs font-bold text-[#7C2D18] border-b border-[#11100C]/30 px-4 sm:px-6 py-2 sm:py-3 uppercase">
                <span>ENTRY #00{idx + 1} · {entry.date}</span>
                <span className="hidden sm:block">{entry.location || 'HYDERABAD ARCHIVE'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
                <div className="sm:col-span-1 w-full h-48 sm:h-auto overflow-hidden border-b-4 sm:border-b-0 sm:border-r-4 border-[#11100C]">
                  <img src={entry.image} alt={entry.title} className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125" />
                </div>
                <div className="sm:col-span-2 p-4 sm:p-8 flex flex-col justify-between">
                  <div>
                    <h2 className="font-serif italic text-2xl sm:text-3xl text-[#11100C] font-bold mb-3 leading-tight">{entry.title}</h2>
                    <p className="font-body text-sm sm:text-base text-[#11100C]/80 leading-relaxed mb-4 border-l-4 border-[#D19A24] pl-3 sm:pl-4">
                      {entry.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="self-start bg-[#11100C] text-[#E7D5A4] font-mono text-[10px] font-bold px-4 py-2 uppercase tracking-widest hover:bg-[#7C2D18] transition-colors border border-[#11100C]"
                  >
                    {isExpanded ? 'CLOSE ↑' : 'READ MORE →'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="py-12 sm:py-16 bg-[#11100C] border-t-4 border-[#D19A24]/40 px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#D19A24] tracking-[0.3em] uppercase font-bold block mb-4">MORE FROM THE DIARY</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/diary/journal" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#D19A24]/60 text-[#D19A24] hover:bg-[#D19A24] hover:text-[#11100C] transition-colors">MUSEUM JOURNAL →</a>
          <a href="/diary/stories" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#D19A24]/60 text-[#D19A24] hover:bg-[#D19A24] hover:text-[#11100C] transition-colors">RECENT STORIES →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
