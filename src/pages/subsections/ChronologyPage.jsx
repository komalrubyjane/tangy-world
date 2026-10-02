import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { History } from '../../components/sections/History';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

export const ChronologyPage = () => {
  usePageMeta({ title: 'Chronology', description: 'How Tangy Sessions grew, year by year.' });
  return (
    <div className="theme-inner min-h-screen text-[#E7D5A4] font-mono selection:bg-[#211915] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-condensed text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">SINCE 2016</span>
        </div>
        <div className="relative z-10">
          <PageCrumbs />
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

      <section className="theme-footer py-12 sm:py-16 printNoise border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          CONTINUE READING
        </span>
        <SectionNav section="About" />
      </section>

      <Footer />
    </div>
  );
};
