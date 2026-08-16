import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { History } from '../../components/sections/History';

export const ChronologyPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-display text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">SINCE 2016</span>
        </div>
        <div className="relative z-10">
          <a href="/about" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ABOUT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            ABOUT TANGY SESSIONS // TEN YEARS OF NIGHTS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            CHRONOLOGY
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-3 sm:py-4 uppercase">
            FROM A SUBTERRANEAN ROOM WITH TWO SUBWOOFERS TO A DECADE OF HERITAGE SESSIONS ACROSS HYDERABAD.
          </p>
        </div>
      </section>

      <History />

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          CONTINUE READING
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/about/why-tangy" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">WHY TANGY →</a>
          <a href="/about/team" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">TANGY TEAM →</a>
          <a href="/about/full-story" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">FULL STORY →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
