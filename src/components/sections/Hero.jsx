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
    gsap.set('.poster-cream-tagline', { opacity: 0, y: -20 });
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.05, y: 30 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.05, y: 30 });
    gsap.set('.poster-performer-cutout', { opacity: 0, scale: 0.9, y: 60 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -90 });
    gsap.set('.poster-ticket-stub', { opacity: 0, y: 40 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-cream-tagline', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.poster-performer-cutout', { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.6')
      .to('.poster-ticket-stub', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -15, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { y: 15, duration: 0.3 }, 0.1)
      .to('.poster-performer-cutout', { y: -20, scale: 1.03, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax
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
      className="relative w-full max-w-full h-screen min-h-[740px] bg-[#991B1B] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* DEEP CRIMSON RED SCREEN-PRINTED HALFTONE PAPER GRAIN & CREASE TEXTURE */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // POSTER ARCHIVE NO. 001
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // ISSUE 001 // SIDE A ★
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#FDF6E3]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: ALIGNED VINTAGE SCREEN PRINT ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#FDF6E3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP ARCHIVE METADATA HEADER BAR                               */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] md:text-[11px] font-bold text-[#FDF6E3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        {/* TOP LEFT METADATA */}
        <div className="flex flex-col text-left">
          <span>LIVE ARCHIVE 𝌆</span>
          <span className="text-[#FDF6E3]/80">HYDERABAD, INDIA</span>
          <span className="text-[#F2B533]">EST. 2016</span>
        </div>

        {/* TOP CENTER TAGLINE */}
        <div className="poster-cream-tagline hidden sm:block bg-[#11100C]/40 px-5 py-1 border border-[#FDF6E3]/30 rounded-full backdrop-blur-xs">
          • FEITO POR ELAS, PARA ELAS •
        </div>

        {/* TOP RIGHT METADATA */}
        <div className="flex flex-col text-right">
          <span className="text-[#F2B533]">33⅓ RPM STEREO</span>
          <span>ISSUE 001</span>
          <span className="text-[#FDF6E3]/80">SIDE A ★</span>
        </div>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND MUSICIAN CUTOUT */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] md:w-[52vw] md:h-[52vw] rounded-full bg-[radial-gradient(circle,rgba(253,246,227,0.35)_0%,rgba(242,181,51,0.18)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONCERT POSTER CANVAS                                    */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-6xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-2 overflow-hidden"
      >
        
        {/* 1. MASSIVE 3D SCREEN-PRINTED TITLE "TANGY SESSIONS" */}
        <div className="poster-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy font-poster text-[clamp(6.2rem,20vw,17rem)] text-[#FDF6E3] leading-[0.74] tracking-tighter drop-shadow-[12px_12px_0px_#11100C] select-none font-black uppercase">
            TANGY
          </h1>
          <h1 className="poster-title-sessions font-poster text-[clamp(5.4rem,17vw,15rem)] text-[#FDF6E3] font-black leading-[0.74] tracking-tight drop-shadow-[12px_12px_0px_#11100C] -mt-4 md:-mt-10 select-none uppercase">
            SESSIONS
          </h1>
        </div>

        {/* 2. CENTRAL PERFORMER CUTOUT WITH THICK WHITE PAPER STICKER BORDER */}
        <div className="poster-performer-cutout absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[38%] w-[310px] sm:w-[420px] md:w-[37vw] max-w-[490px] z-25 pointer-events-auto cursor-pointer group">
          
          <div className="relative p-2 rounded-2xl bg-[#FDF6E3] shadow-[0_0_0_10px_#FDF6E3,0_0_0_13px_#11100C,0_25px_50px_rgba(0,0,0,0.7)] rotate-[-1.5deg] transition-all duration-300 group-hover:scale-103 group-hover:rotate-0">
            
            {/* Paper Tape Accent */}
            <PaperTape rotation="-4deg" width="w-24" className="absolute -top-4 left-1/3 z-30" />

            <div className="w-full aspect-[4/3] bg-[#11100C] rounded-xl overflow-hidden border-2 border-[#11100C] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Live Performer Cutout" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#991B1B] text-[#FDF6E3] font-mono text-[8px] font-bold px-2.5 py-0.5 border border-[#FDF6E3] rounded-full">
                REC • LIVE AT STEPWELL
              </div>
            </div>

            <div className="mt-2 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#11100C] font-bold tracking-wider px-1">
              <span>✎ BANSILALPET STEPWELL // 22h</span>
              <span className="bg-[#991B1B] text-[#FDF6E3] px-2 py-0.5 border border-black text-[7.5px] font-bold rounded-sm uppercase">STICKER CUTOUT</span>
            </div>

          </div>

        </div>

        {/* 3. MID-LEFT PRINTED STAMPS & LABELS */}
        <div className="absolute top-[28%] left-[2%] md:left-[5%] z-25 flex flex-col items-start gap-2.5 pointer-events-none hidden sm:flex">
          <div className="w-14 h-14 rounded-full bg-[#F2B533] text-[#11100C] border-2 border-[#11100C] shadow-md flex items-center justify-center font-mono text-[10px] font-bold rotate-[-12deg]">
            LIVE ★
          </div>
          <div className="bg-[#FDF6E3] text-[#11100C] font-mono text-[9px] font-bold px-3 py-1 border border-[#11100C] shadow-sm rotate-[4deg]">
            REC ●
          </div>
          <span className="font-mono text-[8.5px] text-[#FDF6E3] font-bold tracking-widest uppercase bg-[#11100C]/50 px-2 py-0.5 border border-[#FDF6E3]/30">
            UNDERGROUND SERIES ★
          </span>
        </div>

        {/* 4. MID-RIGHT PRINTED STAMPS & LABELS */}
        <div className="absolute top-[32%] right-[2%] md:right-[5%] z-25 flex flex-col items-end gap-2.5 pointer-events-none hidden sm:flex">
          <div className="bg-[#991B1B] text-[#FDF6E3] font-mono text-[9px] font-bold px-3 py-1 border border-[#FDF6E3] shadow-sm rotate-[-6deg]">
            HYDERABAD
          </div>
          <div className="w-14 h-14 rounded-full bg-[#FDF6E3] text-[#11100C] border-2 border-[#11100C] shadow-md flex flex-col items-center justify-center font-mono text-[9px] font-bold rotate-[8deg]">
            <span>33⅓</span>
            <span className="text-[7px]">RPM ★</span>
          </div>
        </div>

        {/* 5. HANGING VINTAGE CHROME MICROPHONE ASSEMBLY */}
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

        {/* 6. BOTTOM TICKET STUB WITH CLICKABLE ENTER BUTTON */}
        <div className="poster-ticket-stub absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
          
          <div className="relative bg-[#FDF6E3] text-[#11100C] border-4 border-[#11100C] p-3.5 shadow-[12px_12px_0px_#11100C] rotate-[-1deg] flex flex-col items-center gap-2">
            
            {/* Paper Tape Overlay */}
            <PaperTape rotation="-2deg" width="w-20" className="absolute -top-3 left-1/3 z-30" />

            {/* Ticket Header Metadata */}
            <div className="flex justify-between items-center w-full font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#315D73] border-b-2 border-[#11100C] pb-1 uppercase">
              <span>ADMIT ONE // VOL. 09</span>
              <span>ARCHIVE NO. 001</span>
            </div>

            {/* Clickable Ticket Action Button */}
            <button
              onClick={handleExploreClick}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#11100C] text-[#FDF6E3] border-2 border-[#11100C] py-3 px-6 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#991B1B] hover:text-[#FDF6E3] cursor-pointer rounded-sm"
            >
              <span>ENTER TANGY →</span>
              <span className="text-[#F2B533] group-hover:text-[#FDF6E3] font-black">✦</span>
            </button>

            {/* Ticket Footer Subtitle */}
            <div className="flex justify-between items-center w-full font-mono text-[7.5px] sm:text-[8.5px] font-bold text-[#11100C]/80 uppercase pt-1 border-t border-[#11100C]/20">
              <span>TS-26042016</span>
              <span>LIVE MUSIC • CULTURE • COMMUNITY</span>
              <span>09 001</span>
            </div>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM POSTER FOOTER BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#FDF6E3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#FDF6E3]/20">
        <span className="truncate">BANSILALPET STEPWELL // LIVE ARCHIVE</span>
        <span className="hidden md:inline text-[#F2B533]">KEEP THE CULTURE ALIVE ★ Tangy</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
