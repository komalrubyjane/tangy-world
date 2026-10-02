import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { ConcertCultureRules } from '../../components/sessions/ConcertCultureRules';
import { usePageMeta } from '../../hooks/usePageMeta';

export const ConcertCulturePage = () => {
  usePageMeta({ title: 'Concert Culture', description: 'The three rules behind every Tangy session — unamplified acoustics, no phones in the air and collectible tickets.' });
  return (
    <div className="theme-sessions min-h-screen text-[#E7D5A4] font-mono selection:bg-[#211915] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="relative z-10">
          <PageCrumbs />
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            THE TANGY PHILOSOPHY
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            CONCERT<br/>CULTURE
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            THE THREE RULES THAT GOVERN EVERY TANGY SESSION, AND WHY WE ENFORCE THEM.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <ConcertCultureRules />

        <div className="max-w-3xl mx-auto mt-12 sm:mt-16 bg-[#EFE2C0] paperTexture text-[#11100C] p-6 sm:p-10 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C]">
          <h2 className="display text-2xl sm:text-4xl mb-4">WHY IT MATTERS</h2>
          <p className="font-body text-sm sm:text-base leading-relaxed text-justify">
            None of this is nostalgia for its own sake. We built Tangy Sessions on a bet: that a smaller, slower,
            more honest room — one that trusts 350-year-old stone to do the acoustic work — produces a better
            night than a bigger, louder one ever could. Concert culture here means undivided attention, physical
            keepsakes over digital notifications, and a shared understanding that the room, not the rig, is the
            instrument.
          </p>
        </div>
      </section>

      <section className="theme-footer py-12 sm:py-16 printNoise border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          NEXT STEPS
        </span>
        <SectionNav section="Sessions" />
      </section>

      <Footer />
    </div>
  );
};
