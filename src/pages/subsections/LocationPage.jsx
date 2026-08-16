import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const LocationPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <a href="/contact" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO CONTACT</a>
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            HERITAGE SANCTUARIES // HYDERABAD
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            LOCATION
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            WHERE TO FIND US — PRIMARY VENUE AND ROTATING HERITAGE SANCTUARIES ACROSS THE CITY.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-[#1C0E08] border-4 border-[#C99A2E] p-6 sm:p-10 mb-8 text-center">
          <span className="font-mono text-[9px] text-[#C99A2E] tracking-[0.3em] uppercase block mb-2 font-bold">
            PRIMARY HERITAGE SANCTUARY
          </span>
          <h3 className="display text-2xl sm:text-4xl text-[#E7D5A4] mb-2">BANSILALPET STEPWELL</h3>
          <p className="font-mono text-xs text-[#E7D5A4]/70">Bansilalpet, Secunderabad, Hyderabad, Telangana 500003</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {[
            { name: 'TARAMATI BARADARI', address: 'Ibrahim Bagh, Hyderabad, Telangana 500008' },
            { name: 'OLD CITY HAVELI COURTYARD', address: 'Charminar Lane, Hyderabad, Telangana 500002' }
          ].map((v) => (
            <div key={v.name} className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 sm:p-6 shadow-[6px_6px_0px_#11100C]">
              <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-wider mb-1 block">ROTATING VENUE</span>
              <h4 className="display text-xl sm:text-2xl text-[#11100C] mb-1">{v.name}</h4>
              <p className="font-mono text-xs text-[#11100C]/70">{v.address}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
