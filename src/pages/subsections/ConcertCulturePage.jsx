import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const RULES = [
  { title: 'UNAMPLIFIED ACOUSTICS', desc: 'No loud artificial speakers. We collaborate with ancient limestone walls that naturally carry the sound for seconds.' },
  { title: 'NO PHONES IN THE AIR', desc: 'We ask all attendees to put away screens during performances. Be completely present in the physical room.' },
  { title: 'COLLECTIBLE TICKETS', desc: 'Every ticket is a physical hand-screenprinted artefact on 300gsm cotton paper for your archive.' }
];

export const ConcertCulturePage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/sessions" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO SESSIONS</a>
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
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {RULES.map((c, i) => (
            <div key={i} className="bg-[#1C0E08] border-2 border-[#C99A2E]/40 p-6 sm:p-8">
              <span className="font-mono text-xs font-bold text-[#C99A2E] block mb-2">RULE #0{i + 1}</span>
              <h3 className="display text-2xl sm:text-3xl text-[#E7D5A4] mb-2">{c.title}</h3>
              <p className="font-mono text-xs text-[#E7D5A4]/75 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 sm:mt-16 bg-[#F5E9C9] text-[#11100C] p-6 sm:p-10 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C]">
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

      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          NEXT STEPS
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/sessions/upcoming" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">UPCOMING SESSIONS →</a>
          <a href="/sessions/calendar" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">SESSION CALENDAR →</a>
          <a href="/sessions/waitlist" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">JOIN WAITLIST →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
