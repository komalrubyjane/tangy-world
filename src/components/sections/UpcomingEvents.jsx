import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { WarpedCheckerPattern } from '../ui/BackgroundDecorations';

gsap.registerPlugin(ScrollTrigger);

/* --- Shared ticket card inner --- */
const TicketCardInner = ({ event, idx, onBook }) => (
  <div className="w-full h-full bg-[#E7D5A4] p-5 border-4 border-[#11100C] flex flex-col relative shadow-[20px_20px_0px_#11100C] transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
    <div className="absolute -top-3 right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
    <div className="absolute -bottom-3 right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
    <div className="absolute top-0 bottom-0 right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />
    <div className="absolute -top-3 left-1/3 w-20 h-5 bg-[rgba(231,213,164,0.85)] rotate-[-2deg] border border-black/30 z-30 pointer-events-none" />
    <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-3">
      <span>TANGY CONCERT SERIES</span>
      <span>TICKET #TK-1974-00{idx + 1}</span>
    </div>
    <div className="w-full overflow-hidden relative border-2 border-[#11100C] bg-black shrink-0" style={{height:'42%'}}>
      <img src={event.image} alt={event.title} className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" />
      <div className="absolute top-2 right-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#C99A2E]">REC • LIVE AT STEPWELL</div>
    </div>
    <div className="mt-3 flex flex-col flex-grow text-[#11100C]">
      <div className="flex justify-between items-baseline mb-1">
        <p className="font-mono text-[12px] text-[#B94717] font-bold tracking-widest">{event.date}</p>
        <p className="font-mono text-[10px] opacity-70">{event.time}</p>
      </div>
      <h3 className="display font-bold text-2xl text-[#11100C] leading-none mb-2">{event.title.toUpperCase()}</h3>
      <div className="font-mono text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-1.5 mb-3">
        VENUE: {event.venue}<br />SOUND: {event.tags?.join(' / ')}
      </div>
      <button onClick={() => onBook(event)}
        className="mt-auto w-full flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] border-2 border-[#11100C] py-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95">
        <span>BOOK TICKETS</span><span>→</span>
      </button>
    </div>
  </div>
);

/* --- Shared editorial card inner --- */
const EditorialCardInner = () => (
  <div className="w-full h-full bg-[#EDE0C0] p-5 border-4 border-[#11100C] flex flex-col relative shadow-[20px_20px_0px_#11100C] transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[1deg]"
    style={{ backgroundImage:"url('/noise.png')", backgroundBlendMode:'multiply', backgroundSize:'180px' }}>
    <div className="absolute -top-3 right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
    <div className="absolute -bottom-3 right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
    <div className="absolute top-0 bottom-0 right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />
    <div className="absolute -top-3 left-1/4 w-24 h-5 bg-[rgba(231,213,164,0.75)] rotate-[1.5deg] border border-black/20 z-30 pointer-events-none" />
    <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-4">
      <span>TANGY SESSIONS</span><span className="text-[#B94717]">EST. 2016 · HYD</span>
    </div>
    <div className="font-mono text-[10px] text-[#B94717] font-bold tracking-[0.25em] uppercase mb-2">✦ About This Series</div>
    <h3 className="display font-bold text-3xl text-[#11100C] leading-[0.92] mb-3">Music.<br/>Heritage.<br/>Culture.</h3>
    <p className="font-serif italic text-sm text-[#2A1A0E] leading-relaxed opacity-90 mb-3">
      "Live sessions, intimate gatherings and cultural experiences rooted in the soul of Hyderabad."
    </p>
    <div className="font-mono text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-2 mb-auto">HYDERABAD • LIVE • INDEPENDENT</div>
    <svg className="absolute bottom-20 right-5 opacity-20 pointer-events-none" width="50" height="68" viewBox="0 0 60 80" fill="none" stroke="#2A1A0E" strokeWidth="1.2" strokeLinecap="round">
      <line x1="30" y1="80" x2="30" y2="30"/><path d="M30,50 Q18,42 14,30 Q26,32 30,50"/>
      <path d="M30,40 Q42,32 46,20 Q34,22 30,40"/><ellipse cx="30" cy="7" rx="5" ry="7" strokeWidth="1"/>
    </svg>
    <a href="/sessions"
      className="mt-3 w-full flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] border-2 border-[#11100C] py-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95">
      <span>VIEW OUR SESSIONS</span><span>→</span>
    </a>
  </div>
);

export const UpcomingEvents = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    if (isMobile) {
      gsap.from('.mobile-session-card', {
        opacity: 0,
        y: 48,
        duration: 0.65,
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
      className="relative w-full bg-[#B94717] border-t-8 border-[#11100C] overflow-hidden lg:h-screen lg:flex lg:items-center">

      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5"><WarpedCheckerPattern opacity={0.12} /></div>
      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5"><WarpedCheckerPattern opacity={0.12} /></div>
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#E7D5A4] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">[ ✚ ] CROP MARK // SESSIONS TICKETS</div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#C99A2E] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">REC • LIVE • HYDERABAD // 33⅓ RPM</div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#E7D5A4] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">PROPERTY OF TANGY SESSIONS</div>

      <div className="absolute top-10 left-5 right-5 md:left-12 md:right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <p className="font-mono text-[#E7D5A4] text-[10px] tracking-[0.3em] font-bold uppercase">COLLECTIBLE CONCERT TICKETS // 1974 SERIES</p>
          <h2 className="display text-4xl md:text-8xl text-[#E7D5A4] opacity-30 leading-none">SESSIONS</h2>
          <p className="font-serif italic text-xs text-[#E7D5A4]/90 mt-1 hidden md:block">
            "Every session is designed around a place, a culture and a memory."
          </p>
        </div>
        <a href="/sessions"
          className="hidden md:block bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4] border-2 border-[#11100C] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0">
          SESSIONS → VIEW MORE
        </a>
      </div>

      {/* MOBILE vertical card stack */}
      <div className="mobile-sessions-wrap lg:hidden w-full px-4 pt-36 pb-16 flex flex-col gap-8">
        {events.map((event, idx) => (
          <div key={event.id} className="mobile-session-card w-full relative group" style={{ height: 480 }}>
            <TicketCardInner event={event} idx={idx} onBook={handleBookClick} />
          </div>
        ))}
        <div className="mobile-session-card w-full relative group" style={{ height: 460 }}>
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
