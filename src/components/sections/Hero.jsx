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
    // 1974 POSTER INTRO ANIMATION TIMELINE
    // -------------------------------------------------------------
    gsap.set('.hero-bg-texture', { opacity: 0 });
    gsap.set('.poster-top-header', { opacity: 0, y: -20 });
    gsap.set('.poster-title-tangy', { opacity: 0, scale: 1.06, y: 35 });
    gsap.set('.poster-title-sessions', { opacity: 0, scale: 1.06, y: 35 });
    gsap.set('.poster-performer-cutout', { opacity: 0, scale: 0.9, y: 65 });
    gsap.set('.hero-mic-assembly', { opacity: 0, y: -90 });
    gsap.set('.poster-ticket-stub', { opacity: 0, y: 45 });
    gsap.set('.poster-ephemera-item', { opacity: 0, scale: 0.8 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-bg-texture', { opacity: 1, duration: 0.6, ease: 'power2.out' })
      .to('.poster-top-header', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .to('.poster-title-tangy', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .to('.poster-title-sessions', { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.poster-performer-cutout', { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'back.out(1.2)' }, '-=0.5')
      .to('.hero-mic-assembly', { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.2)' }, '-=0.6')
      .to('.poster-ephemera-item', { opacity: 1, scale: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.4)' }, '-=0.4')
      .to('.poster-ticket-stub', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    // Scroll scrub movement
    tl.to('.poster-title-tangy', { y: -18, duration: 0.3 }, 0.1)
      .to('.poster-title-sessions', { y: 18, duration: 0.3 }, 0.1)
      .to('.poster-performer-cutout', { y: -22, scale: 1.03, duration: 0.4 }, 0.2)
      .to('.hero-mic-assembly', { rotation: 4, duration: 0.4 }, 0.1);

  }, []);

  // Desktop Mouse Parallax (Subtle Layer Depth)
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
      {/* DEEP VINTAGE RED SCREEN-PRINTED HALFTONE PAPER GRAIN & CREASE TEXTURE */}
      <div className="hero-bg-texture absolute inset-0 bg-[url('/noise.png')] opacity-35 mix-blend-multiply pointer-events-none z-10" />

      {/* CROP MARKS & PRINT REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#F4E8C3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // 1974 SCREEN-PRINTED CONCERT POSTER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D9A420] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // ISSUE 001 // SIDE A ★
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#F4E8C3]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: OFFSET SCREEN PRINT // INK BLEED ✦
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#F4E8C3] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP ARCHIVE METADATA HEADER BAR                               */}
      {/* ------------------------------------------------------------- */}
      <div className="poster-top-header w-full flex justify-between items-center font-mono text-[8.5px] sm:text-[9.5px] md:text-[11px] font-bold text-[#F4E8C3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        {/* TOP LEFT METADATA */}
        <div className="flex flex-col text-left">
          <span>HYDERABAD, INDIA</span>
          <span className="text-[#D9A420]">EST. 2016 🌐</span>
        </div>

        {/* TOP CENTER TAGLINE */}
        <div className="hidden sm:block bg-[#14110F]/40 px-5 py-1 border border-[#F4E8C3]/30 rounded-full backdrop-blur-xs text-center">
          LIVE MUSIC • HERITAGE • CULTURE
        </div>

        {/* TOP RIGHT METADATA */}
        <div className="flex flex-col text-right">
          <span>LIVE ARCHIVE 𝌆</span>
          <span className="text-[#D9A420]">ISSUE 001 • SIDE A ★</span>
        </div>
      </div>

      {/* WARM SPOTLIGHT BEAM BEHIND MUSICIAN CUTOUT */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] md:w-[52vw] md:h-[52vw] rounded-full bg-[radial-gradient(circle,rgba(244,232,195,0.35)_0%,rgba(217,164,32,0.18)_50%,transparent_75%)] blur-3xl pointer-events-none z-12" />

      {/* ------------------------------------------------------------- */}
      {/* MAIN 1974 CONCERT POSTER CANVAS                               */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-6xl mx-auto my-auto relative flex flex-col items-center justify-center z-20 h-full py-2 overflow-hidden"
      >
        
        {/* 1. MASSIVE 3D SCREEN-PRINTED TITLE "TANGY SESSIONS" */}
        <div className="poster-title-group flex flex-col items-center text-center relative z-15 my-auto">
          <h1 className="poster-title-tangy font-poster text-[clamp(6.5rem,21vw,17.5rem)] text-[#F4E8C3] leading-[0.74] tracking-tighter drop-shadow-[14px_14px_0px_#14110F] select-none font-black uppercase">
            TANGY
          </h1>
          <h1 className="poster-title-sessions font-poster text-[clamp(5.5rem,18vw,15.5rem)] text-[#F4E8C3] font-black leading-[0.74] tracking-tight drop-shadow-[14px_14px_0px_#14110F] -mt-4 md:-mt-10 select-none uppercase">
            SESSIONS
          </h1>
        </div>

        {/* 2. VIOLIN PERFORMER CUTOUT WITH THICK WHITE PAPER STICKER BORDER */}
        <div className="poster-performer-cutout absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[38%] w-[310px] sm:w-[420px] md:w-[37vw] max-w-[490px] z-25 pointer-events-auto cursor-pointer group">
          
          <div className="relative p-2 rounded-2xl bg-[#F8F1D9] shadow-[0_0_0_10px_#F8F1D9,0_0_0_13px_#14110F,0_25px_50px_rgba(0,0,0,0.75)] rotate-[-1.5deg] transition-all duration-300 group-hover:scale-103 group-hover:rotate-0">
            
            {/* Paper Tape Accent */}
            <PaperTape rotation="-4deg" width="w-24" className="absolute -top-4 left-1/3 z-30" />

            <div className="w-full aspect-[4/3] bg-[#14110F] rounded-xl overflow-hidden border-2 border-[#14110F] relative">
              <img 
                src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
                alt="Tangy Violin Performer Cutout" 
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover filter grayscale contrast-140 sepia-[0.15] group-hover:grayscale-0 transition-all duration-700 block"
              />
              <div className="absolute top-2 right-2 bg-[#991B1B] text-[#F8F1D9] font-mono text-[8px] font-bold px-2.5 py-0.5 border border-[#F8F1D9] rounded-full">
                REC • LIVE AT STEPWELL
              </div>
            </div>

            <div className="mt-2 flex justify-between items-center font-mono text-[8px] sm:text-[9.5px] text-[#14110F] font-bold tracking-wider px-1">
              <span>✎ BANSILALPET STEPWELL // 22h</span>
              <span className="bg-[#991B1B] text-[#F8F1D9] px-2 py-0.5 border border-black text-[7.5px] font-bold rounded-sm uppercase">STICKER CUTOUT</span>
            </div>

          </div>

        </div>

        {/* 3. MID-LEFT PRINTED STAMPS & LABELS */}
        <div className="poster-ephemera-item absolute top-[26%] left-[2%] md:left-[5%] z-25 flex flex-col items-start gap-2.5 pointer-events-none hidden sm:flex">
          <div className="w-15 h-15 rounded-full bg-[#D9A420] text-[#14110F] border-2 border-[#14110F] shadow-md flex flex-col items-center justify-center font-mono text-[8.5px] font-bold rotate-[-12deg] leading-tight text-center p-1">
            <span>33⅓</span>
            <span className="text-[7px]">RPM STEREO</span>
          </div>
          <div className="bg-[#14110F] text-[#F4E8C3] font-mono text-[9px] font-bold px-3 py-1 border border-[#F4E8C3] shadow-sm rotate-[4deg] uppercase">
            LIVE AND REAL ★
          </div>
        </div>

        {/* 4. LOWER-LEFT STEPWELL GRAPHIC BADGE */}
        <div className="poster-ephemera-item absolute bottom-[18%] left-[2%] md:left-[6%] z-25 pointer-events-none hidden md:block">
          <div className="bg-[#14110F] text-[#F4E8C3] font-mono text-[9px] font-bold px-3 py-1.5 border border-[#F4E8C3] shadow-md rotate-[-2deg] flex items-center gap-1.5 uppercase">
            <span>🏛</span>
            <span>BANSILALPET STEPWELL ★</span>
          </div>
        </div>

        {/* 5. MID-RIGHT PRINTED STAMPS & LABELS */}
        <div className="poster-ephemera-item absolute top-[30%] right-[2%] md:right-[5%] z-25 flex flex-col items-end gap-2.5 pointer-events-none hidden sm:flex">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#991B1B] bg-[#F4E8C3] text-[#991B1B] font-mono text-[8px] font-bold flex flex-col items-center justify-center rotate-[8deg] shadow-md leading-tight text-center p-1 uppercase">
            <span>RECORDED</span>
            <span className="font-black text-[10px] text-[#991B1B]">LIVE</span>
            <span className="text-[7px]">AT STEPWELL</span>
          </div>
        </div>

        {/* 6. LOWER-RIGHT TAPE STICKERS & HANDWRITTEN SIGNATURE */}
        <div className="poster-ephemera-item absolute bottom-[16%] right-[2%] md:right-[6%] z-25 flex flex-col items-end gap-1.5 pointer-events-none hidden md:flex text-right">
          <div className="bg-[#F8F1D9] text-[#14110F] font-mono text-[8.5px] font-bold px-2.5 py-1 border border-[#14110F] shadow-sm rotate-[3deg] uppercase">
            INHERIT THE PAST / CREATE THE FUTURE
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#991B1B] text-[#F8F1D9] font-mono text-[8px] font-bold px-2 py-0.5 border border-[#F8F1D9] uppercase">REC ●</span>
            <span className="font-mono text-[8px] font-bold text-[#F4E8C3] tracking-widest uppercase">KEEP THE CULTURE ALIVE ★</span>
          </div>
          <span className="font-serif italic text-lg text-[#D9A420] font-bold -mt-1 pr-2">Tangy</span>
        </div>

        {/* 7. HANGING VINTAGE CHROME MICROPHONE ASSEMBLY */}
        <div className="hero-mic-assembly absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-[2px] h-32 md:h-44 bg-[#14110F]" />
          <div className="w-14 h-20 md:w-16 md:h-22 shadow-2xl flex items-center justify-center p-1 -mt-0.5 animate-[spin_8s_ease-in-out_infinite_alternate]">
            <img 
              src="/media/vintage-mic.png" 
              alt="Microphone" 
              className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]" 
            />
          </div>
        </div>

        {/* 8. DETACHABLE CONCERT TICKET STUB WITH CLICKABLE BUTTON */}
        <div className="poster-ticket-stub absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4">
          
          <div className="relative bg-[#F8F1D9] text-[#14110F] border-4 border-[#14110F] p-3.5 shadow-[12px_12px_0px_#14110F] rotate-[-1deg] flex flex-col items-center gap-2">
            
            {/* Paper Tape Overlay */}
            <PaperTape rotation="-2deg" width="w-20" className="absolute -top-3 left-1/3 z-30" />

            {/* Ticket Header Metadata */}
            <div className="flex justify-between items-center w-full font-mono text-[8.5px] sm:text-[9.5px] font-bold text-[#315D73] border-b-2 border-[#14110F] pb-1 uppercase">
              <span>ADMIT ONE // VOL. 01</span>
              <span>ARCHIVE NO. 001</span>
            </div>

            {/* Clickable Ticket Action Button */}
            <button
              onClick={handleExploreClick}
              className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#14110F] text-[#F4E8C3] border-2 border-[#14110F] py-3 px-6 font-mono text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#991B1B] hover:text-[#F4E8C3] cursor-pointer rounded-sm"
            >
              <span>ENTER TANGY →</span>
              <span className="text-[#D9A420] group-hover:text-[#F4E8C3] font-black">✦</span>
            </button>

            {/* Ticket Footer Subtitle */}
            <div className="flex justify-between items-center w-full font-mono text-[7.5px] sm:text-[8.5px] font-bold text-[#14110F]/80 uppercase pt-1 border-t border-[#14110F]/20">
              <span>TS-2016-001</span>
              <span>LIVE MUSIC • COMMUNITY • HERITAGE</span>
              <span>00160</span>
            </div>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM POSTER FOOTER BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#F4E8C3] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 border-t border-[#F4E8C3]/20">
        <span className="truncate">BANSILALPET STEPWELL // 1974 CONCERT POSTER ARCHIVE</span>
        <span className="hidden md:inline text-[#D9A420]">KEEP THE CULTURE ALIVE ★ Tangy</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
