import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { museumTimeline } from '../../data/mock/archive';

export const MuseumTimelinePage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/archive" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ARCHIVE</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            ARCHIVAL CHRONOLOGY
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            MUSEUM<br/>TIMELINE
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            TEN YEARS OF UNAMPLIFIED MUSIC IN HYDERABAD HERITAGE SPACES, MILESTONE BY MILESTONE.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative border-l-2 border-[#C99A2E]/40 ml-3 sm:ml-6 pl-6 sm:pl-10 flex flex-col gap-8 sm:gap-12">
          {museumTimeline.map((m, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#C99A2E] border-2 border-[#11100C]" />
              <div className="bg-[#E7D5A4] text-[#11100C] p-4 sm:p-6 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] sm:shadow-[8px_8px_0px_#11100C]">
                <span className="font-mono text-xs font-bold text-[#B94717] block mb-1">{m.year}</span>
                <h3 className="display text-xl sm:text-3xl text-[#11100C] mb-2">{m.title}</h3>
                <p className="font-mono text-[10px] sm:text-xs text-[#11100C]/80 leading-relaxed">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">EXPLORE MORE OF THE ARCHIVE</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/archive/session-archive" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">SESSION ARCHIVE →</a>
          <a href="/archive/past-memories" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">PAST MEMORIES →</a>
          <a href="/archive/contact-sheets" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">CONTACT SHEETS →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
