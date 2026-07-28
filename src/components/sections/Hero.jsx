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
    // POSTER INTRO ANIMATION TIMELINE
    // -------------------------------------------------------------
    gsap.set('.hero-bg-texture', { opacity: 0 });
    gsap.set('.poster-top-tagline', { opacity: 0, y: -20 });
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.06, y: 30 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.06, y: 30 });
    gsap.set('.poster-performer-cutout', { opacity: 0, scale: 0.9, y: 60 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -90 });
    gsap.set('.poster-bottom-metadata', { opacity: 0, y: 30 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-top-tagline', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.poster-performer-cutout', { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.6')
      .to('.poster-bottom-metadata', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -15, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { y: 15, duration: 0.3 }, 0.1)
      .to('.poster-performer-cutout', { y: -25, scale: 1.03, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 16;
      const moveY = (clientY / window.innerHeight - 0.5) * 16;

      gsap.to('.poster-performer-cutout', { x: moveX * 0.3, y: moveY * 0.3, rotation: moveX * 0.05, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-mic-assembly', { x: moveX * 0.4, y: moveY * 0.4, rotation: moveX * 0.08, duration: 1.2, ease: 'power2.out' });
      gsap.to('.poster-title-group', { x: moveX * 0.08, y: moveY * 0.08, duration: 1.2, ease: 'power2.out' });
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
      className="relative w-full max-w-full h-screen min-h-[720px] bg-[#C8102E] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* DEEP VIBRANT CRIMSON RED PAPER GRAIN & HALFTONE OVERLAY */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // GIRLS NIGHT REFERENCE POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A ✦ ISSUE 001
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#FDF6E3]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT ALIGNED SCREEN PRINT ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND MUSICIAN CUTOUT */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(253,246,227,0.32)_0%,rgba(209,154,36,0.15)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* POSTER TOP PILL TAGLINE: • LIVE MUSIC ARCHIVE, HYDERABAD •    */}
      {/* ------------------------------------------------------------- */}
      <div className="poster-top-tagline w-full text-center z-30 pt-14 md:pt-4">
        <span className="font-mono text-[10px] md:text-xs font-bold text-[#FDF6E3] tracking-[0.3em] uppercase bg-[#11100C]/30 px-5 py-1.5 border border-[#FDF6E3]/30 rounded-full inline-block backdrop-blur-xs">
          • LIVE MUSIC ARCHIVE, HYDERABAD •
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CONCERT POSTER COMPOSITION                                    */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-6xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-2 overflow-hidden"
      >
        
        {/* 1. ULTRA-CHUNKY 70S BUBBLE DISPLAY TITLE "TANGY SESSIONS" */}
        <div className="poster-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy font-poster text-[clamp(6rem,19vw,16rem)] text-[#FDF6E3] leading-[0.75] tracking-tighter drop-shadow-[10px_10px_0px_#11100C] select-none font-black uppercase">
            TANGY
          </h1>
          <h1 className="poster-title-sessions font-poster text-[clamp(5.2rem,16vw,14rem)] text-[#FDF6E3] font-black leading-[0.75] tracking-tight drop-shadow-[10px_10px_0px_#11100C] -mt-4 md:-mt-10 select-none uppercase">
            SESSIONS
          </h1>
        </div>

        {/* 2. CENTRAL PERFORMER CUTOUT WITH THICK WHITE PAPER STICKER BORDER */}
        <div className="poster-performer-cutout absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[310px] sm:w-[410px] md:w-[36vw] max-w-[480px] z-25 pointer-events-auto cursor-pointer group">
          
          {/* THICK WHITE PAPER STICKER OUTLINE BORDER CONTAINER */}
          <div className="relative p-2 rounded-2xl bg-[#FDF6E3] shadow-[0_0_0_10px_#FDF6E3,0_0_0_12px_#11100C,0_20px_40px_rgba(0,0,0,0.65)] rotate-[-1.5deg] transition-all duration-300 group-hover:scale-103 group-hover:rotate-0">
            
            {/* Paper Tape Accent */}
            <PaperTape rotation="-4deg" width="w-24" className="absolute -top-4 left-1/3 z-30" />

            <div className="w-full aspect-[4/3] bg-[#11100C] overflow-hidden rounded-xl border-2 border-[#11100C] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Live Performer Cutout" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#C8102E] text-[#FDF6E3] font-mono text-[8px] font-bold px-2.5 py-0.5 border border-[#FDF6E3] rounded-full">
                REC • LIVE
              </div>
            </div>

            {/* Sticker Caption Stamp */}
            <div className="mt-2 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#11100C] font-bold tracking-wider px-1">
              <span>✎ BANSILALPET STEPWELL // 22h</span>
              <span className="bg-[#C8102E] text-[#FDF6E3] px-2 py-0.5 border border-black text-[7.5px] font-bold rounded-sm uppercase">STICKER CUTOUT</span>
            </div>

          </div>

        </div>

        {/* 3. HANGING VINTAGE CHROME MICROPHONE ASSEMBLY */}
        <div className="hero-mic-assembly absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-32 md:h-44 bg-[#11100C]" />
          <div className="w-14 h-20 md:w-16 md:h-22 shadow-2xl flex items-center justify-center p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img 
              src="/media/vintage-mic.png" 
              alt="Microphone" 
              className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]" 
            />
          </div>
        </div>

        {/* 4. BOTTOM POSTER METADATA & LINEUP */}
        <div className="poster-bottom-metadata absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center text-center gap-3 w-full max-w-xl px-4">
          
          <div className="flex flex-col items-center">
            <h2 className="font-poster text-2xl sm:text-4xl text-[#FDF6E3] tracking-tight uppercase drop-shadow-[4px_4px_0px_#11100C]">
              TANGY SESSIONS
            </h2>
            <p className="font-mono text-[10px] sm:text-xs font-bold text-[#FDF6E3]/90 tracking-[0.25em] uppercase mt-0.5">
              EST. 2016  ·  22h  ·  Bansilalpet Stepwell
            </p>
            <p className="font-mono text-[9px] sm:text-[10.5px] font-bold text-[#FDF6E3] tracking-[0.2em] uppercase mt-1 bg-[#11100C]/40 px-4 py-1 border border-[#FDF6E3]/30 rounded-full">
              UNDERGROUND ACOUSTICS  •  HERITAGE SOUND  •  33⅓ RPM STEREO
            </p>
          </div>

          {/* DETACHABLE CONCERT TICKET BUTTON */}
          <button
            onClick={handleExploreClick}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#FDF6E3] text-[#11100C] border-3 border-[#11100C] py-3.5 px-8 sm:px-10 shadow-[6px_6px_0px_#11100C] font-mono text-xs sm:text-sm font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#11100C] hover:text-[#FDF6E3] cursor-pointer rounded-sm"
          >
            <span>[ ENTER TANGY SESSIONS → ]</span>
            <span className="text-[#C8102E] group-hover:text-[#FDF6E3] font-black">✦</span>
          </button>

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#FDF6E3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#FDF6E3]/20">
        <span className="truncate">LIVE ARCHIVE • STEPWELL EDITION</span>
        <span className="hidden md:inline text-[#FDF6E3]/80">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
