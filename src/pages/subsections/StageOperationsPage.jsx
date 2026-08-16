import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const StageOperationsPage = () => {
  return (
    <div className="min-h-screen bg-[#8a2320] text-[#ecdcaf] font-mono selection:bg-[#ecdcaf] selection:text-[#8a2320] overflow-x-hidden pt-16 pb-20">
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <a href="/crew" className="font-mono text-[10px] text-[#ecdcaf]/70 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors">← BACK TO CREW</a>

        <div className="mt-6 mb-8 bg-[#ecdcaf] text-[#191410] border-4 border-[#191410] p-6 sm:p-10 shadow-[10px_10px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-1">
            STAGE OPERATIONS
          </span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#191410] mb-4">HERITAGE STAGE LOGISTICS</h1>
          <p className="font-mono text-sm text-[#191410]/80 leading-relaxed mb-4 max-w-3xl">
            Operating inside 350-year-old stepwells requires zero structural impact. Our stage crew ensures
            instrument safety, artist hospitality, and seamless show flow from load-in to final encore.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs mt-6">
            <div className="bg-[#191410] text-[#ecdcaf] p-4 border border-[#191410]/30">
              <span className="text-[#c2272a] font-bold block mb-1">LOAD-IN &amp; RIGGING</span>
              <span className="text-[#ecdcaf]/70">Zero-impact staging methods for protected heritage structures.</span>
            </div>
            <div className="bg-[#191410] text-[#ecdcaf] p-4 border border-[#191410]/30">
              <span className="text-[#c2272a] font-bold block mb-1">ARTIST HOSPITALITY</span>
              <span className="text-[#ecdcaf]/70">Greenroom setup, instrument care, and cue-to-cue timing.</span>
            </div>
            <div className="bg-[#191410] text-[#ecdcaf] p-4 border border-[#191410]/30">
              <span className="text-[#c2272a] font-bold block mb-1">CROWD FLOW &amp; SAFETY</span>
              <span className="text-[#ecdcaf]/70">Entry, seating and exit choreography for stone stairways.</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/crew/apply" className="inline-block px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#ecdcaf] hover:text-[#191410] border-2 border-[#ecdcaf] transition-colors shadow-[4px_4px_0px_#191410]">
            JOIN STAGE CREW →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};
