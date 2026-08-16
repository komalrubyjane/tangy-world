import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { TangyAssistant } from '../components/ai/TangyAssistant';

export const AIAssistantPage = () => {
  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#B94717] selection:text-[#E7D5A4] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-14 px-4 sm:px-6 max-w-4xl mx-auto text-center border-b-2 border-[#C99A2E]/30">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-12 mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            ✦ MOCK KNOWLEDGE-BASE GUIDE // NOT A TRAINED AI
          </span>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-[#E7D5A4] leading-tight uppercase mb-4">
            TANGY ASSISTANT
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/40 py-3 sm:py-4 uppercase">
            Ask about tickets, sessions, artists, crew &amp; more. This is a structured lookup over a fixed set of
            Tangy answers — not a trained model, and not connected to any external AI. If it can't help, it can
            bring in the Tangy team.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-10 sm:py-14 max-w-2xl mx-auto">
        <TangyAssistant variant="page" />
      </section>

      <Footer />
    </div>
  );
};
