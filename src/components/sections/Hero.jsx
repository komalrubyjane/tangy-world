import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

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
    // SAFE INTRO REVEAL (NO CLIPPING, NO NEGATIVE X TRANSFORMS)
    // -------------------------------------------------------------
    gsap.set('.poster-title-tangy', { opacity: 0, y: 20 });
    gsap.set('.poster-title-world', { opacity: 0, y: 20 });
    gsap.set('.hero-main-photo', { opacity: 0, scale: 0.95 });
    gsap.set('.hero-blue-panel', { opacity: 0, scaleY: 0.8 });
    gsap.set('.hero-sub-photo', { opacity: 0, y: 20 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-blue-panel', { opacity: 1, scaleY: 1, duration: 0.6, ease: 'power3.out' })
      .to('.hero-main-photo', { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      .to('.poster-title-tangy', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')
      .to('.poster-title-world', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
      .to('.hero-sub-photo', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');

    // Subtle scroll travel progression
    tl.to('.poster-title-tangy', { y: -10, duration: 0.3 }, 0.1)
      .to('.poster-title-world', { y: 10, duration: 0.3 }, 0.1)
      .to('.hero-main-photo', { rotation: -4, y: 12, duration: 0.4 }, 0.2)
      .to('.hero-sub-photo', { rotation: 6, y: -12, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Safe 2-5px drift, no viewport overflow)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 10;
      const moveY = (clientY / window.innerHeight - 0.5) * 10;

      gsap.to('.hero-main-photo', { x: moveX * 0.2, y: moveY * 0.2, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-sub-photo', { x: -moveX * 0.3, y: -moveY * 0.3, duration: 1.2, ease: 'power2.out' });
      gsap.to('.hero-left-content', { x: moveX * 0.08, y: moveY * 0.08, duration: 1.2, ease: 'power2.out' });
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
      className="relative w-full max-w-full h-screen min-h-[600px] bg-[#B9471B] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* SOLID INK NOISE GRAIN TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-10" />

      {/* OVERSIZED DARK-RED BACKGROUND PRINTED GRAPHIC TYPOGRAPHY */}
      <div className="absolute top-[18%] left-[5%] font-display text-[16vw] font-bold text-[#7A271B]/35 leading-none pointer-events-none z-5 select-none uppercase tracking-tighter">
        LIVE 33⅓
      </div>

      {/* TOP ARCHIVAL METADATA BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[9px] md:text-[11px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase z-30 pt-12 md:pt-4">
        <span className="flex items-center gap-2">
          <span className="text-[#315D73] font-black text-sm">⊕</span> TANGY SESSIONS // HYDERABAD, INDIA
        </span>
        <span className="hidden md:inline">EST. 2016 // LIVE MUSIC</span>
        <span className="text-[#D19A24]">ARCHIVE NO. 001</span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN 2-COLUMN POSTER COMPOSITION (CSS FLEX / GRID SAFETY)      */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-7xl mx-auto my-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 z-20"
      >
        
        {/* LEFT COLUMN: MASSIVE TYPOGRAPHY & TICKET CTA (52% WIDTH) */}
        <div className="hero-left-content w-full md:w-[52%] flex flex-col items-start justify-center">
          
          {/* HEADER BADGE STAMP */}
          <div className="inline-flex items-center gap-2 bg-[#15120D] text-[#EAD9A6] border-2 border-[#D19A24] px-3 py-1 mb-3 shadow-[4px_4px_0px_#D19A24] rotate-[-2deg]">
            <span className="w-2 h-2 rounded-full bg-[#B9471B] animate-pulse" />
            <span className="font-mono text-[9px] md:text-[10px] font-bold tracking-[0.25em] uppercase">
              1974 ARCHIVE // HYDERABAD
            </span>
          </div>

          {/* TANGY TITLE */}
          <h1 className="poster-title-tangy display text-[clamp(3.8rem,9vw,9rem)] text-[#EAD9A6] leading-[0.82] tracking-tighter drop-shadow-[6px_6px_0px_#15120D]">
            TANGY
          </h1>

          {/* WORLD TITLE */}
          <h1 className="poster-title-world display text-[clamp(3rem,7.5vw,7.5rem)] italic text-[#D19A24] font-normal leading-[0.82] tracking-tight drop-shadow-[6px_6px_0px_#15120D] md:ml-12 md:-mt-3">
            WORLD
          </h1>

          {/* SUBTITLE & VINTAGE TICKET CTA */}
          <div className="mt-5 md:mt-6 flex flex-col items-start gap-4">
            <p className="font-mono text-[10px] md:text-[12.5px] font-bold text-[#EAD9A6] tracking-[0.3em] uppercase border-y-2 border-[#15120D] py-1.5 px-3 bg-[#15120D]/30">
              PEOPLE • MUSIC • PLACES • STORIES
            </p>

            <button
              onClick={handleExploreClick}
              className="group relative inline-flex items-center gap-3 bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] px-6 py-3 shadow-[5px_5px_0px_#15120D] font-mono text-xs md:text-sm font-bold tracking-[0.25em] uppercase transition-all hover:bg-[#15120D] hover:text-[#EAD9A6] hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer"
            >
              <span>[ EXPLORE THE WORLD ↓ ]</span>
              <span className="text-[#B9471B] group-hover:text-[#D19A24] font-black">✦</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: RETRO BLUE SHAPE + ONE DOMINANT HERO PHOTO (48% WIDTH) */}
        <div className="w-full md:w-[48%] flex items-center justify-center md:justify-end relative min-h-[300px] md:min-h-[440px]">

          {/* RETRO BLUE GRAPHIC PANEL (PARTIALLY BEHIND HERO PHOTO) */}
          <div className="hero-blue-panel absolute right-[5%] top-[5%] w-[260px] sm:w-[320px] md:w-[26vw] max-w-[380px] h-[75%] bg-[#315D73] border-2 border-[#15120D] shadow-[10px_10px_0px_#15120D] pointer-events-none z-10 origin-bottom hidden sm:block" />

          {/* ONE DOMINANT HERO PERFORMANCE PHOTOGRAPH (VERIFIED ASSET) */}
          <div className="hero-main-photo relative w-[280px] sm:w-[340px] md:w-[30vw] max-w-[430px] bg-[#EAD9A6] p-2.5 md:p-3 pb-8 md:pb-10 border-2 border-[#15120D] shadow-[16px_16px_0px_#15120D] rotate-[-2deg] transition-transform hover:scale-102 cursor-pointer z-20">
            {/* Tape Strip Overlay */}
            <div className="absolute -top-3 left-1/3 w-18 h-4 bg-[rgba(234,217,166,0.85)] rotate-[-3deg] border border-black/30 z-30" />
            
            <img 
              src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
              alt="Tangy Live Concert Performer and Audience" 
              loading="eager"
              decoding="async"
              className="w-full aspect-[4/3] object-cover filter grayscale contrast-130 sepia-[0.2] border border-[#15120D] block"
            />

            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center font-mono text-[8.5px] md:text-[9.5px] text-[#15120D] font-bold tracking-wider">
              <span>✎ BANSILALPET // 11:42 PM</span>
              <span className="bg-[#B9471B] text-[#EAD9A6] px-1.5 py-0.5 border border-black text-[7px] rotate-[2deg]">LIVE</span>
            </div>
          </div>

          {/* 1 SMALL SUPPORTING PRINT (STEPWELL ARCHITECTURE) */}
          <div className="hero-sub-photo absolute -bottom-4 left-0 md:-left-4 w-[140px] md:w-[180px] bg-[#EAD9A6] p-2 pb-6 border-2 border-[#15120D] shadow-[10px_10px_0px_#15120D] rotate-[5deg] transition-transform hover:scale-105 cursor-pointer z-25">
            <img 
              src={gallery[0]?.src || "/media/gallery/tangy1.jpg"} 
              alt="Bansilalpet Stepwell Heritage Stage" 
              loading="eager"
              decoding="async"
              className="w-full aspect-[4/3] object-cover filter grayscale contrast-125 sepia-[0.3] border border-[#15120D] block"
            />
            <p className="absolute bottom-1.5 left-2 font-mono text-[7px] text-[#15120D] font-bold tracking-wider">✎ STEPWELL STAGE</p>
          </div>

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[9px] md:text-[10px] font-bold text-[#EAD9A6] tracking-[0.25em] uppercase z-30 pb-2">
        <span>PEOPLE • MUSIC • PLACES • STORIES</span>
        <span className="hidden md:inline text-[#315D73]">SIDE A // PLAY LOUD</span>
        <span>HYD // 17°23'N</span>
      </div>

    </section>
  );
};
