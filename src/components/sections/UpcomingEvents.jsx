import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { WarpedCheckerPattern } from '../ui/BackgroundDecorations';

export const UpcomingEvents = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=300%',
        scrub: 0.5,
        pin: !isMobile,
        anticipatePin: isMobile ? 0 : 1
      }
    });

    tl.to('.events-poster-track', {
      xPercent: -70,
      ease: 'none'
    });

  }, []);

  const handleBookClick = (event) => {
    playSFX('ticketClick');
    if (onSelectBooking) {
      onSelectBooking(event);
    }
  };

  return (
    <section ref={sectionRef} id="sessions" className="relative w-full h-screen bg-[#B94717] overflow-hidden flex items-center border-t-8 border-[#11100C]">
      
      {/* SCREEN PRINTED PAPER TEXTURE & HALFTONE GRAIN */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-0" />

      {/* RETRO WARPED CHECKERBOARD ACCENT RIBBONS (TOP & BOTTOM BORDERS) */}
      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5">
        <WarpedCheckerPattern opacity={0.12} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5">
        <WarpedCheckerPattern opacity={0.12} />
      </div>

      {/* CROP MARKS & ARCHIVE LABELS */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#E7D5A4] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // SESSIONS TICKETS
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#C99A2E] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REC • LIVE • HYDERABAD // 33⅓ RPM
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#E7D5A4]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT ALIGNMENT ✦ MASTER PRINT
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#E7D5A4] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      <div className="absolute top-10 left-12 right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-auto">
        <div>
          <p className="font-mono text-[#E7D5A4] text-[10px] tracking-[0.3em] font-bold uppercase">COLLECTIBLE CONCERT TICKETS // 1974 SERIES</p>
          <h2 className="display text-5xl md:text-8xl text-[#E7D5A4] opacity-30 leading-none">SESSIONS</h2>
          <p className="font-serif italic text-xs md:text-sm text-[#E7D5A4]/90 mt-1 max-w-xl">
            "Every session is designed around a place, a culture and a memory waiting to be experienced."
          </p>
        </div>
        <a 
          href="/sessions" 
          className="bg-[#E7D5A4] text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4] border-2 border-[#11100C] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C] shrink-0"
        >
          SESSIONS → VIEW MORE
        </a>
      </div>

      {/* Scrubbed Ticket Poster Track */}
      <div className="events-poster-track flex gap-12 md:gap-24 pl-[35vw] pr-[20vw] relative z-10 will-change-transform">
        {events.map((event, idx) => (
          <div key={event.id} className="shrink-0 w-[85vw] md:w-[450px] h-[68vh] md:h-[660px] relative group">
            
            {/* Vintage Collectible Ticket Stub Container */}
            <div className="w-full h-full bg-[#E7D5A4] p-5 shadow-[25px_25px_0px_#11100C] border-4 border-[#11100C] flex flex-col relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
              
              {/* TICKET PERFORATED TEAR-OFF LINE */}
              <div className="absolute -top-3 right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
              <div className="absolute -bottom-3 right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
              <div className="absolute top-0 bottom-0 right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />

              {/* Masking Tape Overlay */}
              <div className="absolute -top-3 left-1/3 w-20 h-5 bg-[rgba(231,213,164,0.85)] rotate-[-2deg] border border-black/30 z-30 pointer-events-none" />

              {/* Top Ticket Header */}
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-3">
                <span>TANGY CONCERT SERIES</span>
                <span>TICKET #TK-1974-00{idx+1}</span>
              </div>

              {/* Ticket Photo */}
              <div className="w-full h-[52%] overflow-hidden relative border-2 border-[#11100C] bg-black">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-2 right-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#C99A2E]">
                  REC • LIVE AT STEPWELL
                </div>
              </div>

              {/* Event Info & Perforated Ticket Stub Button */}
              <div className="mt-4 flex flex-col flex-grow text-[#11100C]">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-mono text-[13px] text-[#B94717] font-bold tracking-widest">{event.date}</p>
                  <p className="font-mono text-[10px] opacity-70">{event.time}</p>
                </div>
                
                <h3 className="display font-bold text-3xl md:text-4xl text-[#11100C] leading-none mb-3 ink-bleed">{event.title.toUpperCase()}</h3>
                
                <div className="font-mono text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-1.5 mb-4">
                  VENUE: {event.venue}<br/>
                  SOUND: {event.tags?.join(' / ')}
                </div>

                {/* Perforated Ticket Button */}
                <button 
                  onClick={() => handleBookClick(event)}
                  className="btn-ticket mt-auto w-full text-center flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] hover:bg-[#11100C] border-2 border-[#11100C] py-2.5 px-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95"
                >
                  <span>BOOK TICKETS</span>
                  <span>→</span>
                </button>
              </div>

            </div>
          </div>
        ))}

        {/* ── EDITORIAL INFO CARD ── archival document placed with the ticket collection */}
        <div className="shrink-0 w-[85vw] md:w-[450px] h-[68vh] md:h-[660px] relative group">
          {/* Same physical ticket container language */}
          <div className="w-full h-full bg-[#EDE0C0] p-5 shadow-[25px_25px_0px_#11100C] border-4 border-[#11100C] flex flex-col relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[1deg]"
            style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}>

            {/* Same perforated tear-off details */}
            <div className="absolute -top-3 right-16 w-8 h-3 bg-[#B94717] border-b-2 border-x-2 border-[#11100C] rounded-b-full z-20" />
            <div className="absolute -bottom-3 right-16 w-8 h-3 bg-[#B94717] border-t-2 border-x-2 border-[#11100C] rounded-t-full z-20" />
            <div className="absolute top-0 bottom-0 right-20 w-[2px] border-r-2 border-dashed border-[#11100C]/40 z-20 pointer-events-none" />

            {/* Masking tape — slightly different angle for character */}
            <div className="absolute -top-3 left-1/4 w-24 h-5 bg-[rgba(231,213,164,0.75)] rotate-[1.5deg] border border-black/20 z-30 pointer-events-none" />

            {/* Paper imperfection — subtle aged stain */}
            <div className="absolute top-1/3 right-8 w-24 h-20 rounded-full opacity-[0.06] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, #7A4A28 0%, transparent 70%)' }} />

            {/* Top Header — same mono label system */}
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-5">
              <span>TANGY SESSIONS</span>
              <span className="text-[#B94717]">EST. 2016 · HYD</span>
            </div>

            {/* Small archival label */}
            <div className="font-mono text-[10px] text-[#B94717] font-bold tracking-[0.25em] uppercase mb-3">
              ✦ About This Series
            </div>

            {/* Main heading — display font matching session cards */}
            <h3 className="display font-bold text-4xl md:text-5xl text-[#11100C] leading-[0.92] mb-4 ink-bleed">
              Music.<br/>Heritage.<br/>Culture.
            </h3>

            {/* Description — serif italic matching section tone */}
            <p className="font-serif italic text-sm text-[#2A1A0E] leading-relaxed opacity-90 mb-4">
              "Live sessions, intimate gatherings and cultural experiences rooted in the soul of Hyderabad."
            </p>

            {/* Secondary archival info strip */}
            <div className="font-mono text-[9px] tracking-widest text-[#11100C] border-y border-[#11100C]/30 py-2 mb-auto">
              HYDERABAD • LIVE • INDEPENDENT
            </div>

            {/* Botanical doodle — inline SVG for tactile feel */}
            <svg className="absolute bottom-20 right-6 opacity-20 pointer-events-none" width="60" height="80" viewBox="0 0 60 80" fill="none" stroke="#2A1A0E" strokeWidth="1.2" strokeLinecap="round">
              <line x1="30" y1="80" x2="30" y2="30"/>
              <path d="M30,50 Q18,42 14,30 Q26,32 30,50"/>
              <path d="M30,40 Q42,32 46,20 Q34,22 30,40"/>
              <path d="M30,32 Q22,18 24,8 Q34,14 30,32"/>
              <ellipse cx="30" cy="7" rx="5" ry="7" strokeWidth="1"/>
              <line x1="14" y1="30" x2="8" y2="24"/>
              <line x1="46" y1="20" x2="52" y2="14"/>
            </svg>

            {/* CTA Button — matches BOOK TICKETS exactly */}
            <a
              href="/sessions"
              className="mt-4 w-full text-center flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#c2272a] text-[#ecdcaf] hover:bg-[#11100C] border-2 border-[#11100C] py-2.5 px-3 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95"
            >
              <span>VIEW OUR SESSIONS</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

    </section>
  );
};
