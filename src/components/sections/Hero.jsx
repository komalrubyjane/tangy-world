import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const Hero = () => {
  const navigate = useNavigate();
  const { setFilterCutoff, playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    let impactTriggered = false;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=30%' : '+=75%',
        scrub: 0.5,
        pin: !isMobile,
        anticipatePin: isMobile ? 0 : 1,
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

    // Intro Entrance Animations
    gsap.from('.headline .word', {
      opacity: 0,
      y: 35,
      scale: 1.04,
      duration: 1,
      stagger: 0.18,
      ease: 'power3.out'
    });

    // All 5 Performer Cutouts Fade Up One By One in Sequence
    gsap.from([
      '.portrait-wrap-far-left',
      '.portrait-wrap-inner-left',
      '.portrait-wrap-center',
      '.portrait-wrap-inner-right',
      '.portrait-wrap-far-right'
    ], {
      opacity: 0,
      y: 50,
      duration: 1.0,
      stagger: 0.15,
      delay: 0.25,
      ease: 'power3.out'
    });

    gsap.from('.badge', {
      opacity: 0,
      scale: 0.75,
      stagger: 0.07,
      duration: 0.7,
      delay: 0.6,
      ease: 'back.out(1.4)'
    });

    // Scroll Scrub Movement Sync
    tl.to('.headline .word.tangy', { y: -15, duration: 0.3 }, 0.1)
      .to('.headline .word.sessions', { y: 15, duration: 0.3 }, 0.1)
      .to('.portrait-wrap-far-left', { y: -16, scale: 1.01, duration: 0.4 }, 0.2)
      .to('.portrait-wrap-inner-left', { y: -18, scale: 1.01, duration: 0.4 }, 0.2)
      .to('.portrait-wrap-center', { y: -20, scale: 1.02, duration: 0.4 }, 0.2)
      .to('.portrait-wrap-inner-right', { y: -18, scale: 1.01, duration: 0.4 }, 0.2)
      .to('.portrait-wrap-far-right', { y: -16, scale: 1.01, duration: 0.4 }, 0.2);

  }, []);

  // Desktop Mouse Parallax (Subtle Composition Layer Tilt)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      const moveX = (clientX / window.innerWidth - 0.5) * 16;
      const moveY = (clientY / window.innerHeight - 0.5) * 16;

      gsap.to('.portrait-wrap-far-left', { x: moveX * 0.16, y: moveY * 0.16, duration: 1.2, ease: 'power2.out' });
      gsap.to('.portrait-wrap-inner-left', { x: moveX * 0.20, y: moveY * 0.20, duration: 1.2, ease: 'power2.out' });
      gsap.to('.portrait-wrap-center', { x: moveX * 0.25, y: moveY * 0.25, duration: 1.2, ease: 'power2.out' });
      gsap.to('.portrait-wrap-inner-right', { x: moveX * 0.21, y: moveY * 0.21, duration: 1.2, ease: 'power2.out' });
      gsap.to('.portrait-wrap-far-right', { x: moveX * 0.17, y: moveY * 0.17, duration: 1.2, ease: 'power2.out' });
      gsap.to('.headline', { x: moveX * 0.08, y: moveY * 0.08, duration: 1.2, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="hero" 
      className="hero relative w-full h-[100dvh] max-h-[100dvh] bg-[#3c0f0e] overflow-hidden p-0 m-0 select-none isolate"
    >
      {/* SVG ROUGHEN FILTER */}
      <svg className="absolute width-0 height-0 overflow-hidden pointer-events-none z-0">
        <filter id="roughen" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>

      {/* FULL-SCREEN EDGE-TO-EDGE POSTER CANVAS */}
      <div 
        className="poster absolute inset-0 w-full h-full bg-[radial-gradient(120%_90%_at_50%_8%,#8a2320_0%,#6e1a19_45%,#4c1210_100%)] overflow-hidden container-inline-size"
      >
        {/* CORNER CROSSHAIRS (z-30) */}
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] left-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] right-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 bottom-[1.4cqw] left-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 bottom-[1.4cqw] right-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOP BAR VISUAL GRID ALIGNMENT (z-40)                          */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute z-40 top-[2.2cqw] left-[5cqw] right-[5cqw] flex items-start justify-between pointer-events-none">
          {/* TOP LEFT */}
          <div className="text-[clamp(7px,1.05cqw,16px)] leading-tight text-left font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
            <div>HYDERABAD, INDIA</div>
            <div className="flex items-center gap-[0.4cqw] mt-[0.2cqw]">
              <span>EST. 2016</span>
              <svg className="w-[1cqw] min-w-[7px] h-[1cqw] min-h-[7px] opacity-90 inline" viewBox="0 0 24 24" fill="none" stroke="#ecdcaf" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
            </div>
            <div className="w-[2.4cqw] min-w-[14px] h-[2px] bg-[#ecdcaf] opacity-70 mt-[0.3cqw]" />
          </div>

          {/* TOP CENTER */}
          <div className="text-center">
            <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,20px)] tracking-[0.22em] text-[#ecdcaf] uppercase">
              LIVE MUSIC • HERITAGE • CULTURE
            </div>
            <div className="flex items-center justify-center gap-[0.5cqw] mt-[0.4cqw]">
              <span className="w-[8cqw] min-w-[24px] h-[2px] bg-[#d1a437] opacity-80" />
              <svg className="w-[1cqw] min-w-[7px] h-[1cqw] min-h-[7px]" viewBox="0 0 24 24" fill="none" stroke="#d1a437" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>

          {/* TOP RIGHT */}
          <div className="text-[clamp(7px,1.05cqw,16px)] leading-tight text-right font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
            <div className="flex items-center justify-end gap-[0.4cqw]">
              <span>LIVE ARCHIVE</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ecdcaf" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
            </div>
            <div className="mt-[0.2cqw]">ISSUE 001 · SIDE A</div>
            <div className="w-[2.4cqw] min-w-[14px] h-[2px] bg-[#ecdcaf] opacity-70 mt-[0.3cqw] ml-auto" />
          </div>
        </div>

        {/* STEPWELL SILHOUETTE (z-2) */}
        <svg className="absolute z-2 left-0 bottom-0 w-[34cqw] min-w-[120px] h-[36cqw] min-h-[140px] opacity-55 mix-blend-multiply pointer-events-none" viewBox="0 0 400 420" preserveAspectRatio="xMinYMax meet">
          <g fill="#3c0f0e">
            <rect x="0" y="360" width="400" height="60"/>
            <rect x="0" y="300" width="360" height="60"/>
            <rect x="0" y="245" width="310" height="55"/>
            <rect x="0" y="195" width="260" height="50"/>
            <rect x="0" y="150" width="210" height="45"/>
            <rect x="0" y="110" width="165" height="40"/>
            <rect x="0" y="75" width="120" height="35"/>
            <g stroke="#5a1717" strokeWidth="4" fill="none" opacity=".8">
              <path d="M20 360 v-60 a20 20 0 0 1 40 0 v60"/>
              <path d="M80 360 v-60 a20 20 0 0 1 40 0 v60"/>
              <path d="M140 360 v-60 a20 20 0 0 1 40 0 v60"/>
              <path d="M200 300 v-55 a18 18 0 0 1 36 0 v55"/>
              <path d="M255 300 v-55 a18 18 0 0 1 36 0 v55"/>
              <path d="M40 245 v-50 a16 16 0 0 1 32 0 v50"/>
              <path d="M95 245 v-50 a16 16 0 0 1 32 0 v50"/>
            </g>
          </g>
        </svg>

        {/* ------------------------------------------------------------- */}
        {/* CENTERED TYPOGRAPHY "TANGY SESSIONS" (z-15)                    */}
        {/* ------------------------------------------------------------- */}
        <div className="headline absolute z-15 top-[5cqw] left-0 right-0 text-center flex flex-col items-center justify-center [filter:url(#roughen)] pointer-events-none">
          <span 
            className="word tangy block font-poster text-[clamp(2.5rem,15.5cqw,17.5rem)] leading-[0.80] tracking-[0.005em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410] before:[-webkit-text-stroke:0]" 
            data-text="TANGY"
          >
            TANGY
          </span>
          <span 
            className="word sessions block font-poster text-[clamp(2.2rem,14.5cqw,16.5rem)] leading-[0.80] tracking-[-0.01em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative -mt-[0.2cqw] before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410] before:[-webkit-text-stroke:0]" 
            data-text="SESSIONS"
          >
            SESSIONS
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 5-PERFORMER ENSEMBLE COMPOSITION                               */}
        {/* Center: Afro Guitarist (z-20)                                  */}
        {/* Inner Left: Kathak Dancer (z-19), Inner Right: Veena (z-19)     */}
        {/* Far Left: Violinist (z-18), Far Right: Hip-hop Dancer (z-18)   */}
        {/* ------------------------------------------------------------- */}

        {/* FAR LEFT: Violinist Girl in White Dress */}
        <div className="portrait-wrap-far-left absolute z-[18] left-[15%] top-[34%] -translate-x-1/2 w-[15cqw] min-w-[65px] max-w-[290px] h-[39cqw] min-h-[170px] max-h-[540px] pointer-events-none">
          <img 
            src="/media/hero-performer-1-violinist.png" 
            alt="Violinist Performer" 
            className="relative w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" 
          />
        </div>

        {/* INNER LEFT: Kathak Classical Dancer in Orange */}
        <div className="portrait-wrap-inner-left absolute z-[19] left-[31%] top-[33%] -translate-x-1/2 w-[15cqw] min-w-[70px] max-w-[300px] h-[40cqw] min-h-[180px] max-h-[550px] pointer-events-none">
          <img 
            src="/media/hero-performer-4-kathak.png" 
            alt="Kathak Classical Dancer Performer" 
            className="relative w-full h-full object-contain filter drop-shadow-[0_14px_26px_rgba(0,0,0,0.6)]" 
          />
        </div>

        {/* CENTER: Afro Rock Guitarist Guy in Red Jacket */}
        <div className="portrait-wrap-center absolute z-20 left-[50%] top-[32%] -translate-x-1/2 w-[19cqw] min-w-[95px] max-w-[380px] h-[44cqw] min-h-[200px] max-h-[620px] pointer-events-none">
          <img 
            src="/media/hero-performer-2-guitarist.png" 
            alt="Tangy Afro Rock Guitarist Performer" 
            className="relative w-full h-full object-contain filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.7)] z-2" 
          />
        </div>

        {/* INNER RIGHT: Veena Classical Musician in Green Saree */}
        <div className="portrait-wrap-inner-right absolute z-[19] right-[30%] top-[34%] translate-x-1/2 w-[15cqw] min-w-[70px] max-w-[300px] h-[39cqw] min-h-[175px] max-h-[540px] pointer-events-none">
          <img 
            src="/media/hero-performer-3-veena.png" 
            alt="Veena Classical Musician Performer" 
            className="relative w-full h-full object-contain filter drop-shadow-[0_14px_26px_rgba(0,0,0,0.6)]" 
          />
        </div>

        {/* FAR RIGHT: Hip-Hop Dancer Guy in Blue Sweatshirt */}
        <div className="portrait-wrap-far-right absolute z-[18] right-[14%] top-[34%] translate-x-1/2 w-[15cqw] min-w-[65px] max-w-[290px] h-[40cqw] min-h-[180px] max-h-[550px] pointer-events-none">
          <img 
            src="/media/hero-performer-5-hiphop.png" 
            alt="Hip-Hop Dancer Performer" 
            className="relative w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" 
          />
        </div>



        {/* ------------------------------------------------------------- */}
        {/* SCROLL TO VIEW INDICATOR (z-40)                                */}
        {/* ------------------------------------------------------------- */}
        <div className="absolute z-40 bottom-[1.8cqw] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 font-mono text-[clamp(6.5px,0.7cqw,11px)] font-bold tracking-[0.25em] text-[#ecdcaf]/80 uppercase animate-bounce pointer-events-none">
          <span>SCROLL TO VIEW</span>
          <svg className="w-[1.1cqw] min-w-[10px] h-[1.1cqw] min-h-[10px] opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LABELS & STICKERS (z-40)                                      */}
        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: 33⅓ RPM BADGE */}
        <div className="badge absolute z-40 left-[2.5cqw] top-[18%] w-[11cqw] min-w-[50px] max-w-[11cqw] h-[11cqw] min-h-[50px] max-h-[11cqw] rounded-full bg-[#ecdcaf] border-[0.35cqw] border-[#c2272a] flex flex-col items-center justify-center text-center text-[#c2272a] shadow-[0_0.6cqw_1.2cqw_rgba(0,0,0,0.45)] -rotate-6 pointer-events-none">
          <div className="font-poster text-[clamp(9px,2.5cqw,36px)] leading-[0.9]">33<span className="text-[clamp(5px,1.1cqw,16px)] align-super">⅓</span></div>
          <div className="font-mono font-bold text-[clamp(5px,1.1cqw,14px)] tracking-[0.08em] mt-[0.1cqw]">RPM</div>
          <svg className="w-[0.85cqw] min-w-[6px] h-[0.85cqw] min-h-[6px] mt-[0.2cqw]" viewBox="0 0 24 24" fill="#c2272a"><path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.3 7-6.3-3.6L5.7 21l1.3-7-5-4.9 7.1-.7z"/></svg>
          <div className="font-mono font-semibold text-[clamp(4px,0.9cqw,12px)] tracking-[0.15em] mt-[0.25cqw]">STEREO</div>
        </div>

        {/* LEFT COLUMN: LIVE AND REAL TAPE STICKER */}
        <div className="badge absolute z-40 left-[16.5%] top-[20%] bg-[#191410] text-[#ecdcaf] p-[0.6cqw_1cqw] -rotate-6 shadow-[0_0.5cqw_1cqw_rgba(0,0,0,0.45)] text-center pointer-events-none">
          <div className="absolute -top-[0.8cqw] left-1/2 -translate-x-1/2 -rotate-3 w-[4cqw] min-w-[16px] h-[1.5cqw] min-h-[6px] bg-[rgba(230,220,190,0.55)] border border-[rgba(255,255,255,0.3)]" />
          <div className="font-mono font-bold text-[clamp(6.5px,1.45cqw,18px)] tracking-[0.04em]">LIVE</div>
          <div className="font-mono font-medium text-[clamp(4.5px,0.9cqw,12px)] tracking-[0.1em] mt-[0.1cqw]">AND REAL</div>
        </div>



        {/* RIGHT COLUMN: RECORDED LIVE STAMP */}
        <div className="badge absolute z-40 right-[2.5cqw] top-[38%] w-[9cqw] min-w-[45px] max-w-[9cqw] h-[9cqw] min-h-[45px] max-h-[9cqw] rounded-full border-[0.2cqw] border-dashed border-[#ecdcaf] outline-[0.05cqw] outline-solid outline-[#c2272a] bg-[radial-gradient(circle,rgba(194,39,42,0.12),transparent_70%)] flex items-center justify-center rotate-8 shadow-[0_0.5cqw_1cqw_rgba(0,0,0,0.4)] pointer-events-none">
          <div className="text-center">
            <div className="font-mono font-semibold text-[clamp(4px,0.7cqw,10px)] tracking-[0.1em] text-[#ecdcaf]">RECORDED</div>
            <div className="font-poster text-[clamp(8px,2cqw,26px)] text-[#c2272a] leading-none my-[0.1cqw]">LIVE</div>
            <div className="font-mono font-semibold text-[clamp(3.5px,0.6cqw,9px)] tracking-[0.08em] text-[#ecdcaf]">AT STEPWELL</div>
          </div>
        </div>

        {/* RIGHT COLUMN: INHERIT THE PAST TAG */}
        <div className="badge absolute z-40 right-[11%] top-[74%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.6cqw_1cqw] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.4)] text-center pointer-events-none">
          <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.2em]">INHERIT THE PAST</div>
          <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.2em]">CREATE THE FUTURE</div>
        </div>

        {/* RIGHT COLUMN: REC TAG */}
        <div className="badge absolute z-40 right-[3.5cqw] top-[78%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.5cqw_0.9cqw] flex items-center gap-[0.4cqw] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.4)] pointer-events-none">
          <span className="font-mono font-bold text-[clamp(6.5px,1.1cqw,14px)] tracking-[0.06em]">REC</span>
          <div className="w-[0.8cqw] min-w-[5px] h-[0.8cqw] min-h-[5px] rounded-full bg-[#c2272a] shadow-[0_0_0.4cqw_#c2272a]" />
        </div>

        {/* RIGHT COLUMN: KEEP THE CULTURE ALIVE + SIGNATURE */}
        <div className="badge absolute z-40 right-[5.5cqw] bottom-[10%] text-left text-[#ecdcaf] pointer-events-none">
          <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,18px)] leading-[1.12] tracking-[0.01em]">KEEP</div>
          <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,18px)] leading-[1.12] tracking-[0.01em]">THE CULTURE</div>
          <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,18px)] leading-[1.12] tracking-[0.01em]">ALIVE ★</div>
          <div className="flex items-center gap-[0.4cqw] mt-[0.3cqw]">
            <svg className="w-[1.2cqw] min-w-[8px] h-[1.2cqw] min-h-[8px]" viewBox="0 0 24 24" fill="#c2272a"><path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.3 7-6.3-3.6L5.7 21l1.3-7-5-4.9 7.1-.7z"/></svg>
            <span className="flex-1 h-[1px] bg-[#d1a437] opacity-70 max-w-[2.8cqw]" />
          </div>
        </div>
        <div className="badge absolute z-40 right-[3cqw] bottom-[4%] font-serif italic font-bold text-[clamp(16px,3cqw,42px)] text-[#d1a437] -rotate-6 drop-shadow-[0.08cqw_0.1cqw_0_rgba(0,0,0,0.3)] pointer-events-none">
          Tangy
        </div>

        {/* TEXTURE OVERLAYS (z-10) */}
        <div className="spatter absolute inset-0 z-10 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_6%_88%,rgba(0,0,0,0.35)_0_3px,transparent_4px),radial-gradient(circle_at_9%_91%,rgba(0,0,0,0.3)_0_2px,transparent_3px),radial-gradient(circle_at_93%_12%,rgba(0,0,0,0.3)_0_2px,transparent_3px)]" />
        <div className="scratches absolute inset-0 z-10 pointer-events-none opacity-50 mix-blend-soft-light bg-[repeating-linear-gradient(78deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_140px),repeating-linear-gradient(-83deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_220px)]" />
        <div className="grain absolute inset-0 z-10 bg-[url('data:image/svg+xml;utf8,<svg_xmlns=%22http://www.w3.org/2000/svg%22_width=%22180%22_height=%22180%22><filter_id=%22n%22><feTurbulence_type=%22fractalNoise%22_baseFrequency=%220.85%22_numOctaves=%222%22_stitchTiles=%22stitch%22/><feColorMatrix_type=%22saturate%22_values=%220%22/></filter><rect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%220.5%22/></svg>')] opacity-35 mix-blend-overlay pointer-events-none" />
        <div className="vignette absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

      </div>
    </section>
  );
};
