import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { ArchiveStamp } from '../ui/ArchiveStamp';
import { PaperTape } from '../ui/PaperTape';

export const Hero = () => {
  const { setFilterCutoff, playSFX } = useAudio();
  const heroContainerRef = useRef(null);

  const sectionRef = useGSAPContext((ctx) => {
    let impactTriggered = false;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=160%',
        scrub: 0.5,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          setFilterCutoff(400 + self.progress * 12000);

          if (self.progress > 0.35 && self.progress < 0.45 && !impactTriggered) {
            playSFX('ticketClick');
            impactTriggered = true;
          } else if (self.progress < 0.25) {
            impactTriggered = false;
          }
        }
      }
    });

    // -------------------------------------------------------------
    // POSTER UNFOLDING INTRO ANIMATION TIMELINE
    // -------------------------------------------------------------
    gsap.set('.hero-bg-texture', { opacity: 0 });
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.06, y: 35 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.06, y: 35 });
    gsap.set('.hero-single-musician', { opacity: 0, y: 90, scale: 0.94 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -90 });
    gsap.set('.hero-ticket-stub', { opacity: 0, y: 45 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-single-musician', { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-ticket-stub', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -15, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { y: 15, duration: 0.3 }, 0.1)
      .to('.hero-single-musician', { y: -20, scale: 1.02, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Musician Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 14;
      const moveY = (clientY / window.innerHeight - 0.5) * 14;

      gsap.to('.hero-single-musician', { x: moveX * 0.3, y: moveY * 0.3, rotation: moveX * 0.06, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-title-group', { x: moveX * 0.08, y: moveY * 0.08, duration: 1.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleExploreClick = () => {
    playSFX('ticketClick');
    document.querySelector('#manifesto')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef} 
      id="hero" 
      className="relative w-full max-w-full h-screen min-h-[680px] bg-[#B9471B] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* SCREEN-PRINTED HALFTONE PAPER TEXTURE & GRAIN */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // 1974 SCREEN-PRINTED POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A ✦
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EAD9A6]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: ALIGNED PRINT ✦ ARCHIVAL COPY
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* TOP EDITORIAL METADATA BAR & STAMP */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[11px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        <span className="flex items-center gap-2 truncate">
          <span className="text-[#315D73] font-black text-xs sm:text-sm">⊕</span> HYDERABAD // LIVE ARCHIVE
        </span>
        <ArchiveStamp text="REC • 33⅓ RPM" rotation="-2deg" color="gold" className="hidden sm:inline-block" />
        <span className="text-[#D19A24] shrink-0">EST. 2016 // STEPWELL EDITION</span>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND MUSICIAN */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] md:w-[42vw] md:h-[42vw] rounded-full bg-[radial-gradient(circle,rgba(234,217,166,0.25)_0%,rgba(209,154,36,0.12)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* VINTAGE 1970S SCREEN-PRINTED CONCERT POSTER COMPOSITION        */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-7xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-4"
      >
        
        {/* 1. GIANT POSTER TYPOGRAPHY "TANGY SESSIONS" (65-75% VIEWPORT HEIGHT) */}
        <div className="hero-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy display text-[clamp(5rem,15vw,13.5rem)] text-[#EAD9A6] leading-[0.76] tracking-tighter drop-shadow-[10px_10px_0px_#15120D] select-none">
            TANGY
          </h1>
          <h1 className="poster-title-sessions display text-[clamp(4.2rem,13vw,11.5rem)] italic text-[#D19A24] font-normal leading-[0.76] tracking-tight drop-shadow-[10px_10px_0px_#15120D] -mt-3 md:-mt-8 select-none">
            SESSIONS
          </h1>
        </div>

        {/* 2. ONE SINGLE DOMINANT MUSICIAN CUTOUT IMAGE (OVERLAPS TYPOGRAPHY) */}
        <div className="hero-single-musician absolute top-1/2 left-1/2 -translate-x-[48%] -translate-y-[46%] w-[300px] sm:w-[390px] md:w-[35vw] max-w-[480px] z-25 pointer-events-auto cursor-pointer group">
          
          {/* STICKER CUT-OUT FRAME WITH CREAM OUTLINE & PAPER TAPE OVERLAY */}
          <div className="relative bg-[#EAD9A6] p-3 sm:p-3.5 pb-9 sm:pb-11 border-4 border-[#15120D] shadow-[22px_22px_0px_#15120D] rotate-[-2.5deg] transition-all duration-300 group-hover:scale-102 group-hover:rotate-0">
            
            {/* Masking Tape Overlay */}
            <PaperTape rotation="-4deg" width="w-24" className="absolute -top-3 left-1/3 z-30" />
            
            {/* Single Expressive Musician Cutout Photo */}
            <div className="w-full aspect-[4/3] bg-[#15120D] overflow-hidden border-2 border-[#15120D] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Musician Performer" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#5A120D] text-[#EAD9A6] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#D19A24]">
                REC • LIVE AT STEPWELL
              </div>
            </div>

            {/* Sticker Caption Stamp */}
            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#15120D] font-bold tracking-wider">
              <span>✎ BANSILALPET // 11:42 PM</span>
              <span className="bg-[#B9471B] text-[#EAD9A6] px-1.5 py-0.5 border border-black text-[7px] rotate-[2deg]">SINGLE CUTOUT</span>
            </div>
          </div>

        </div>

        {/* 3. HANGING VINTAGE MICROPHONE ASSEMBLY */}
        <div className="hero-mic-assembly absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-28 md:h-36 bg-[#15120D]" />
          <div className="w-12 h-16 md:w-14 md:h-18 border border-black/40 rounded-b-xl shadow-2xl flex items-center justify-center bg-[linear-gradient(135deg,#999_0%,#222_40%,#666_70%,#111_100%)] p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img src="/media/vintage-mic.png" alt="Microphone" className="w-full h-full object-contain filter drop-shadow-lg" />
          </div>
        </div>

        {/* 4. DETACHABLE CONCERT TICKET STUB CTA */}
        <div className="hero-ticket-stub relative z-30 mt-auto pt-4 flex flex-col items-center gap-3">
          
          <div className="relative bg-[#EAD9A6] text-[#15120D] border-4 border-[#15120D] p-3 shadow-[8px_8px_0px_#15120D] flex flex-col items-center gap-2 max-w-md w-full">
            {/* Perforated Cut Line */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-2.5 bg-[#B9471B] border-b-2 border-x-2 border-[#15120D] rounded-b-full z-20" />

            <div className="flex justify-between items-center w-full font-mono text-[8px] sm:text-[9px] font-bold text-[#315D73] border-b-2 border-[#15120D] pb-1.5 uppercase">
              <span>ADMIT ONE // VOL. 01</span>
              <span>TICKET #TK-1974-001</span>
              <span>ARCHIVE NO. 001</span>
            </div>

            <button
              onClick={handleExploreClick}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#15120D] text-[#EAD9A6] border-2 border-[#15120D] py-3 px-6 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#B9471B] hover:text-[#EAD9A6] cursor-pointer"
            >
              <span>[ ENTER TANGY WORLD → ]</span>
              <span className="text-[#D19A24] font-black">✦</span>
            </button>
          </div>

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#15120D]/20">
        <span className="truncate">UNDERGROUND SERIES • STEPWELL EDITION</span>
        <span className="hidden md:inline text-[#315D73]">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
