import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const Volunteer = ({ onApplyVolunteer, onApplyArtist }) => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%'
      }
    });

    // 1. Header Reveal
    tl.fromTo('.crew-header',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    )

    // 2. Posters Enter Asymmetrically
    .fromTo('.poster-volunteer',
      { x: -80, opacity: 0, rotation: -6 },
      { x: 0, opacity: 1, rotation: -1, duration: 0.8, ease: 'back.out(1.2)' }, 0.2
    )
    .fromTo('.poster-artist',
      { x: 80, opacity: 0, rotation: 6 },
      { x: 0, opacity: 1, rotation: 1, duration: 0.8, ease: 'back.out(1.2)' }, 0.3
    )

    // 3. Stamps Slap Down Last
    .fromTo('.crew-stamp-1',
      { scale: 1.8, opacity: 0, rotation: -25 },
      { scale: 1, opacity: 0.9, rotation: -8, duration: 0.4, ease: 'bounce.out' }, 0.8
    )
    .fromTo('.crew-stamp-2',
      { scale: 1.8, opacity: 0, rotation: 25 },
      { scale: 1, opacity: 0.9, rotation: 6, duration: 0.4, ease: 'bounce.out', onStart: () => playSFX('ticketClick') }, 0.9
    );

  }, []);

  const handleVolunteerClick = () => {
    playSFX('ticketClick');
    if (onApplyVolunteer) onApplyVolunteer();
  };

  const handleArtistClick = () => {
    playSFX('ticketClick');
    if (onApplyArtist) onApplyArtist();
  };

  return (
    <section 
      ref={sectionRef} 
      id="volunteer" 
      className="relative w-full py-28 md:py-36 bg-[#315B66] text-[#E7D7AC] overflow-hidden border-t-8 border-[#E7D7AC]"
    >
      
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

      {/* OVERSIZED BACKGROUND SCREEN-PRINTED WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none opacity-10">
        <span className="display text-[26vw] leading-none text-[#5F7D80] uppercase">WE WANT YOU</span>
      </div>

      {/* ARCHIVAL CORNER METADATA */}
      <div className="absolute top-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#C69A32] font-bold pointer-events-none uppercase hidden md:block">
        TANGY SESSIONS // RECRUITMENT
      </div>

      <div className="absolute top-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#E7D7AC]/70 pointer-events-none uppercase hidden md:block">
        HYDERABAD / EST. 2016
      </div>

      <div className="absolute bottom-8 left-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#E7D7AC]/70 pointer-events-none uppercase hidden md:block">
        PEOPLE MAKE THE SESSION.
      </div>

      <div className="absolute bottom-8 right-8 z-20 font-mono text-[9px] md:text-[10px] tracking-[0.25em] text-[#C69A32] font-bold pointer-events-none uppercase hidden md:block">
        VOL. 001 / FADED BLUE INK
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="crew-header max-w-4xl mx-auto text-center px-6 relative z-20 mb-16 md:mb-24">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#C69A32] tracking-[0.35em] uppercase mb-2 block">
          RECRUITMENT POSTER // 1970s BLUE SCREEN PRINT
        </span>
        <h2 className="display text-6xl md:text-9xl text-[#E7D7AC] leading-none ink-bleed mb-4">
          JOIN THE CREW
        </h2>
        <p className="font-mono text-xs md:text-sm text-[#E7D7AC]/90 tracking-[0.3em] uppercase border-y-2 border-[#17120D] py-2 inline-block px-6 bg-[#172E33]/80 backdrop-blur-xs">
          BEHIND THE SOUND · ON THE STAGE
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TWO SIDE-BY-SIDE RECRUITMENT POSTERS                          */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 relative z-20 items-stretch">

        {/* ----------------------------------------------------------- */}
        {/* POSTER 1: VOLUNTEER (MUSTARD STAMP & BUTTON)                 */}
        {/* ----------------------------------------------------------- */}
        <div className="poster-volunteer group bg-[#E7D7AC] text-[#17120D] p-8 md:p-14 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D] hover:shadow-[28px_28px_0px_#17120D] hover:-translate-y-2 hover:rotate-[-2deg] transition-all duration-300 relative flex flex-col justify-between">
          
          {/* Stamp */}
          <div className="crew-stamp-1 absolute -top-4 right-6 border-4 border-[#17120D] bg-[#C69A32] text-[#17120D] font-mono text-[10px] font-bold px-3 py-1 uppercase rotate-[-8deg] shadow-md z-30">
            CREW WANTED ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#315B66] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
              <span>RECRUITMENT // PATH 01</span>
              <span>BEHIND THE SCENES</span>
            </div>

            <h3 className="display text-5xl md:text-7xl text-[#17120D] leading-none mb-4 ink-bleed">
              VOLUNTEER
            </h3>

            <p className="font-body text-base md:text-lg text-[#17120D]/90 leading-relaxed italic border-l-4 border-[#C69A32] pl-4 mb-8">
              Help build the nights, the stories and everything that happens between them.
            </p>

            <div className="flex flex-wrap gap-2 mb-10 font-mono text-[9px] font-bold text-[#17120D]">
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">EVENTS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">PRODUCTION</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">CREATIVE</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">HOSPITALITY</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">COMMUNITY</span>
            </div>
          </div>

          {/* Volunteer Action Button (Mustard + Black Text) */}
          <button 
            onClick={handleVolunteerClick}
            className="btn-ticket w-full text-center !bg-[#C69A32] !text-[#17120D]"
          >
            APPLY AS VOLUNTEER →
          </button>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* POSTER 2: ARTIST (BURNT ORANGE STAMP & BUTTON)               */}
        {/* ----------------------------------------------------------- */}
        <div className="poster-artist group bg-[#E7D7AC] text-[#17120D] p-8 md:p-14 border-4 border-[#17120D] shadow-[20px_20px_0px_#17120D] hover:shadow-[28px_28px_0px_#17120D] hover:-translate-y-2 hover:rotate-[2deg] transition-all duration-300 relative flex flex-col justify-between">
          
          {/* Stamp */}
          <div className="crew-stamp-2 absolute -top-4 right-6 border-4 border-[#17120D] bg-[#B84718] text-[#E7D7AC] font-mono text-[10px] font-bold px-3 py-1 uppercase rotate-[6deg] shadow-md z-30">
            ARTISTS WANTED ✦
          </div>

          <div>
            <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#B84718] border-b-2 border-[#17120D] pb-3 mb-6 uppercase">
              <span>RECRUITMENT // PATH 02</span>
              <span>ON THE STAGE</span>
            </div>

            <h3 className="display text-5xl md:text-7xl text-[#17120D] leading-none mb-4 ink-bleed">
              ARTIST
            </h3>

            <p className="font-body text-base md:text-lg text-[#17120D]/90 leading-relaxed italic border-l-4 border-[#B84718] pl-4 mb-8">
              Bring your sound, your story and your energy into the Tangy world.
            </p>

            <div className="flex flex-wrap gap-2 mb-10 font-mono text-[9px] font-bold text-[#17120D]">
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">MUSICIANS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">DJs</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">BANDS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">PRODUCERS</span>
              <span className="bg-[#F5E9C9] border border-[#17120D] px-2.5 py-1 uppercase">PERFORMERS</span>
            </div>
          </div>

          {/* Artist Action Button (Burnt Orange + Cream Text) */}
          <button 
            onClick={handleArtistClick}
            className="btn-ticket w-full text-center !bg-[#B84718] !text-[#E7D7AC]"
          >
            APPLY AS ARTIST →
          </button>

        </div>

      </div>

    </section>
  );
};
