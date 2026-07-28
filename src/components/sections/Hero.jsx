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
    // INTRO ANIMATION TIMELINE (POSTER REVEAL SEQUENCE)
    // -------------------------------------------------------------
    gsap.set('.hero-bg-texture', { opacity: 0 });
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.05, y: 30 });
    gsap.set('.poster-title-world', { opacity: 0, scale: 1.05, y: 30 });
    gsap.set('.hero-cutout-photo', { opacity: 0, y: 80, scale: 0.95 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -80 });
    gsap.set('.hero-ticket-cta', { opacity: 0, y: 40 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-world', { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-cutout-photo', { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.6')
      .to('.hero-ticket-cta', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -15, duration: 0.3 }, 0.1)
      .to('.poster-title-world', { y: 15, duration: 0.3 }, 0.1)
      .to('.hero-cutout-photo', { y: -20, scale: 1.02, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Cutout Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 12;
      const moveY = (clientY / window.innerHeight - 0.5) * 12;

      gsap.to('.hero-cutout-photo', { x: moveX * 0.25, y: moveY * 0.25, rotation: moveX * 0.05, duration: 1.2, ease: 'power2.out' });
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
      {/* SCREEN-PRINTED HALFTONE PAPER GRAIN TEXTURE */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // 1974 CONCERT POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // SIDE A
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EAD9A6]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT PRINT ALIGNMENT ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* TOP EDITORIAL METADATA BAR & STAMP */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[11px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        <span className="flex items-center gap-2 truncate">
          <span className="text-[#315D73] font-black text-xs sm:text-sm">⊕</span> TANGY SESSIONS // HYDERABAD
        </span>
        <ArchiveStamp text="LIVE ARCHIVE 001" rotation="-2deg" color="gold" className="hidden sm:inline-block" />
        <span className="text-[#D19A24] shrink-0">EST. 2016 // STEPWELL SERIES</span>
      </div>

      {/* WARM SPOTLIGHT LIGHTING BEAM BEHIND CUTOUT */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-[65vw] md:w-[38vw] md:h-[38vw] rounded-full bg-[radial-gradient(circle,rgba(234,217,166,0.22)_0%,rgba(209,154,36,0.1)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* DOMINANT VINTAGE CONCERT POSTER COMPOSITION                    */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-7xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-4"
      >
        
        {/* 1. MASSIVE TYPOGRAPHY (OCCUPIES ~70% VIEWPORT) */}
        <div className="hero-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy display text-[clamp(4.5rem,14.5vw,13rem)] text-[#EAD9A6] leading-[0.78] tracking-tighter drop-shadow-[8px_8px_0px_#15120D] select-none">
            TANGY
          </h1>
          <h1 className="poster-title-world display text-[clamp(4rem,12.5vw,11rem)] italic text-[#D19A24] font-normal leading-[0.78] tracking-tight drop-shadow-[8px_8px_0px_#15120D] -mt-2 md:-mt-6 select-none">
            WORLD
          </h1>
        </div>

        {/* 2. ONE DOMINANT HERO PERFORMER CUT-OUT IMAGE (OVERLAPS TYPOGRAPHY) */}
        <div className="hero-cutout-photo absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[290px] sm:w-[380px] md:w-[34vw] max-w-[460px] z-25 pointer-events-auto cursor-pointer group">
          
          {/* WHITE PRINTED STICKER OUTLINE & PAPER CUT-OUT CONTAINER */}
          <div className="relative bg-[#EAD9A6] p-2.5 sm:p-3 pb-8 sm:pb-10 border-4 border-[#15120D] shadow-[18px_18px_0px_#15120D] rotate-[-2deg] transition-all duration-300 group-hover:scale-102 group-hover:rotate-0">
            
            {/* Paper Tape Overlay */}
            <PaperTape rotation="-3deg" width="w-24" className="absolute -top-3 left-1/3 z-30" />
            
            {/* High Contrast Concert Cutout Photo */}
            <div className="w-full aspect-[4/3] bg-[#15120D] overflow-hidden border-2 border-[#15120D] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Live Concert Performer and Audience" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#5A120D] text-[#EAD9A6] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#D19A24]">
                LIVE AT STEPWELL ●
              </div>
            </div>

            {/* Cutout Caption Stamp */}
            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#15120D] font-bold tracking-wider">
              <span>✎ BANSILALPET // 11:42 PM</span>
              <span className="bg-[#B9471B] text-[#EAD9A6] px-1.5 py-0.5 border border-black text-[7px] rotate-[2deg]">OFFICIAL CUTOUT</span>
            </div>
          </div>

        </div>

        {/* 3. HANGING MICROPHONE ASSEMBLY */}
        <div className="hero-mic-assembly absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-28 md:h-36 bg-[#15120D]" />
          <div className="w-12 h-16 md:w-14 md:h-18 border border-black/40 rounded-b-xl shadow-2xl flex items-center justify-center bg-[linear-gradient(135deg,#999_0%,#222_40%,#666_70%,#111_100%)] p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img src="/media/vintage-mic.png" alt="Microphone" className="w-full h-full object-contain filter drop-shadow-lg" />
          </div>
        </div>

        {/* 4. PRINTED CONCERT TICKET CTA */}
        <div className="hero-ticket-cta relative z-30 mt-auto pt-4 flex flex-col items-center gap-3">
          <button
            onClick={handleExploreClick}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#EAD9A6] text-[#15120D] border-4 border-[#15120D] px-8 sm:px-10 py-3.5 sm:py-4 shadow-[6px_6px_0px_#15120D] font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#15120D] hover:text-[#EAD9A6] hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
          >
            <span>[ ENTER TANGY WORLD → ]</span>
            <span className="text-[#B9471B] group-hover:text-[#D19A24] font-black">✦</span>
          </button>

          <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase bg-[#15120D]/40 px-3 py-0.5 border border-[#15120D]/50">
            ADMIT ONE // 1974 CONCERT TICKET
          </span>
        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#15120D]/20">
        <span className="truncate">PEOPLE • MUSIC • PLACES • STORIES</span>
        <span className="hidden md:inline text-[#315D73]">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
