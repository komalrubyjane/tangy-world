import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const FullStoryPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/about" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO ABOUT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            THE COMPLETE TANGY SESSIONS STORY // EST. 2016
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            THE FULL STORY
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-3 sm:py-4 uppercase">
            ONE LONG READ. TEN YEARS. THREE HERITAGE SANCTUARIES. A CITY THAT STOPPED, LISTENED, AND REMEMBERED.
          </p>
        </div>
      </section>

      {/* EDITORIAL LONG READ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <article className="max-w-3xl mx-auto bg-[#F5E9C9] text-[#11100C] p-6 sm:p-12 md:p-16 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#11100C] pb-3 mb-8 font-mono text-[10px] sm:text-xs font-bold uppercase gap-1">
            <span>DISPATCH NO. 0001-FS</span>
            <span>HYDERABAD, TELANGANA, INDIA</span>
          </div>

          <p className="font-mono text-[10px] text-[#B94717] font-bold uppercase tracking-[0.3em] mb-2">CHAPTER ONE</p>
          <h2 className="display text-3xl sm:text-4xl mb-4 leading-tight">A REFUSAL TO GO GENERIC</h2>
          <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-4">
            <p>
              Tangy Sessions began in 2016 in a subterranean room in Hyderabad, with forty people, two subwoofers,
              and a cassette deck. It was not meant to become anything more than a single good night. But that
              first evening carried a feeling the founders couldn't shake: that live music in this city had grown
              loud, generic, and disposable — big speaker rigs and bigger venues, but smaller and smaller moments
              of actual connection between artist, audience, and place. Tangy Sessions was built as a direct
              refusal of that drift.
            </p>
            <p>
              Instead of chasing scale, we went looking for architecture that already knew how to carry sound.
              Hyderabad — a city layered with Qutb Shahi, Nizam-era, and colonial-era structures — is full of
              spaces built centuries before amplification existed, and built to work without it. Stepwells,
              baradaris, havelis, courtyards: rooms designed by builders who understood reverb, echo, and stone
              resonance as a kind of architecture-as-instrument. We didn't need to add sound. We needed to stop
              drowning it out.
            </p>
          </div>

          <p className="font-mono text-[10px] text-[#B94717] font-bold uppercase tracking-[0.3em] mb-2 mt-10">CHAPTER TWO</p>
          <h2 className="display text-3xl sm:text-4xl mb-4 leading-tight">HERITAGE VENUES, FOUND AND RESTORED</h2>
          <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-4">
            <p>
              Our first real home was the Bansilalpet Stepwell in Secunderabad — a 17th-century water structure
              excavated from decades of rubble and neglect. Its tiered granite steps form a natural acoustic
              amphitheatre; sub-bass frequencies reflect off 350-year-old limestone walls with no amplifier
              required. We staged our first full session there in 2016 to eleven listeners and one violinist.
              By 2019, after a heritage conservation effort we helped champion, Bansilalpet reopened properly
              and became our flagship sanctuary.
            </p>
            <p>
              From there, the map grew. Taramati Baradari — a 17th-century pavilion built, according to legend,
              so a courtesan's singing could be heard two miles away at Golconda Fort — became our open-air
              hilltop stage. A private Nizam-era haveli courtyard off Charminar Lane, sheltered by carved
              teakwood pillars and Belgian glass lanterns, became our most intimate room. Three venues, three
              centuries, one governing rule: zero structural impact, zero amplification unless the building
              itself demands otherwise.
            </p>
          </div>

          <p className="font-mono text-[10px] text-[#B94717] font-bold uppercase tracking-[0.3em] mb-2 mt-10">CHAPTER THREE</p>
          <h2 className="display text-3xl sm:text-4xl mb-4 leading-tight">THE PHILOSOPHY: UNAMPLIFIED, UNDISTRACTED</h2>
          <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-4">
            <p>
              Every Tangy Session runs on three unofficial rules. No loud artificial speakers — we collaborate
              with the walls, not against them. No phones in the air — we ask every attendee to put screens away
              and be fully present in the physical room, for the length of one performance. And every ticket is
              a physical, hand-screenprinted artefact on 300gsm cotton paper, made to be kept rather than
              scanned and discarded. None of this is nostalgia for its own sake. It is a bet that a smaller,
              slower, more honest room produces a better night than a bigger, louder one.
            </p>
          </div>

          <p className="font-mono text-[10px] text-[#B94717] font-bold uppercase tracking-[0.3em] mb-2 mt-10">CHAPTER FOUR</p>
          <h2 className="display text-3xl sm:text-4xl mb-4 leading-tight">COMMUNITY, CREW, AND THE ARCHIVE</h2>
          <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-4">
            <p>
              None of this runs on founders alone. A rotating crew of volunteer photographers, sound engineers,
              backstage handlers, and ticketing staff — many of them students and early-career creatives from
              across Hyderabad — build every session from load-in to the last encore. In 2021 we began a
              systematic 35mm documentation practice, shooting a contact sheet of every night we host, so that
              a decade from now the archive can answer a simple question: what did it actually feel like to be
              in that room. By 2026, that archive holds more than thirty sessions, three restored heritage
              venues, and photographic, audio, and written records of a community that grew one unamplified
              night at a time.
            </p>
            <p>
              We are still, at heart, the same refusal we started with in 2016: live music doesn't have to be
              generic. It can be an archival story — connecting artist, architecture, and audience in a single
              unrepeatable moment. That is the whole of the Tangy Sessions mission, and it is why we keep
              digging up forgotten stepwells instead of building new stages.
            </p>
          </div>

          <div className="mt-10 pt-4 border-t-2 border-[#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono text-xs font-bold">
            <span>— THE TANGY SESSIONS FOUNDING TEAM, HYDERABAD</span>
            <a
              href="/sessions"
              className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border-2 border-[#11100C] px-4 py-2 font-mono font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0"
            >
              EXPLORE SESSIONS →
            </a>
          </div>
        </article>
      </section>

      {/* CROSS-LINKS */}
      <section className="py-12 sm:py-16 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6 text-center">
        <span className="font-mono text-[10px] text-[#C99A2E] tracking-[0.3em] uppercase font-bold block mb-4">
          READ THE INDIVIDUAL CHAPTERS
        </span>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/about/why-tangy" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">WHY TANGY →</a>
          <a href="/about/chronology" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">CHRONOLOGY →</a>
          <a href="/about/team" className="px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors">TANGY TEAM →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
