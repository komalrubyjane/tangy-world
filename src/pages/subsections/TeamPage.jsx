import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Founders } from '../../components/sections/Founders';

export const TeamPage = () => {
  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#211915] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-condensed text-[16vw] leading-none text-[#E7D5A4] font-bold uppercase">TEAM</span>
        </div>
        <div className="relative z-10">
          <a href="/about" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ABOUT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            ABOUT TANGY SESSIONS // PERSONNEL FILE
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            TANGY TEAM
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-3 sm:py-4 uppercase">
            THE FOUNDERS AND CURATORS BEHIND EVERY HERITAGE SESSION IN HYDERABAD.
          </p>
        </div>
      </section>

      <Founders />

      {/* TEAM — typography-based editorial cards (no photos on file for these members) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#181614] printNoise border-t-8 border-[#D19A24]">
        <div className="max-w-5xl mx-auto text-center mb-10 sm:mb-14">
          <span className="font-mono text-[10px] sm:text-xs font-bold text-[#D19A24] tracking-[0.35em] uppercase mb-2 block">
            OPENED ARCHIVAL DESK FOLDER // FILE 002
          </span>
          <h2 className="display text-5xl sm:text-7xl text-[#EAD9A6] leading-none ink-bleed">THE TEAM</h2>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-8 px-2">
          {[
            { name: 'Jhanavi', file: '002-A' },
            { name: 'Gopika', file: '002-B' },
            { name: 'Komal', file: '002-C' },
          ].map((member) => (
            <div
              key={member.name}
              className="relative bg-[#EFE2C0] paperTexture text-[#15120D] border-4 border-[#15120D] shadow-[8px_8px_0px_#15120D] p-6 pt-8 flex flex-col items-center text-center"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#181614] text-[#EAD9A6] px-3 py-1 font-mono text-[8px] font-bold uppercase tracking-widest border-t-2 border-x-2 border-[#D19A24] whitespace-nowrap">
                FILE {member.file}
              </div>
              <span className="font-serif italic text-3xl text-[#B9471B] leading-none mb-1">"</span>
              <h3 className="display text-3xl sm:text-4xl leading-none ink-bleed mb-3">{member.name.toUpperCase()}</h3>
              <span className="font-mono text-[10px] font-bold text-[#B9471B] tracking-[0.3em] uppercase border-t border-dashed border-[#15120D]/40 pt-2 mt-1 w-full">
                TEAM
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[#211915] printNoise border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          CONTINUE READING
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/about/why-tangy" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C89D35] hover:text-[#11100C] transition-colors">WHY TANGY →</a>
          <a href="/about/chronology" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C89D35] hover:text-[#11100C] transition-colors">CHRONOLOGY →</a>
          <a href="/about/full-story" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C89D35] hover:text-[#11100C] transition-colors">FULL STORY →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
