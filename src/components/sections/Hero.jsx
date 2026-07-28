import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { gallery } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';
import { ArchiveStamp } from '../ui/ArchiveStamp';
import { PaperTape } from '../ui/PaperTape';
import { MusicalArtifact } from '../ui/MusicalArtifact';

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

    gsap.set('.poster-title-tangy', { opacity: 0, y: 15 });
    gsap.set('.poster-title-world', { opacity: 0, y: 15 });
    gsap.set('.hero-main-photo', { opacity: 0, scale: 0.95 });
    gsap.set('.hero-ticket-panel', { opacity: 0, y: 20 });
    gsap.set('.hero-sub-photo', { opacity: 0, y: 15 });

    const introTl = gsap.timeline({ delay: 0.1 });

    introTl
      .to('.hero-ticket-panel', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .to('.hero-main-photo', { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      .to('.poster-title-tangy', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')
      .to('.poster-title-world', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
      .to('.hero-sub-photo', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2');

    tl.to('.poster-title-tangy', { y: -10, duration: 0.3 }, 0.1)
      .to('.poster-title-world', { y: 10, duration: 0.3 }, 0.1)
      .to('.hero-main-photo', { rotation: -3, y: 10, duration: 0.4 }, 0.2)
      .to('.hero-sub-photo', { rotation: 4, y: -10, duration: 0.4 }, 0.2);

  }, []);

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
      className="relative w-full max-w-full min-h-screen md:h-screen bg-[#B9471B] overflow-hidden flex flex-col justify-between p-4 md:p-8 border-box select-none"
    >
      {/* SCREEN PRINTED HALFTONE NOISE TEXTURE */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-multiply pointer-events-none z-10" />

      {/* GIANT FADED BACKGROUND TYPOGRAPHY "WORLD" AT 5% OPACITY */}
      <div className="absolute top-[15%] left-[2%] font-display text-[26vw] font-bold text-[#EAD9A6]/5 leading-none pointer-events-none z-5 uppercase tracking-tighter select-none">
        WORLD
      </div>

      {/* WARM SPOTLIGHT LIGHTING BEAM */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] md:w-[40vw] md:h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(234,217,166,0.18)_0%,rgba(209,154,36,0.08)_50%,transparent_75%)] blur-3xl pointer-events-none z-6" />

      {/* CROP MARKS & REGISTRATION CROSSES */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // HERO COVER
      </div>
      <div className="absolute top-4 right-4 font-mono text-[9px] text-[#D19A24] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        33⅓ RPM STEREO // ARCHIVE NO. 001
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[9px] text-[#EAD9A6]/60 tracking-[0.25em] uppercase z-20 pointer-events-none hidden md:block">
        REGISTRATION: PERFECT PRINT ALIGNMENT
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#EAD9A6] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        PROPERTY OF TANGY SESSIONS
      </div>

      {/* TOP ARCHIVAL METADATA BAR & STAMP */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[11px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pt-14 md:pt-4">
        <span className="flex items-center gap-2 truncate">
          <span className="text-[#315D73] font-black text-xs sm:text-sm">⊕</span> TANGY SESSIONS // HYDERABAD
        </span>
        <ArchiveStamp text="ARCHIVE NO. 001" rotation="-2deg" color="gold" className="hidden sm:inline-block" />
        <span className="text-[#D19A24] shrink-0">EST. 2016 // LIVE MUSIC</span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ASYMMETRIC 5-8 OVERLAPPING OBJECTS LAYOUT                      */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={heroContainerRef} 
        className="w-full max-w-7xl mx-auto my-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 z-20 py-4 md:py-0"
      >
        
        {/* LEFT SIDE: MASSIVE TYPOGRAPHY & OLD POLAROIDS */}
        <div className="hero-left-content w-full md:w-[52%] flex flex-col items-center md:items-start text-center md:text-left justify-center relative">
          
          {/* HEADER BADGE STAMP */}
          <div className="inline-flex items-center gap-2 bg-[#15120D] text-[#EAD9A6] border-2 border-[#D19A24] px-2.5 sm:px-3 py-1 mb-2.5 md:mb-3 shadow-[3px_3px_0px_#D19A24] rotate-[-2deg]">
            <span className="w-2 h-2 rounded-full bg-[#B9471B] animate-pulse" />
            <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.25em] uppercase">
              1974 ARCHIVE // HYDERABAD
            </span>
          </div>

          {/* TANGY TITLE */}
          <h1 className="poster-title-tangy display text-5xl sm:text-7xl md:text-[9vw] text-[#EAD9A6] leading-[0.85] md:leading-[0.82] tracking-tighter drop-shadow-[4px_4px_0px_#15120D] md:drop-shadow-[6px_6px_0px_#15120D]">
            TANGY
          </h1>

          {/* WORLD TITLE */}
          <h1 className="poster-title-world display text-4xl sm:text-6xl md:text-[7.5vw] italic text-[#D19A24] font-normal leading-[0.85] md:leading-[0.82] tracking-tight drop-shadow-[4px_4px_0px_#15120D] md:drop-shadow-[6px_6px_0px_#15120D] md:ml-12 md:-mt-3">
            WORLD
          </h1>

          {/* SUBTITLE & VINTAGE TICKET CTA */}
          <div className="mt-4 md:mt-6 flex flex-col items-center md:items-start gap-3 md:gap-4 w-full sm:w-auto">
            <p className="font-mono text-[9px] sm:text-[10px] md:text-[12.5px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.3em] uppercase border-y-2 border-[#15120D] py-1 px-2.5 sm:px-3 bg-[#15120D]/30 max-w-full">
              PEOPLE • MUSIC • PLACES • STORIES
            </p>

            <button
              onClick={handleExploreClick}
              className="group relative inline-flex items-center justify-center gap-2.5 bg-[#EAD9A6] text-[#15120D] border-2 border-[#15120D] px-5 sm:px-6 py-2.5 sm:py-3 shadow-[4px_4px_0px_#15120D] md:shadow-[5px_5px_0px_#15120D] font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.2em] md:tracking-[0.25em] uppercase transition-all hover:bg-[#15120D] hover:text-[#EAD9A6] hover:translate-x-1 hover:translate-y-1 hover:shadow-none cursor-pointer w-full sm:w-auto"
            >
              <span>[ EXPLORE THE WORLD ↓ ]</span>
              <span className="text-[#B9471B] group-hover:text-[#D19A24] font-black">✦</span>
            </button>
          </div>

        </div>

        {/* RIGHT SIDE: CONCERT TICKET + CASSETTE + POLAROID STACK */}
        <div className="w-full md:w-[48%] flex items-center justify-center md:justify-end relative min-h-[280px] sm:min-h-[320px] md:min-h-[440px] mt-2 md:mt-0">

          {/* RETRO CONCERT TICKET STUB PANEL */}
          <div className="hero-ticket-panel absolute right-[5%] top-[5%] w-[220px] sm:w-[300px] md:w-[24vw] max-w-[360px] bg-[#315D73] text-[#EAD9A6] border-2 border-[#15120D] p-4 shadow-[8px_8px_0px_#15120D] font-mono text-[9px] pointer-events-none z-10 hidden sm:block rotate-[2deg]">
            <div className="flex justify-between border-b border-[#EAD9A6]/30 pb-2 mb-2 font-bold">
              <span>ADMIT ONE // VOL. 01</span>
              <span>₹799</span>
            </div>
            <p className="opacity-80">BANSILALPET STEPWELL · HYDERABAD</p>
            <div className="mt-4 pt-2 border-t border-dashed border-[#EAD9A6]/30 flex justify-between items-center text-[8px]">
              <span>#TK-1974-001</span>
              <span className="bg-[#B9471B] text-[#EAD9A6] px-1.5 py-0.5">REC • LIVE</span>
            </div>
          </div>

          {/* ONE DOMINANT HERO PERFORMANCE POLAROID */}
          <div className="hero-main-photo relative w-[260px] sm:w-[340px] md:w-[30vw] max-w-[430px] bg-[#EAD9A6] p-2 md:p-3 pb-7 md:pb-10 border-2 border-[#15120D] shadow-[12px_12px_0px_#15120D] md:shadow-[16px_16px_0px_#15120D] rotate-[-2deg] transition-transform hover:scale-102 cursor-pointer z-20 mx-auto md:mx-0">
            {/* Paper Tape Overlay */}
            <PaperTape rotation="-3deg" width="w-20" className="absolute -top-3 left-1/3" />
            
            <img 
              src={gallery[2]?.src || "/media/gallery/tangy3.jpg"} 
              alt="Tangy Live Concert Performer and Audience" 
              loading="eager"
              decoding="async"
              className="w-full aspect-[4/3] object-cover filter grayscale contrast-130 sepia-[0.2] border border-[#15120D] block"
            />

            <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-center font-mono text-[7.5px] sm:text-[8.5px] md:text-[9.5px] text-[#15120D] font-bold tracking-wider">
              <span>✎ BANSILALPET // 11:42 PM</span>
              <span className="bg-[#B9471B] text-[#EAD9A6] px-1 py-0.5 border border-black text-[6.5px] sm:text-[7px] rotate-[2deg]">LIVE</span>
            </div>
          </div>

          {/* SUPPORTING STEPWELL PHOTO */}
          <div className="hero-sub-photo absolute -bottom-3 right-2 sm:right-auto sm:-left-2 md:-left-4 w-[110px] sm:w-[140px] md:w-[180px] bg-[#EAD9A6] p-1.5 md:p-2 pb-5 md:pb-6 border-2 border-[#15120D] shadow-[8px_8px_0px_#15120D] rotate-[5deg] transition-transform hover:scale-105 cursor-pointer z-25">
            <img 
              src={gallery[0]?.src || "/media/gallery/tangy1.jpg"} 
              alt="Bansilalpet Stepwell Heritage Stage" 
              loading="eager"
              decoding="async"
              className="w-full aspect-[4/3] object-cover filter grayscale contrast-125 sepia-[0.3] border border-[#15120D] block"
            />
            <p className="absolute bottom-1 left-1.5 font-mono text-[6.5px] sm:text-[7px] text-[#15120D] font-bold tracking-wider">✎ STEPWELL STAGE</p>
          </div>

          {/* AMBIENT FLOATING ROTATING VINYL */}
          <MusicalArtifact type="vinyl" className="absolute -bottom-6 -right-6 w-20 md:w-28 z-30 animate-[spin_10s_linear_infinite]" />

        </div>

      </div>

      {/* BOTTOM POSTER FOOTER BAR */}
      <div className="w-full flex justify-between items-center font-mono text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#EAD9A6] tracking-[0.2em] md:tracking-[0.25em] uppercase z-30 pb-2 pt-2 md:pt-0 border-t border-[#15120D]/20 md:border-none">
        <span className="truncate">PEOPLE • MUSIC • PLACES • STORIES</span>
        <span className="hidden md:inline text-[#315D73]">─────── 33⅓ RPM STEREO ───────</span>
        <span className="shrink-0 ml-2">HYD // 17°23'N</span>
      </div>

    </section>
  );
};
