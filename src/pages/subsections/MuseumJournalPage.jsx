import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { TangyDiary } from '../../components/sections/TangyDiary';

export const MuseumJournalPage = () => {
  return (
    <div className="min-h-screen bg-[#241A14] text-[#EADFC5] font-mono selection:bg-[#A68853] selection:text-[#241A14] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#A68853]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/diary" className="font-mono text-[10px] text-[#A68853]/70 tracking-widest uppercase hover:text-[#A68853] transition-colors">← BACK TO DIARY</a>
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

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#241A14] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#A68853] tracking-[0.3em] uppercase font-bold block mb-4">MORE FROM THE DIARY</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/diary/stories" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#A68853]/60 text-[#A68853] hover:bg-[#A68853] hover:text-[#1C0E08] transition-colors">RECENT STORIES →</a>
          <a href="/diary/behind-the-scenes" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#A68853]/60 text-[#A68853] hover:bg-[#A68853] hover:text-[#1C0E08] transition-colors">BEHIND THE SCENES →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
