import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Manifesto } from '../components/sections/Manifesto';
import { History } from '../components/sections/History';
import { Founders } from '../components/sections/Founders';
import { Spaces } from '../components/sections/Spaces';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      {/* ABOUT HERO — Responsive */}
      <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />

        {/* Giant faded watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.04]">
          <span className="font-display text-[20vw] leading-none text-[#E7D5A4] font-bold uppercase">ABOUT</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            ABOUT TANGY SESSIONS // EST. 2016 HYDERABAD
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-9xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            OUR STORY<br/>&amp; MANIFESTO
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-3 sm:py-4 uppercase">
            A RECORD OF EVERYTHING THAT HAPPENED IN BETWEEN THE MUSIC. HERITAGE SANCTUARIES, INDEPENDENT ARTISTS, AND UNAMPLIFIED SOUNDSCAPES.
          </p>

          {/* Quick section anchors */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
            {[
              { label: 'WHY TANGY', hash: '#manifesto' },
              { label: 'CHRONOLOGY', hash: '#history' },
              { label: 'OUR SPACES', hash: '#spaces' },
              { label: 'TANGY TEAM', hash: '#founders' }
            ].map((link) => (
              <a
                key={link.hash}
                href={link.hash}
                className="px-3 py-1.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#C99A2E]/60 text-[#C99A2E] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors"
              >
                {link.label} ↓
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TANGY NUMBERS STRIP */}
      <section className="bg-[#E7D5A4] border-y-4 border-[#11100C] py-5 sm:py-7 px-4 overflow-x-auto">
        <div className="flex gap-6 sm:gap-0 sm:grid sm:grid-cols-4 max-w-5xl mx-auto text-center min-w-max sm:min-w-0">
          {[
            { num: '2016', label: 'FOUNDED' },
            { num: '32+', label: 'SESSIONS HOSTED' },
            { num: '3', label: 'HERITAGE VENUES' },
            { num: '12K+', label: 'MUSIC LOVERS REACHED' }
          ].map((stat, i) => (
            <div key={i} className="text-center px-5 sm:border-r last:border-0 border-[#11100C]/20">
              <div className="display text-3xl sm:text-5xl text-[#11100C] leading-none">{stat.num}</div>
              <div className="font-mono text-[9px] sm:text-[10px] text-[#11100C]/60 tracking-[0.25em] uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FULL MANIFESTO SECTION */}
      <Manifesto />

      {/* COMPLETE CHRONOLOGY & TIMELINE */}
      <History />

      {/* SANCTUARY SPACES */}
      <Spaces />

      {/* TANGY TEAM & FOUNDERS */}
      <Founders />

      {/* MISSION & VISION SUMMARY CARD */}
      <section className="py-16 sm:py-24 bg-[#1C0E08] border-t-8 border-[#11100C] px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-[#F5E9C9] text-[#11100C] p-6 sm:p-10 md:p-14 border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-[#11100C] pb-3 mb-4 sm:mb-6 font-mono text-xs font-bold uppercase gap-1">
            <span>MISSION &amp; VISION</span>
            <span className="hidden sm:block">HYDERABAD CULTURAL ARCHIVE</span>
          </div>

          <h2 className="display text-3xl sm:text-5xl md:text-6xl text-[#11100C] mb-5 sm:mb-6 leading-tight">
            HERITAGE PRESERVATION THROUGH LIVE SOUND
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 font-body text-sm sm:text-base leading-relaxed text-justify">
            <p>
              Our mission is to revive historical monuments, 300-year-old stepwells, and Nizam-era courtyards by transforming them into intimate acoustic stages for independent musicians across India.
            </p>
            <p>
              We believe music is not a commodity to be consumed passively; it is an archival story connecting artists, architecture, and audience in a single unamplified moment.
            </p>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 border-t-2 border-[#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-mono text-xs font-bold">
            <span>DISPATCH NO. 1974-AB</span>
            <a
              href="/sessions"
              className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border-2 border-[#11100C] px-4 py-2 font-mono font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0"
            >
              EXPLORE SESSIONS →
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
