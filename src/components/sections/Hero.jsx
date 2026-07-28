import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
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
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.08, y: 40 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.08, y: 40 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -100 });
    gsap.set('.hero-ticket-stub', { opacity: 0, y: 50 });
    gsap.set('.hero-label-stamp', { opacity: 0, scale: 1.5 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-label-stamp', { opacity: 1, scale: 1, duration: 0.5, ease: 'bounce.out' }, '-=0.4')
      .to('.hero-ticket-stub', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -20, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { y: 20, duration: 0.3 }, 0.1)
      .to('.hero-mic-assembly', { y: 15, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Mic & Title Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 16;
      const moveY = (clientY / window.innerHeight - 0.5) * 16;

      gsap.to('.hero-mic-assembly', { x: moveX * 0.4, y: moveY * 0.4, rotation: moveX * 0.08, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-title-group', { x: moveX * 0.1, y: moveY * 0.1, duration: 1.2, ease: 'power2.out' });
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
      className="relative w-full max-w-full h-screen min-h-[720px] bg-[#991B1B] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* DEEP VINTAGE RED SCREEN-PRINTED HALFTONE PAPER TEXTURE & GRAIN */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // 1974 RED CONCERT POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A ✦ ISSUE 001
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EAD9A6]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT PRINT ALIGNMENT ✦ DEEP INK
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* TOP EDITORIAL METADATA BAR & STAMP */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[11px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        <span className="flex items-center gap-2 truncate">
          <span className="text-[#D19A24] font-black text-xs sm:text-sm">⊕</span> HYDERABAD // LIVE ARCHIVE
        </span>
        <ArchiveStamp text="REC • 33⅓ RPM" rotation="-2deg" color="gold" className="hero-label-stamp hidden sm:inline-block" />
        <span className="text-[#D19A24] shrink-0">EST. 2016 // STEPWELL EDITION</span>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND HANGING MICROPHONE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full bg-[radial-gradient(circle,rgba(234,217,166,0.28)_0%,rgba(209,154,36,0.14)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* 100% TYPOGRAPHY-DOMINANT CONCERT POSTER ARTWORK               */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-7xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-2"
      >
        
        {/* MASSIVE CHUNKY VINTAGE POSTER TYPOGRAPHY (80% VIEWPORT HEIGHT) */}
        <div className="hero-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy display text-[clamp(6rem,19vw,16rem)] text-[#EAD9A6] leading-[0.72] tracking-tighter drop-shadow-[14px_14px_0px_#15120D] select-none font-black uppercase">
            TANGY
          </h1>
          <h1 className="poster-title-sessions display text-[clamp(5rem,16vw,14rem)] italic text-[#D19A24] font-normal leading-[0.72] tracking-tight drop-shadow-[14px_14px_0px_#15120D] -mt-4 md:-mt-10 select-none uppercase">
            SESSIONS
          </h1>
        </div>

        {/* HANGING VINTAGE CHROME MICROPHONE ASSEMBLY (NO BLACK BOX) */}
        <div className="hero-mic-assembly absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-32 md:h-44 bg-[#15120D]" />
          <div className="w-14 h-20 md:w-16 md:h-22 shadow-2xl flex items-center justify-center p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img 
              src="/media/vintage-mic.png" 
              alt="Microphone" 
              className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]" 
            />
          </div>
        </div>

        {/* DETACHABLE CONCERT TICKET STUB CTA */}
        <div className="hero-ticket-stub relative z-30 mt-auto pt-4 flex flex-col items-center gap-3">
          
          <div className="relative bg-[#EAD9A6] text-[#15120D] border-4 border-[#15120D] p-3.5 shadow-[10px_10px_0px_#15120D] flex flex-col items-center gap-2 max-w-md w-full">
            
            {/* Perforated Cut Line */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-3 bg-[#991B1B] border-b-2 border-x-2 border-[#15120D] rounded-b-full z-20" />

            <div className="flex justify-between items-center w-full font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#315D73] border-b-2 border-[#15120D] pb-1.5 uppercase">
              <span>ADMIT ONE // VOL. 01</span>
              <span>TICKET #TK-1974-001</span>
              <span>ARCHIVE NO. 001</span>
            </div>

            <button
              onClick={handleExploreClick}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#15120D] text-[#EAD9A6] border-2 border-[#15120D] py-3.5 px-6 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#991B1B] hover:text-[#EAD9A6] cursor-pointer"
            >
              <span>[ ENTER TANGY → ]</span>
              <span className="text-[#D19A24] font-black">✦</span>
            </button>
          </div>

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#15120D]/20">
        <span className="truncate">UNDERGROUND SERIES • STEPWELL EDITION</span>
        <span className="hidden md:inline text-[#D19A24]">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
