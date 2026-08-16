import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const ProductionTeamPage = () => {
  return (
    <div className="min-h-screen bg-[#8a2320] text-[#ecdcaf] font-mono selection:bg-[#ecdcaf] selection:text-[#8a2320] overflow-x-hidden pt-16 pb-20">
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar />

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <a href="/crew" className="font-mono text-[10px] text-[#ecdcaf]/70 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors">← BACK TO CREW</a>

        <div className="mt-6 mb-12 bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-10 shadow-[10px_10px_0px_#191410] text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-1">
            PRODUCTION TEAM
          </span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] mb-4">ANALOG AUDIO &amp; LIGHTING CREW</h1>
          <p className="font-mono text-sm text-[#ecdcaf]/80 leading-relaxed mb-6 max-w-3xl">
            Our production team handles vintage ribbon microphones, custom subwoofer rigs, acoustic baffling, and
            warm tungsten lighting setups tailored for ancient stone monuments. Every session is mapped by hand
            before the first artist arrives.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#241a12] p-4 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">AUDIO ENGINEERING</span>
              <span className="text-[#ecdcaf]/70">Sub-bass calibration &amp; room acoustic resonance mapping.</span>
            </div>
            <div className="bg-[#241a12] p-4 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">LIGHTING DIRECTION</span>
              <span className="text-[#ecdcaf]/70">Warm vintage candlelight and low-voltage architectural spots.</span>
            </div>
            <div className="bg-[#241a12] p-4 border border-[#ecdcaf]/30">
              <span className="text-[#c2272a] font-bold block mb-1">TAPE RECORDING</span>
              <span className="text-[#ecdcaf]/70">Live 2-track analogue magnetic tape capture.</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/crew/apply" className="inline-block px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#ecdcaf] hover:text-[#191410] border-2 border-[#ecdcaf] transition-colors shadow-[4px_4px_0px_#191410]">
            JOIN PRODUCTION CREW →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};
