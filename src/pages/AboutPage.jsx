import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Manifesto } from '../components/sections/Manifesto';
import { History } from '../components/sections/History';
import { Founders } from '../components/sections/Founders';
import { Spaces } from '../components/sections/Spaces';

export const AboutPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4]">
      <Navbar />

      {/* ABOUT HERO */}
      <section className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
          ABOUT TANGY SESSIONS // EST. 2016 HYDERABAD
        </span>
        <h1 className="display text-6xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-6">
          OUR STORY & MANIFESTO
        </h1>
        <p className="font-mono text-sm md:text-base text-[#E7D5A4]/90 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-4 uppercase">
          A RECORD OF EVERYTHING THAT HAPPENED IN BETWEEN THE MUSIC. HERITAGE SANCTUARIES, INDEPENDENT ARTISTS, AND UNAMPLIFIED SOUNDSCAPES.
        </p>
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
      <section className="py-24 bg-[#1C0E08] border-t-8 border-[#11100C] px-6">
        <div className="max-w-4xl mx-auto bg-[#F5E9C9] text-[#11100C] p-8 md:p-14 border-4 border-[#11100C] shadow-[20px_20px_0px_#11100C]">
          <div className="flex justify-between items-center border-b-2 border-[#11100C] pb-3 mb-6 font-mono text-xs font-bold uppercase">
            <span>MISSION & VISION</span>
            <span>HYDERABAD CULTURAL ARCHIVE</span>
          </div>
          <h2 className="display text-4xl md:text-6xl text-[#11100C] mb-6">HERITAGE PRESERVATION THROUGH LIVE SOUND</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-body text-base leading-relaxed text-justify">
            <p>
              Our mission is to revive historical monuments, 300-year-old stepwells, and Nizam-era courtyards by transforming them into intimate acoustic stages for independent musicians across India.
            </p>
            <p>
              We believe music is not a commodity to be consumed passively; it is an archival story connecting artists, architecture, and audience in a single unamplified moment.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t-2 border-[#11100C] flex justify-between items-center font-mono text-xs font-bold">
            <span>DISPATCH NO. 1974-AB</span>
            <a href="/sessions" className="btn-ticket py-2 px-4 !bg-[#B94717] !text-[#E7D5A4] uppercase">EXPLORE SESSIONS →</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
