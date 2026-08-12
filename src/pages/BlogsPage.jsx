import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { diaryEntries } from '../data/mockData';

const CATEGORY_TAGS = {
  'ALL': null,
  'DIARY ENTRIES': [1, 2, 3],
  'SHOW STORIES': [4, 5],
  'BEHIND THE SCENES': [6, 7]
};

export const BlogsPage = () => {
  const [category, setCategory] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const filteredEntries = category === 'ALL'
    ? diaryEntries
    : diaryEntries.filter(e => CATEGORY_TAGS[category]?.includes(e.id));

  return (
    <div className="min-h-screen bg-[#1C0E08] text-[#E7D5A4] font-mono selection:bg-[#D19A24] selection:text-[#11100C]">
      <Navbar />

      {/* PAGE HERO */}
      <section id="journal" className="relative pt-28 pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#D19A24]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        <span className="font-mono text-xs text-[#D19A24] tracking-[0.35em] uppercase font-bold mb-3 block">
          TANGY EDITORIALS // SHOW STORIES & MUSIC LAUNCHES
        </span>
        <h1 className="display text-5xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-4 sm:mb-6">
          THE TANGY<br className="sm:hidden" /> BLOG
        </h1>
        <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#D19A24]/30 py-3 sm:py-4 uppercase">
          HANDWRITTEN DIARY ENTRIES, UNRELEASED RECORDING LOGS, SHOW STORIES, AND BEHIND THE SCENES EDITORIALS.
        </p>

        {/* CATEGORY FILTERS */}
        <div id="stories" className="flex gap-2 sm:gap-3 mt-6 sm:mt-8 overflow-x-auto pb-1 sm:justify-center sm:flex-wrap scrollbar-none">
          {Object.keys(CATEGORY_TAGS).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-[#D19A24] flex-shrink-0 transition-colors ${
                category === cat ? 'bg-[#D19A24] text-[#11100C]' : 'bg-transparent text-[#E7D5A4] hover:bg-[#D19A24]/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* BLOG ENTRIES */}
      <section id="behind-the-scenes" className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-12">
        {filteredEntries.length === 0 && (
          <div className="text-center py-20">
            <p className="font-mono text-xs text-[#E7D5A4]/50 uppercase tracking-widest">NO ENTRIES IN THIS CATEGORY YET.</p>
          </div>
        )}
        {filteredEntries.map((entry, idx) => {
          const isExpanded = expanded === entry.id;
          return (
            <article
              key={entry.id}
              className="bg-[#F2E5C6] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] sm:shadow-[15px_15px_0px_#11100C] overflow-hidden"
            >
              <div className="flex justify-between items-center font-mono text-[9px] sm:text-xs font-bold text-[#7C2D18] border-b border-[#11100C]/30 px-4 sm:px-6 py-2 sm:py-3 uppercase">
                <span>ENTRY #00{idx+1} · {entry.date}</span>
                <span className="hidden sm:block">{entry.location || 'HYDERABAD ARCHIVE'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
                <div className="sm:col-span-1 w-full h-48 sm:h-auto overflow-hidden border-b-4 sm:border-b-0 sm:border-r-4 border-[#11100C]">
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125"
                  />
                </div>

                <div className="sm:col-span-2 p-4 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-[#7C2D18] uppercase block mb-2 sm:hidden">
                      {entry.location || 'HYDERABAD ARCHIVE'}
                    </span>

                    <h2 className="font-serif italic text-2xl sm:text-4xl md:text-5xl text-[#11100C] font-bold mb-3 leading-tight">
                      {entry.title}
                    </h2>

                    <p className="font-body text-sm sm:text-base text-[#11100C]/80 leading-relaxed mb-4 border-l-4 border-[#D19A24] pl-3 sm:pl-4">
                      {entry.excerpt || entry.content?.substring(0, 160) + '...'}
                    </p>

                    {isExpanded && (
                      <p className="font-body text-sm text-[#11100C]/90 leading-relaxed mb-4 pt-3 border-t border-[#11100C]/20">
                        {entry.content}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-[#11100C]/20 pt-3 sm:pt-4">
                    <div className="font-mono text-[9px] sm:text-xs font-bold text-[#7C2D18] uppercase">
                      TAGS: HERITAGE · ACOUSTIC · FIELD RECORDING
                    </div>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : entry.id)}
                      className="self-start sm:self-auto bg-[#11100C] text-[#E7D5A4] font-mono text-[10px] font-bold px-4 py-2 uppercase tracking-widest hover:bg-[#7C2D18] transition-colors border border-[#11100C]"
                    >
                      {isExpanded ? 'CLOSE ↑' : 'READ MORE →'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* CTA TO INNER CIRCLE */}
      <section className="bg-[#11100C] border-t-4 border-[#D19A24]/40 py-12 sm:py-16 px-4 sm:px-6 text-center">
        <span className="font-mono text-xs text-[#D19A24] tracking-[0.3em] uppercase font-bold block mb-3">
          NEVER MISS AN ENTRY
        </span>
        <h3 className="display text-3xl sm:text-5xl text-[#E7D5A4] mb-4">JOIN THE INNER CIRCLE</h3>
        <p className="font-mono text-xs text-[#E7D5A4]/70 max-w-lg mx-auto mb-6 leading-relaxed uppercase tracking-wider">
          Get diary entries, show announcements and early ticket access delivered directly to your inbox.
        </p>
        <a
          href="/inner-circle"
          className="inline-block bg-[#D19A24] text-[#11100C] font-mono font-bold text-xs px-6 py-3 uppercase tracking-widest hover:bg-[#E7D5A4] transition-colors border-2 border-[#D19A24]"
        >
          JOIN THE CIRCLE →
        </a>
      </section>

      <Footer />
    </div>
  );
};
