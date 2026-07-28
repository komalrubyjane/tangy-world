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
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.08, x: -40 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.08, x: 40 });
    gsap.set('.poster-title-hyderabad', { opacity: 0, scale: 1.08, y: 30 });
    gsap.set('.hero-musician-breakthrough', { opacity: 0, scale: 0.92, y: 60 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -100 });
    gsap.set('.hero-attached-ticket', { opacity: 0, y: 50 });
    gsap.set('.hero-corner-label', { opacity: 0 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-title-tangy', { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, x: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.poster-title-hyderabad', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.hero-musician-breakthrough', { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.6')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-corner-label', { opacity: 1, stagger: 0.08, duration: 0.5 }, '-=0.4')
      .to('.hero-attached-ticket', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { x: -30, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { x: 30, duration: 0.3 }, 0.1)
      .to('.hero-musician-breakthrough', { y: -20, scale: 1.03, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 18;
      const moveY = (clientY / window.innerHeight - 0.5) * 18;

      gsap.to('.hero-musician-breakthrough', { x: moveX * 0.3, y: moveY * 0.3, rotation: moveX * 0.05, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-mic-assembly', { x: moveX * 0.4, y: moveY * 0.4, rotation: moveX * 0.08, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-title-stack', { x: moveX * 0.1, y: moveY * 0.1, duration: 1.2, ease: 'power2.out' });
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
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#F6E7C3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // 1974 CHUNKY CONCERT POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#F2B533] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A ✦ VOL. 09
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#F6E7C3]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: IMPERFECT SCREEN PRINT ALIGNMENT ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#F6E7C3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOUR-CORNER EDITORIAL POSTER INFORMATION                      */}
      {/* ------------------------------------------------------------- */}
      {/* TOP LEFT */}
      <div className="hero-corner-label absolute top-14 left-6 md:top-10 md:left-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#F6E7C3] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5">
        <span>TANGY SESSIONS</span>
        <span className="text-[#F2B533]">HYDERABAD // EST. 2016</span>
      </div>

      {/* TOP RIGHT */}
      <div className="hero-corner-label absolute top-14 right-6 md:top-10 md:right-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#F6E7C3] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 text-right">
        <span>LIVE ARCHIVE</span>
        <span className="text-[#F2B533]">ISSUE 001 // SIDE A</span>
      </div>

      {/* BOTTOM LEFT */}
      <div className="hero-corner-label absolute bottom-14 left-6 md:bottom-10 md:left-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#F6E7C3] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 hidden md:flex">
        <span>UNDERGROUND SERIES</span>
        <span className="text-[#F2B533]">33⅓ RPM // PRINTED IN HYD</span>
      </div>

      {/* BOTTOM RIGHT */}
      <div className="hero-corner-label absolute bottom-14 right-6 md:bottom-10 md:right-10 z-30 font-mono text-[9px] md:text-[10.5px] font-bold text-[#F6E7C3] tracking-[0.25em] uppercase pointer-events-none flex flex-col gap-0.5 text-right hidden md:flex">
        <span>VOL. 09 // LIMITED PRINT</span>
        <span className="text-[#F2B533]">ANALOG SOUND</span>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND HANGING MICROPHONE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] md:w-[52vw] md:h-[52vw] rounded-full bg-[radial-gradient(circle,rgba(246,231,195,0.32)_0%,rgba(242,181,51,0.16)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* 1970S SCREEN-PRINTED CONCERT POSTER COMPOSITION                */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-full my-auto relative flex flex-col items-center justify-center z-20 h-full py-2 overflow-hidden"
      >
        
        {/* CHUNKY 900+ VINTAGE POSTER TYPOGRAPHY STACK (#F6E7C3 text + #111111 shadow + #F2B533 accent) */}
        <div className="hero-title-stack flex flex-col items-start w-full max-w-[1350px] px-4 md:px-10 relative z-15 my-auto">
          
          {/* TANGY — FULL VIEWPORT WIDTH (80% VIEWPORT HEIGHT) */}
          <h1 className="poster-title-tangy font-poster text-[clamp(6.5rem,22vw,19rem)] text-[#F6E7C3] leading-[0.72] tracking-tighter drop-shadow-[14px_14px_0px_#111111] select-none font-black uppercase self-start -ml-2 md:-ml-8">
            TANGY
          </h1>

          {/* SESSIONS — TUCKED UNDERNEATH & OVERLAPPING TANGY */}
          <h1 className="poster-title-sessions font-poster text-[clamp(5.2rem,17vw,15rem)] italic text-[#F2B533] font-black leading-[0.72] tracking-tight drop-shadow-[14px_14px_0px_#111111] -mt-4 md:-mt-12 select-none uppercase self-center md:self-end pr-4 md:pr-16">
            SESSIONS
          </h1>

          {/* HYDERABAD — TUCKED UNDERNEATH SESSIONS */}
          <h1 className="poster-title-hyderabad font-poster text-[clamp(2.5rem,7.5vw,6.5rem)] text-[#F6E7C3] font-bold leading-[0.8] tracking-widest drop-shadow-[8px_8px_0px_#111111] -mt-2 md:-mt-6 select-none uppercase self-end mr-6 md:mr-24 opacity-95">
            HYDERABAD
          </h1>

        </div>

        {/* TANGY MUSICIAN CUTOUT BREAKING THROUGH TYPOGRAPHY */}
        <div className="hero-musician-breakthrough absolute top-1/2 left-1/2 -translate-x-[48%] -translate-y-[48%] w-[290px] sm:w-[380px] md:w-[34vw] max-w-[460px] z-25 pointer-events-auto cursor-pointer group">
          <div className="relative bg-[#F6E7C3] p-3 sm:p-3.5 pb-9 sm:pb-11 border-4 border-[#111111] shadow-[22px_22px_0px_#111111] rotate-[-2.5deg] transition-all duration-300 group-hover:scale-103 group-hover:rotate-0">
            <PaperTape rotation="-4deg" width="w-24" className="absolute -top-3 left-1/3 z-30" />
            
            <div className="w-full aspect-[4/3] bg-[#111111] overflow-hidden border-2 border-[#111111] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Musician Performer" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#5A120D] text-[#F6E7C3] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#F2B533]">
                REC • LIVE AT STEPWELL
              </div>
            </div>

            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#111111] font-bold tracking-wider">
              <span>✎ BANSILALPET // 11:42 PM</span>
              <span className="bg-[#991B1B] text-[#F6E7C3] px-1.5 py-0.5 border border-black text-[7px] rotate-[2deg]">MUSICIAN CUTOUT</span>
            </div>
          </div>
        </div>

        {/* HANGING VINTAGE CHROME MICROPHONE ASSEMBLY (NO BLACK BOX) */}
        <div className="hero-mic-assembly absolute top-0 left-[48%] -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-36 md:h-48 bg-[#111111]" />
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
        <div className="hero-attached-ticket absolute bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-[35%] z-30">
          
          <div className="relative bg-[#F6E7C3] text-[#111111] border-4 border-[#111111] p-3.5 shadow-[12px_12px_0px_#111111] rotate-[-2deg] flex flex-col items-center gap-2 max-w-md w-[90vw] md:w-[420px]">
            
            <PaperTape rotation="-2deg" width="w-20" className="absolute -top-3 left-1/3 z-30" />

            <div className="absolute -top-3 right-8 w-16 h-2.5 bg-[#991B1B] border-b-2 border-x-2 border-[#111111] rounded-b-full z-20" />

            <div className="flex justify-between items-center w-full font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#315D73] border-b-2 border-[#111111] pb-1.5 uppercase">
              <span>ADMIT ONE // VOL. 09</span>
              <span>#TK-1974-001</span>
              <span>ARCHIVE NO. 001</span>
            </div>

            <button
              onClick={handleExploreClick}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#111111] text-[#F6E7C3] border-2 border-[#111111] py-3.5 px-6 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#991B1B] hover:text-[#F6E7C3] cursor-pointer"
            >
              <span>[ ENTER TANGY → ]</span>
              <span className="text-[#F2B533] font-black">✦</span>
            </button>
          </div>

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#F6E7C3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#111111]/20">
        <span className="truncate">UNDERGROUND SERIES • STEPWELL EDITION</span>
        <span className="hidden md:inline text-[#F2B533]">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
