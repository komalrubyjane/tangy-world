import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { WarpedCheckerPattern } from '../ui/BackgroundDecorations';
import { PaperLabel, RetroPosterFrame } from '../ui/CulturalMotifs';
import { RangoliDecoration, PatternBackground, RetroGrain } from '../ui/RetroAssets';
import { PosterEventCard } from '../ui/PosterEventCard';

gsap.registerPlugin(ScrollTrigger);

export const UpcomingEvents = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();
  const { events: allEvents } = useEvents();
  const events = allEvents.filter((e) => e.dbStatus !== 'past').slice(0, 3);

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (isMobile) {
      gsap.from('.mobile-session-card', {
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.mobile-sessions-wrap',
          start: 'top 82%',
          toggleActions: 'play none none none',
        },
      });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
      },
    });
    tl.to('.events-poster-track', { xPercent: -70, ease: 'none' });
  }, []);

  const handleBookClick = (event) => {
    playSFX('ticketClick');
    if (onSelectBooking) onSelectBooking(event);
  };

  return (
    <section ref={sectionRef} id="sessions"
      className="relative w-full bg-[#B94717] border-t-8 border-[#11100C] overflow-hidden lg:h-screen lg:flex lg:items-center isolate">

      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-13 mix-blend-overlay pointer-events-none z-0" />
      <RetroGrain index={0} opacity={0.1} blend="overlay" />
      <PatternBackground category="textile" index={1} size="cover" blend="normal" className="z-0" />
      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5"><WarpedCheckerPattern opacity={0.12} /></div>
      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5"><WarpedCheckerPattern opacity={0.12} /></div>
      <RetroPosterFrame color="#11100C" inset={14} className="hidden md:block z-10" />
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <PaperLabel text="CROP MARK // SESSIONS TICKETS" color="#E7D5A4" textColor="#11100C" rotation="-1deg" />
      </div>

      {/* Giant outline edition numeral behind the section masthead — desktop only, real estate is tight on mobile */}
      <span
        className="hidden lg:block absolute top-[6%] right-[4%] font-display font-black leading-none text-transparent pointer-events-none select-none z-0"
        style={{ fontSize: 'clamp(160px,20vw,340px)', WebkitTextStroke: '2px rgba(231,213,164,0.14)' }}
        aria-hidden="true"
      >
        04
      </span>
      <div className="hidden lg:block absolute -bottom-[16vw] -left-[10vw] w-[38vw] h-[38vw] max-w-none opacity-[0.1] animate-[spin_170s_linear_infinite] pointer-events-none z-0">
        <RangoliDecoration index={1} spin={false} className="w-full h-full" />
      </div>

      {/* MOBILE-ONLY DECORATION — a real vertical textile strip on the left edge (the */}
      {/* desktop equivalent is horizontal checker strips top+bottom) plus a real cropped */}
      {/* Rangoli photo bleeding from the bottom-right of the card stack. */}
      <PatternBackground
        category="textile"
        index={1}
        opacity={0.5}
        size="90px"
        repeat
        className="lg:hidden !inset-y-0 !top-0 !bottom-0 !left-0 !right-auto !w-4 z-10"
      />
      <div className="lg:hidden absolute bottom-0 right-0 w-[40%] max-w-[180px] aspect-square opacity-[0.16] pointer-events-none z-0">
        <RangoliDecoration index={2} spin={false} className="w-full h-full" />
      </div>

      <div className="pt-24 lg:pt-0 lg:absolute lg:top-10 left-5 right-5 md:left-12 md:right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <p className="font-mono text-[#E7D5A4] text-[9px] sm:text-[10px] tracking-[0.3em] font-bold uppercase">COLLECTIBLE CONCERT TICKETS // 1974 SERIES</p>
          <h2 className="display text-5xl md:text-9xl text-[#E7D5A4] opacity-25 leading-none -rotate-1 origin-left">SESSIONS</h2>
        </div>
        <div className="hidden md:flex items-center gap-4">
          
          <a href="/sessions"
            className="bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4] border-2 border-[#11100C] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0 rotate-1">
            SESSIONS → VIEW MORE
          </a>
        </div>
      </div>

      {/* MOBILE vertical card stack */}
      <div className="mobile-sessions-wrap lg:hidden w-full px-5 pt-6 pb-16 flex flex-col gap-10 max-w-[400px] mx-auto">
        {events.map((event, idx) => (
          <div key={event.id} className="mobile-session-card w-full relative group">
            <PosterEventCard event={event} idx={idx} onBook={() => handleBookClick(event)} />
          </div>
        ))}
        <div className="flex justify-center pt-2">
          <a href="/sessions"
            className="bg-[#E7D5A4] text-[#11100C] border-2 border-[#11100C] px-6 py-3 font-mono text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0px_#11100C] active:scale-95">
            SESSIONS → VIEW MORE
          </a>
        </div>
      </div>

      {/* DESKTOP horizontal scrub track */}
      <div className="events-poster-track hidden lg:flex gap-24 pl-[35vw] pr-[20vw] items-center relative z-10 will-change-transform">
        {events.map((event, idx) => (
          <div key={event.id} className="shrink-0 w-[360px] self-center relative group">
            <PosterEventCard event={event} idx={idx} onBook={() => handleBookClick(event)} />
          </div>
        ))}
      </div>
    </section>
  );
};
