import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useEvents } from '../../hooks/useEvents';
import { useAudio } from '../../audio/AudioContext';
import { WarpedCheckerPattern } from '../ui/BackgroundDecorations';
import { PhotoTreatment } from '../ui/PhotoTreatment';
import { HandDrawnUnderline, PaperLabel, RetroPosterFrame } from '../ui/CulturalMotifs';
import { LotusStamp, RangoliDecoration, PatternBackground, PosterFragment, RetroGrain } from '../ui/RetroAssets';

gsap.registerPlugin(ScrollTrigger);

// Pulls a big day-of-month + month-abbreviation pair out of the event's ISO rawDate
// (added by useEvents) for the poster-scale date numeral; falls back to the already
// human-formatted `event.date` string if rawDate is ever missing.
const bigDate = (event) => {
  if (event.rawDate) {
    const d = new Date(`${event.rawDate}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return { day: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() };
    }
  }
  return { day: event.date, month: '' };
};

/* --- Shared ticket card inner --- */
const TicketCardInner = ({ event, idx, onBook }) => {
  const { day, month } = bigDate(event);
  const rotate = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
  return (
    <div className={`w-full h-full bg-[#E7D5A4] border-4 border-[#11100C] flex flex-col relative shadow-[10px_10px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] transition-transform duration-300 group-hover:-translate-y-2 overflow-hidden ${rotate}`}>
      <div className="absolute -top-3 right-12 sm:right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
      <div className="absolute -bottom-3 right-12 sm:right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
      <div className="absolute top-0 bottom-0 right-16 sm:right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />
      <div className="absolute -top-3 left-1/3 w-20 h-5 bg-[rgba(231,213,164,0.85)] rotate-[-2deg] border border-black/30 z-30 pointer-events-none" />

      <div className="flex justify-between items-center font-mono text-[8px] sm:text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] px-5 pt-5 pb-2 mb-0">
        <span>TANGY CONCERT SERIES</span>
        <span>TICKET #TK-1974-00{idx + 1}</span>
      </div>

      {/* PHOTO — full-bleed to the card edges (no inner border box), with an enormous */}
      {/* day numeral bleeding off its bottom edge like a physical event-poster date block. */}
      <div className="w-full overflow-hidden relative bg-black shrink-0 h-48 sm:h-52">
        <PhotoTreatment src={event.image} alt={event.title} className="w-full h-full" />

        <div className="absolute top-2 right-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#C99A2E]">
          REC • LIVE AT STEPWELL
        </div>

        {/* REAL LOTUS WAX SEAL */}
        <LotusStamp index={idx} border="#C99A2E" bg="#5A120D" className="absolute top-2 left-2 w-10 h-10 shadow-lg -rotate-6" />

        {/* ENORMOUS DATE — bleeds below the photo into the content area */}
        <div className="absolute -bottom-4 left-2 z-10 flex items-end gap-1.5 pointer-events-none">
          <span
            className="font-display font-black leading-[0.8] text-[#E7D5A4] drop-shadow-[3px_3px_0_#11100C]"
            style={{ fontSize: 'clamp(52px,9vw,84px)', WebkitTextStroke: '2px #11100C' }}
          >
            {day}
          </span>
          {month && (
            <span className="font-mono text-[10px] font-bold uppercase text-[#11100C] bg-[#E7D5A4] px-1.5 py-1 mb-2.5 rotate-[-3deg] border-2 border-[#11100C] shadow-[2px_2px_0_#11100C]">
              {month}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 px-5 pb-5 flex flex-col flex-grow text-[#11100C]">
        <div className="flex justify-between items-baseline mb-2">
          <p className="font-mono text-[10px] sm:text-[11px] text-[#B94717] font-bold tracking-widest">{event.date}</p>
          <p className="font-mono text-[9px] sm:text-[10px] opacity-70">{event.time}</p>
        </div>

        <h3 className="display font-bold text-2xl sm:text-2xl text-[#11100C] leading-none -rotate-1 origin-left">{event.title.toUpperCase()}</h3>
        <HandDrawnUnderline color="#B94717" className="w-28 h-2.5 mt-1 mb-2.5 opacity-70" />

        <div className="font-mono text-[9px] sm:text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-2 mb-4">
          VENUE: {event.venue}<br />SOUND: {event.tags?.join(' / ')}
        </div>

        <button onClick={() => onBook(event)}
          className="mt-auto w-full flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] border-2 border-[#11100C] py-3 sm:py-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95">
          <span>BOOK TICKETS</span><span>→</span>
        </button>
      </div>
    </div>
  );
};

/* --- Shared editorial card inner --- */
const EditorialCardInner = () => (
  <div className="w-full h-full bg-[#EDE0C0] p-4 sm:p-5 border-4 border-[#11100C] flex flex-col relative shadow-[16px_16px_0px_#11100C] sm:shadow-[20px_20px_0px_#11100C] transition-transform duration-300 group-hover:-translate-y-2 overflow-hidden rotate-1"
    style={{ backgroundImage:"url('/noise.png')", backgroundBlendMode:'multiply', backgroundSize:'180px' }}>
    <div className="absolute -right-[20%] -bottom-[15%] w-[65%] max-w-none aspect-square opacity-[0.14] pointer-events-none animate-[spin_120s_linear_infinite]">
      <RangoliDecoration index={2} spin={false} className="w-full h-full" />
    </div>
    <div className="absolute -top-3 right-12 sm:right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
    <div className="absolute -bottom-3 right-12 sm:right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
    <div className="absolute top-0 bottom-0 right-16 sm:right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />
    <div className="absolute -top-3 left-1/4 w-24 h-5 bg-[rgba(231,213,164,0.75)] rotate-[1.5deg] border border-black/20 z-30 pointer-events-none" />

    <div className="relative flex justify-between items-center font-mono text-[8.5px] sm:text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-1.5 mb-3">
      <span>TANGY SESSIONS</span><span className="text-[#B94717]">EST. 2016 · HYD</span>
    </div>

    <div className="relative font-mono text-[9px] sm:text-[10px] text-[#B94717] font-bold tracking-[0.25em] uppercase mb-2">✦ About This Series</div>

    <h3 className="relative display font-bold text-3xl sm:text-4xl text-[#11100C] leading-[0.85] mb-3 -rotate-1 origin-left">Music.<br/>Heritage.<br/>Culture.</h3>

    <p className="relative font-serif italic text-xs sm:text-sm text-[#2A1A0E] leading-relaxed opacity-90 mb-3">
      "Live sessions, intimate gatherings and cultural experiences rooted in the soul of Hyderabad."
    </p>

    <div className="relative font-mono text-[8.5px] sm:text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-2 mb-auto">HYDERABAD • LIVE • INDEPENDENT</div>

    <a href="/sessions"
      className="relative mt-3 w-full flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] border-2 border-[#11100C] py-2.5 sm:py-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95">
      <span>VIEW OUR SESSIONS</span><span>→</span>
    </a>
  </div>
);

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

      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-13 mix-blend-multiply pointer-events-none z-0" />
      <RetroGrain index={0} opacity={0.1} blend="multiply" />
      <PatternBackground category="textile" index={1} opacity={0.36} size="cover" blend="normal" className="z-0" />
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
          <PosterFragment category="posters" index={0} rotate={-6} tape className="hidden lg:block w-14" />
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
            <TicketCardInner event={event} idx={idx} onBook={handleBookClick} />
          </div>
        ))}
        <div className="mobile-session-card w-full relative group">
          <EditorialCardInner />
        </div>
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
          <div key={event.id} className="shrink-0 w-[450px] h-[660px] relative group">
            <TicketCardInner event={event} idx={idx} onBook={handleBookClick} />
          </div>
        ))}
        <div className="shrink-0 w-[450px] h-[660px] relative group">
          <EditorialCardInner />
        </div>
      </div>
    </section>
  );
};
