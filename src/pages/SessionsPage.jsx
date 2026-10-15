import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionNav } from '../components/layout/SectionNav';
import { UpcomingSessionsGrid } from '../components/sessions/UpcomingSessionsGrid';
import { usePageMeta } from '../hooks/usePageMeta';
import { LAUNCH_MODE } from '../config/launch';
import { TemporarySession } from '../components/launch/TemporarySession';

// /sessions — Upcoming Sessions. Concert Culture, the Session Calendar and the
// Waitlist are their own pages (/sessions/concert-culture, /sessions/calendar,
// /sessions/waitlist), linked from the section navigation.
export const SessionsPage = () => {
  usePageMeta({ title: 'Upcoming Sessions', description: LAUNCH_MODE
    ? 'Tangy Sessions — live music in Hyderabad’s heritage spaces. Register for our next session.'
    : 'Upcoming Tangy sessions — live music in Hyderabad’s heritage spaces. Book tickets or join the waitlist.' });

  return (
    <div className="theme-sessions min-h-screen text-[#E7D5A4] font-mono selection:bg-[#181614] selection:text-[#E7D5A4] overflow-x-hidden printNoise">
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-20 md:pt-28 pb-10 px-4 sm:px-6 max-w-6xl mx-auto text-center border-b-2 border-[#11100C]">

        {/* Giant faded year watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-[0.08]">
          <span className="font-condensed text-[22vw] leading-none text-[#11100C] font-bold">2026</span>
        </div>

        <div className="relative z-10">
          <span className="font-mono text-xs text-[#E7D5A4]/80 tracking-[0.35em] uppercase font-bold mb-3 block">
            TANGY SESSIONS PROGRAMMING // 2026 CALENDAR
          </span>
          <h1 className="display text-5xl sm:text-8xl md:text-9xl text-[#E7D5A4] leading-none ink-bleed uppercase mb-4">
            UPCOMING<br/>SESSIONS
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-3xl mx-auto leading-relaxed border-y border-[#11100C] py-3 sm:py-4 uppercase">
            {LAUNCH_MODE
              ? 'NEW SESSIONS ARE COMING SOON. REGISTER FOR OUR NEXT SESSION BELOW.'
              : 'EVERY CONFIRMED SESSION ON THE 2026 CALENDAR, BOOKABLE DIRECTLY FROM THIS PAGE.'}
          </p>

          <SectionNav className="mt-6" />
        </div>
      </section>

      {/* Temporary launch: one designated session instead of the live listing. */}
      {LAUNCH_MODE ? <TemporarySession /> : <UpcomingSessionsGrid />}

      <Footer />
    </div>
  );
};
