import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { contactSheets } from '../../data/mock/archive';

export const ContactSheetsPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/archive" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ARCHIVE</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            35MM FILM STRIP // NEGATIVE ROLLS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            CONTACT<br/>SHEETS
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            RAW 35MM ROLLS SHOT AT EVERY SESSION, UNEDITED, AS THEY CAME OFF THE NEGATIVE.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-12">
        {contactSheets.map((sheet) => (
          <div key={sheet.id} className="bg-[#1A1510] border-2 border-[#C99A2E]/40 p-3 sm:p-5">
            <div className="font-mono text-[10px] text-[#C99A2E] font-bold uppercase tracking-[0.3em] mb-3 flex justify-between items-center flex-wrap gap-1">
              <span>{sheet.roll}</span>
              <span className="text-[#E7D5A4]/50">35MM // KODAK 5247</span>
            </div>
            <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-black p-1.5 sm:p-2 border border-[#E7D5A4]/10">
              {sheet.frames.map((frame, i) => (
                <div key={i} className="relative aspect-[3/2] overflow-hidden border border-[#E7D5A4]/15">
                  <img src={frame} alt={`${sheet.roll} frame ${i + 1}`} className="w-full h-full object-cover filter grayscale sepia-[0.3] contrast-125" />
                  <span className="absolute bottom-0.5 right-1 font-mono text-[6px] sm:text-[7px] text-[#E7D5A4]/70 bg-black/60 px-1">{String(i + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">EXPLORE MORE OF THE ARCHIVE</span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/archive/session-archive" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">SESSION ARCHIVE →</a>
          <a href="/archive/museum-timeline" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">MUSEUM TIMELINE →</a>
          <a href="/archive/past-memories" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">PAST MEMORIES →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
