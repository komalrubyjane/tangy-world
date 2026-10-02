import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { TangyDiary } from '../../components/sections/TangyDiary';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

export const MuseumJournalPage = () => {
  usePageMeta({ title: 'Museum Journal', description: 'The interactive Tangy diary — turn each handwritten page.' });
  return (
    <div className="min-h-screen bg-[#211915] text-[#EADFC5] font-mono selection:bg-[#A68853] selection:text-[#241A14] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#A68853]/30">
        <div className="relative z-10">
          <PageCrumbs />
          <span className="font-mono text-[10px] sm:text-xs text-[#A68853] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            ARCHIVAL FIELD JOURNAL // FILE NO. 1974-TS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#EADFC5] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            MUSEUM<br/>JOURNAL
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#EADFC5]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#A68853]/30 py-3 sm:py-4 uppercase">
            THE INTERACTIVE TANGY DIARY — SCROLL OR SWIPE TO TURN EACH HANDWRITTEN PAGE.
          </p>
        </div>
      </section>

      <TangyDiary />

      <section className="py-12 sm:py-16 bg-[#211915] printNoise border-t-8 border-[#241A14] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#A68853] tracking-[0.3em] uppercase font-bold block mb-4">MORE FROM THE DIARY</span>
        <SectionNav section="Diary" />
      </section>

      <Footer />
    </div>
  );
};
