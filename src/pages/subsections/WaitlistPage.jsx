import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useEvents } from '../../hooks/useEvents';
import { usePageMeta } from '../../hooks/usePageMeta';
import { WaitlistDirectory } from '../../components/booking/WaitlistDirectory';

export const WaitlistPage = () => {
  const { events, loading } = useEvents();
  usePageMeta({ title: 'Waitlist', description: 'Join the waitlist for sold-out Tangy sessions — released seats are offered in order and held for you.' });

  return (
    <div className="min-h-screen bg-[#181614] text-[#E7D5A4] font-mono selection:bg-[#211915] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="relative z-10">
          <a href="/sessions" className="font-mono text-[10px] text-[#C99A2E]/70 tracking-widest uppercase hover:text-[#C99A2E] transition-colors">← BACK TO SESSIONS</a>
          <span className="font-mono text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 mt-3 block">
            SOLD-OUT SESSIONS
          </span>
          <h1 className="display text-4xl sm:text-7xl md:text-8xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4 sm:mb-6">
            JOIN THE<br/>WAITLIST
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
            WHEN SEATS ARE RELEASED THEY'RE OFFERED IN WAITLIST ORDER AND HELD FOR YOU FOR A LIMITED TIME.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-[#EFE2C0] paperTexture text-[#11100C] p-6 sm:p-10 border-4 border-[#11100C] shadow-[12px_12px_0px_#B94717]">
          {loading ? <p className="m-0 text-center font-mono text-xs">Loading sessions…</p> : <WaitlistDirectory events={events} />}
        </div>
      </section>

      <Footer />
    </div>
  );
};
