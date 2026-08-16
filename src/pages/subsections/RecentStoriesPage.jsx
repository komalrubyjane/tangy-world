import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { diaryStories } from '../../data/mock/diary';

export const RecentStoriesPage = () => {
  return (
    <div className="min-h-screen bg-[#1C0E08] text-[#E7D5A4] font-mono selection:bg-[#D19A24] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#D19A24]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/diary" className="font-mono text-[10px] text-[#D19A24]/70 tracking-widest uppercase hover:text-[#D19A24] transition-colors">← BACK TO DIARY</a>
          <span className="font-mono text-xs text-[#D19A24] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            TANGY EDITORIALS // LATEST DISPATCHES
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            RECENT<br/>STORIES
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#D19A24]/30 py-3 sm:py-4 uppercase">
            THE LATEST FIELD NOTES, SESSION RECAPS, AND ARCHIVE UPDATES FROM THE TANGY DESK.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
        {diaryStories.map((story, idx) => (
          <article key={story.id} className="bg-[#F2E5C6] text-[#11100C] border-4 border-[#11100C] shadow-[6px_6px_0px_#11100C] flex flex-col overflow-hidden">
            <div className="w-full h-40 overflow-hidden border-b-4 border-[#11100C]">
              <img src={story.image} alt={story.title} className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125" />
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <span className="font-mono text-[9px] font-bold text-[#7C2D18] uppercase mb-2">ENTRY #00{idx + 1} · {story.date}</span>
              <h2 className="font-serif italic text-lg sm:text-xl text-[#11100C] font-bold mb-2 leading-tight">{story.title}</h2>
              <p className="font-body text-xs sm:text-sm text-[#11100C]/80 leading-relaxed flex-1">{story.excerpt}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="py-12 sm:py-16 bg-[#11100C] border-t-4 border-[#D19A24]/40 px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#D19A24] tracking-[0.3em] uppercase font-bold block mb-4">MORE FROM THE DIARY</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/diary/journal" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#D19A24]/60 text-[#D19A24] hover:bg-[#D19A24] hover:text-[#11100C] transition-colors">MUSEUM JOURNAL →</a>
          <a href="/diary/behind-the-scenes" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#D19A24]/60 text-[#D19A24] hover:bg-[#D19A24] hover:text-[#11100C] transition-colors">BEHIND THE SCENES →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
