import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { events } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

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
    <section ref={sectionRef} id="sessions" className="relative w-full h-screen bg-[#B94717] overflow-hidden flex items-center border-t-8 border-[#11100C]">
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none z-0" />

      <div className="absolute top-12 left-12 z-20 pointer-events-none">
        <p className="font-mono text-tangy-paper text-[10px] tracking-[0.3em] font-bold uppercase">SCREEN-PRINTED CONCERT POSTERS</p>
        <h2 className="display text-6xl md:text-8xl text-tangy-paper opacity-30">SESSIONS</h2>
      </div>

      {/* Scrubbed Poster Track */}
      <div className="events-poster-track flex gap-12 md:gap-24 pl-[35vw] pr-[20vw] relative z-10 will-change-transform">
        {events.map((event, idx) => (
          <div key={event.id} className="shrink-0 w-[85vw] md:w-[450px] h-[68vh] md:h-[660px] relative group">
            
            {/* Vintage Screen-Printed Concert Poster Container */}
            <div className="w-full h-full bg-[#E7D5A4] p-5 shadow-[25px_25px_0px_#11100C] border-4 border-[#11100C] flex flex-col relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
              
              {/* Top Poster Header */}
              <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#11100C] border-b-2 border-[#11100C] pb-2 mb-3">
                <span>TANGY CONCERT SERIES</span>
                <span>NO. 0{idx+1}</span>
              </div>

              {/* Poster Image */}
              <div className="w-full h-[52%] overflow-hidden relative border-2 border-[#11100C] bg-black">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute top-2 right-2 bg-[#5A120D] text-[#E7D5A4] font-mono text-[8px] font-bold px-2 py-0.5 border border-tangy-mustard">
                  LIVE AT STEPWELL
                </div>
              </div>

              {/* Event Info */}
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

                {/* Perforated Admission Ticket Button */}
                <button 
                  onClick={() => handleBookClick(event)}
                  className="btn-ticket mt-auto w-full text-center"
                >
                  ADMIT ONE — BOOK ({event.price})
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
