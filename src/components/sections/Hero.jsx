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
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.08, x: -40 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.08, x: 40 });
    gsap.set('.poster-title-hyderabad', { opacity: 0, scale: 1.08, y: 30 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -100 });
    gsap.set('.hero-attached-ticket', { opacity: 0, y: 50 });
    gsap.set('.hero-corner-label', { opacity: 0 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-title-tangy', { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.poster-title-hyderabad', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-corner-label', { opacity: 1, stagger: 0.08, duration: 0.5 }, '-=0.4')
      .to('.hero-attached-ticket', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { x: -30, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { x: 30, duration: 0.3 }, 0.1)
      .to('.hero-mic-assembly', { y: 15, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Layer Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 18;
      const moveY = (clientY / window.innerHeight - 0.5) * 18;

      gsap.to('.hero-mic-assembly', { x: moveX * 0.4, y: moveY * 0.4, rotation: moveX * 0.08, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-title-stack', { x: moveX * 0.1, y: moveY * 0.1, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-attached-ticket', { x: -moveX * 0.2, y: -moveY * 0.2, duration: 1.2, ease: 'power2.out' });
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
        [ ✚ ] CROP MARK // 1974 EDITORIAL CONCERT POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A ✦ VOL. 09
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EAD9A6]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: ASYMMETRIC MANUALLY ASSEMBLED PRINT ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOUR-CORNER EDITORIAL POSTER INFORMATION                      */}
      {/* ------------------------------------------------------------- */}
      {/* TOP LEFT */}
      <div className="hero-corner-label absolute top-14 left-6 md:top-10 md:left-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5">
        <span>TANGY SESSIONS</span>
        <span className="text-[#D19A24]">HYDERABAD // EST. 2016</span>
      </div>

      {/* TOP RIGHT */}
      <div className="hero-corner-label absolute top-14 right-6 md:top-10 md:right-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 text-right">
        <span>LIVE ARCHIVE</span>
        <span className="text-[#D19A24]">ISSUE 001 // SIDE A</span>
      </div>

      {/* BOTTOM LEFT */}
      <div className="hero-corner-label absolute bottom-14 left-6 md:bottom-10 md:left-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 hidden md:flex">
        <span>UNDERGROUND SERIES</span>
        <span className="text-[#D19A24]">33⅓ RPM // PRINTED IN HYD</span>
      </div>

      {/* BOTTOM RIGHT */}
      <div className="hero-corner-label absolute bottom-14 right-6 md:bottom-10 md:right-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 text-right hidden md:flex">
        <span>VOL. 09 // LIMITED PRINT</span>
        <span className="text-[#D19A24]">ANALOG SOUND</span>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND HANGING MICROPHONE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(234,217,166,0.3)_0%,rgba(209,154,36,0.15)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* ASYMMETRIC EDITORIAL CONCERT POSTER COMPOSITION                */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-full my-auto relative flex flex-col items-center justify-center z-20 h-full py-2 overflow-hidden"
      >
        
        {/* ASYMMETRIC STACKED EDITORIAL TYPOGRAPHY */}
        <div className="hero-title-stack flex flex-col items-start w-full max-w-[1300px] px-4 md:px-12 relative z-15 my-auto">
          
          {/* TANGY — FULL VIEWPORT WIDTH (PARTIALLY CROPPED) */}
          <h1 className="poster-title-tangy display text-[clamp(6.5rem,21vw,18rem)] text-[#EAD9A6] leading-[0.72] tracking-tighter drop-shadow-[14px_14px_0px_#15120D] select-none font-black uppercase self-start -ml-2 md:-ml-8">
            TANGY
          </h1>

          {/* SESSIONS — TUCKED UNDERNEATH & OVERLAPPING TANGY */}
          <h1 className="poster-title-sessions display text-[clamp(5rem,16vw,14rem)] italic text-[#D19A24] font-normal leading-[0.72] tracking-tight drop-shadow-[14px_14px_0px_#15120D] -mt-4 md:-mt-12 select-none uppercase self-center md:self-end pr-4 md:pr-16">
            SESSIONS
          </h1>

          {/* HYDERABAD — TUCKED UNDERNEATH SESSIONS */}
          <h1 className="poster-title-hyderabad display text-[clamp(2.5rem,7.5vw,6rem)] text-[#EAD9A6] font-bold leading-[0.8] tracking-widest drop-shadow-[8px_8px_0px_#15120D] -mt-2 md:-mt-6 select-none uppercase self-end mr-6 md:mr-24 opacity-90">
            HYDERABAD
          </h1>

        </div>

        {/* HANGING VINTAGE CHROME MICROPHONE ASSEMBLY (OVERLAPS TITLE) */}
        <div className="hero-mic-assembly absolute top-0 left-[48%] -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-36 md:h-48 bg-[#15120D]" />
          <div className="w-14 h-20 md:w-16 md:h-22 shadow-2xl flex items-center justify-center p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img 
              src="/media/vintage-mic.png" 
              alt="Microphone" 
              className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]" 
            />
          </div>
        </div>

        {/* 6–10 OVERLAPPING PHYSICAL ARTIFACTS */}
        <ArchiveStamp text="LIVE ARCHIVE" rotation="-6deg" color="gold" className="absolute top-[22%] left-[8%] md:left-[12%] z-25 shadow-lg" />
        <ArchiveStamp text="REC • 33⅓ RPM" rotation="4deg" color="red" className="absolute bottom-[28%] right-[8%] md:right-[15%] z-25 shadow-lg" />
        <PaperTape rotation="-3deg" width="w-24" className="absolute top-[18%] right-[18%] z-25 pointer-events-none hidden md:block" />

        {/* DETACHABLE TICKET STUB ATTACHED TO LOWER EDGE OF TYPOGRAPHY */}
        <div className="hero-attached-ticket absolute bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-[35%] z-30">
          
          <div className="relative bg-[#EAD9A6] text-[#15120D] border-4 border-[#15120D] p-3.5 shadow-[12px_12px_0px_#15120D] rotate-[-2deg] flex flex-col items-center gap-2 max-w-md w-[90vw] md:w-[420px]">
            
            {/* Paper Tape Overlay */}
            <PaperTape rotation="-2deg" width="w-20" className="absolute -top-3 left-1/3 z-30" />

            {/* Perforated Cut Line */}
            <div className="absolute -top-3 right-8 w-16 h-2.5 bg-[#991B1B] border-b-2 border-x-2 border-[#15120D] rounded-b-full z-20" />

            <div className="flex justify-between items-center w-full font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#315D73] border-b-2 border-[#15120D] pb-1.5 uppercase">
              <span>ADMIT ONE // VOL. 09</span>
              <span>#TK-1974-001</span>
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
