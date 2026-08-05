import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { WarpedCheckerPattern } from '../ui/BackgroundDecorations';

export const UpcomingEvents = ({ onSelectBooking }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=300%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1
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
    <section ref={sectionRef} id="sessions" className="relative w-full h-screen bg-[#4B2D22] overflow-hidden flex items-center border-t-8 border-[#3A241A]">
      
      {/* SCREEN PRINTED PAPER TEXTURE & HALFTONE GRAIN */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-0" />

      {/* RETRO WARPED CHECKERBOARD ACCENT RIBBONS (TOP & BOTTOM BORDERS) */}
      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5">
        <WarpedCheckerPattern opacity={0.12} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none z-5">
        <WarpedCheckerPattern opacity={0.12} />
      </div>

      {/* CROP MARKS & ARCHIVE LABELS */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#D9C6A0] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // SESSIONS TICKETS
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#9E6D35] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REC • LIVE • HYDERABAD // 33⅓ RPM
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#D9C6A0]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT ALIGNMENT ✦ MASTER PRINT
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#D9C6A0] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      <div className="absolute top-10 left-12 right-12 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-auto">
        <div>
          <p className="font-mono text-[#9E6D35] text-[10px] tracking-[0.3em] font-bold uppercase">COLLECTIBLE CONCERT TICKETS // 1974 SERIES</p>
          <h2 className="font-poster text-5xl md:text-8xl text-[#D9C6A0] opacity-35 leading-none uppercase">SESSIONS</h2>
          <p className="font-handwritten text-lg text-[#D9C6A0] mt-1 max-w-xl">
            "Every session is designed around a place, a culture and a memory waiting to be experienced."
          </p>
        </div>
        <a 
          href="/sessions" 
          className="bg-[#9E6D35] text-[#35251A] hover:bg-[#D9C6A0] hover:text-[#35251A] border-2 border-[#35251A] px-4 py-2 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-archival shrink-0"
        >
          SESSIONS → VIEW MORE
        </a>
      </div>

      {/* Scrubbed Ticket Poster Track */}
      <div className="events-poster-track flex gap-12 md:gap-24 pl-[35vw] pr-[20vw] relative z-10 will-change-transform">
        {events.map((event, idx) => (
          <div key={event.id} className="shrink-0 w-[85vw] md:w-[450px] h-[68vh] md:h-[660px] relative group">
            
            {/* Vintage Collectible Ticket Stub Container */}
            <div className="w-full h-full bg-[#D9C6A0] p-5 shadow-archival border-4 border-[#35251A] flex flex-col relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
              
              {/* TICKET PERFORATED TEAR-OFF LINE */}
              <div className="absolute -top-3 right-16 w-8 h-3 bg-[#4B2D22] border-b-2 border-x-2 border-[#35251A] rounded-b-full z-20" />
              <div className="absolute -bottom-3 right-16 w-8 h-3 bg-[#4B2D22] border-t-2 border-x-2 border-[#35251A] rounded-t-full z-20" />
              <div className="absolute top-0 bottom-0 right-20 w-[2px] border-r-2 border-dashed border-[#35251A]/40 z-20 pointer-events-none" />

              {/* Masking Tape Overlay */}
              <div className="absolute -top-3 left-1/3 w-20 h-5 bg-[rgba(203,179,140,0.85)] rotate-[-2deg] border border-[#35251A]/30 z-30 pointer-events-none" />

              {/* Top Ticket Header */}
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#35251A] border-b-2 border-[#35251A]/30 pb-2 mb-3">
                <span>TANGY CONCERT SERIES</span>
                <span>TICKET #TK-1974-00{idx+1}</span>
              </div>

              {/* Ticket Photo */}
              <div className="w-full h-[52%] overflow-hidden relative border-2 border-[#35251A] bg-[#35251A]">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover scanned-photo group-hover:filter-none transition-all duration-700" />
                <div className="absolute top-2 right-2 bg-[#7A2B24] text-[#D9C6A0] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#9E6D35]">
                  REC • LIVE AT STEPWELL
                </div>
              </div>

              {/* Event Info & Perforated Ticket Stub Button */}
              <div className="mt-4 flex flex-col flex-grow text-[#35251A]">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="font-mono text-[13px] text-[#7A2B24] font-bold tracking-widest">{event.date}</p>
                  <p className="font-mono text-[10px] opacity-75">{event.time}</p>
                </div>
                
                <h3 className="font-poster text-3xl md:text-4xl text-[#35251A] leading-none mb-3 uppercase">{event.title}</h3>
                
                <div className="font-mono text-[9px] tracking-widest text-[#35251A] border-y border-[#35251A]/30 py-1.5 mb-4">
                  VENUE: {event.venue}<br/>
                  SOUND: {event.tags?.join(' / ')}
                </div>

                {/* Perforated Ticket Button */}
                <button 
                  onClick={() => handleBookClick(event)}
                  className="btn-ticket mt-auto w-full text-center flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#7A2B24] text-[#D9C6A0] hover:bg-[#35251A] border-2 border-[#35251A] py-2.5 px-3 transition-colors shadow-sm active:scale-95"
                >
                  <span>BOOK TICKETS</span>
                  <span>→</span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
