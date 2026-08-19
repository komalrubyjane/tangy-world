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
      duration: 0.9,
      stagger: 0.15,
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
      y: 45,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.2,
      ease: 'power3.out'
    });

    gsap.from('.badge', {
      opacity: 0,
      scale: 0.75,
      stagger: 0.06,
      duration: 0.6,
      delay: 0.5,
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

  // Desktop Mouse Parallax
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
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none z-0">
        <filter id="roughen" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>

      {/* FULL-SCREEN EDGE-TO-EDGE POSTER CANVAS */}
      <div 
        className="poster absolute inset-0 w-full h-full bg-[radial-gradient(120%_90%_at_50%_8%,#8a2320_0%,#6e1a19_45%,#4c1210_100%)] overflow-hidden container-inline-size"
      >
        {/* CORNER CROSSHAIRS */}
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] left-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>
        <div className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] right-[1.4cqw] pointer-events-none">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
        </div>

        {/* TOP BAR VISUAL GRID ALIGNMENT */}
        <div className="absolute z-40 top-[52px] md:top-[2.2cqw] left-[3cqw] right-[3cqw] flex items-start justify-between pointer-events-none">
          {/* TOP LEFT */}
          <div className="text-[clamp(8px,1.05cqw,16px)] leading-tight text-left font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
            <div>HYDERABAD, INDIA</div>
            <div className="flex items-center gap-[0.4cqw] mt-[0.2cqw]">
              <span>EST. 2016</span>
              <svg className="w-[1cqw] min-w-[7px] h-[1cqw] min-h-[7px] opacity-90 inline" viewBox="0 0 24 24" fill="none" stroke="#ecdcaf" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
            </div>
          </div>

          {/* TOP CENTER */}
          <div className="text-center hidden sm:block">
            <div className="font-mono font-semibold text-[clamp(8px,1.4cqw,20px)] tracking-[0.22em] text-[#ecdcaf] uppercase">
              LIVE MUSIC • HERITAGE • CULTURE
            </div>
            <div className="flex items-center justify-center gap-[0.5cqw] mt-[0.4cqw]">
              <span className="w-[8cqw] min-w-[24px] h-[2px] bg-[#d1a437] opacity-80" />
            </div>
          </div>

          {/* TOP RIGHT */}
          <div className="text-[clamp(8px,1.05cqw,16px)] leading-tight text-right font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
            <div className="flex items-center justify-end gap-[0.4cqw]">
              <span>LIVE ARCHIVE</span>
            </div>
            <div className="mt-[0.2cqw]">ISSUE 001 · SIDE A</div>
          </div>
        </div>

        {/* STEPWELL SILHOUETTE */}
        <svg className="absolute z-2 left-0 bottom-0 w-[34cqw] min-w-[110px] h-[36cqw] min-h-[130px] opacity-55 mix-blend-multiply pointer-events-none" viewBox="0 0 400 420" preserveAspectRatio="xMinYMax meet">
          <g fill="#3c0f0e">
            <rect x="0" y="360" width="400" height="60"/>
            <rect x="0" y="300" width="360" height="60"/>
            <rect x="0" y="245" width="310" height="55"/>
            <rect x="0" y="195" width="260" height="50"/>
          </g>
        </svg>

        {/* CENTERED TYPOGRAPHY "TANGY SESSIONS" */}
        <div className="headline absolute z-15 top-[68px] sm:top-[16cqw] md:top-[12cqw] lg:top-[5cqw] left-0 right-0 text-center flex flex-col items-center justify-center [filter:url(#roughen)] pointer-events-none will-change-transform">
          <span 
            className="word tangy block font-poster text-[clamp(2.8rem,15.5cqw,17.5rem)] leading-[0.80] tracking-[0.005em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410]" 
            data-text="TANGY"
          >
            TANGY
          </span>
          <span 
            className="word sessions block font-poster text-[clamp(2.5rem,14.5cqw,16.5rem)] leading-[0.80] tracking-[-0.01em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative -mt-[0.2cqw] before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410]" 
            data-text="SESSIONS"
          >
            SESSIONS
          </span>
        </div>

        {/* 5-PERFORMER ENSEMBLE COMPOSITION */}
        {/* FAR LEFT: Violinist */}
        <div className="portrait-wrap-far-left absolute z-[18] left-[12%] sm:left-[15%] top-[40%] sm:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[55px] max-w-[290px] h-[39cqw] min-h-[150px] max-h-[540px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-1-violinist.png" alt="Violinist" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
        </div>

        {/* INNER LEFT: Kathak Classical Dancer */}
        <div className="portrait-wrap-inner-left absolute z-[19] left-[30%] sm:left-[31%] top-[39%] sm:top-[33%] -translate-x-1/2 w-[16cqw] min-w-[60px] max-w-[300px] h-[40cqw] min-h-[160px] max-h-[550px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-4-kathak.png" alt="Kathak Dancer" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        </div>

        {/* CENTER: Afro Rock Guitarist */}
        <div className="portrait-wrap-center absolute z-20 left-[50%] top-[37%] sm:top-[32%] -translate-x-1/2 w-[22cqw] sm:w-[19cqw] min-w-[85px] max-w-[380px] h-[44cqw] min-h-[180px] max-h-[620px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-2-guitarist.png" alt="Afro Rock Guitarist" className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" />
        </div>

        {/* INNER RIGHT: Veena Classical Musician */}
        <div className="portrait-wrap-inner-right absolute z-[19] left-[70%] sm:left-[69%] top-[40%] sm:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[60px] max-w-[300px] h-[39cqw] min-h-[155px] max-h-[540px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-3-veena.png" alt="Veena Musician" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        </div>

        {/* FAR RIGHT: Hip-Hop Dancer */}
        <div className="portrait-wrap-far-right absolute z-[18] left-[88%] sm:left-[85%] top-[40%] sm:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[55px] max-w-[290px] h-[40cqw] min-h-[155px] max-h-[550px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-5-hiphop.png" alt="Hip-Hop Dancer" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
        </div>

        {/* SCROLL TO VIEW INDICATOR */}
        <div className="absolute z-40 bottom-[1.8cqw] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 font-mono text-[clamp(6.5px,0.7cqw,11px)] font-bold tracking-[0.25em] text-[#ecdcaf]/80 uppercase animate-bounce pointer-events-none">
          <span>SCROLL TO VIEW</span>
          <svg className="w-[1.1cqw] min-w-[10px] h-[1.1cqw] min-h-[10px] opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>

        {/* LABELS & STICKERS */}
        {/* 33⅓ RPM BADGE */}
        <div className="badge absolute z-40 left-[2cqw] top-[24%] sm:top-[18%] w-[11cqw] min-w-[45px] max-w-[120px] aspect-square -rotate-6 pointer-events-none drop-shadow-md">
          <img src="/media/33-rpm-stereo.png" alt="33⅓ RPM Stereo vinyl badge" className="w-full h-full object-contain" />
        </div>

        {/* LIVE AND REAL TAPE STICKER */}
        <div className="badge absolute z-40 left-[14%] sm:left-[16.5%] top-[24%] sm:top-[18%] w-[12cqw] min-w-[50px] max-w-[140px] -rotate-6 pointer-events-none drop-shadow-md">
          <img src="/media/live-and-real.png" alt="Live and Real tape sticker" className="w-full h-full object-contain" />
        </div>

        {/* RIGHT COLUMN: INHERIT THE PAST TAG */}
        <div className="badge absolute z-40 right-[4%] sm:right-[11%] top-[72%] sm:top-[74%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.6cqw_1cqw] shadow-md text-center pointer-events-none">
          <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.18em]">INHERIT THE PAST</div>
          <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.18em]">CREATE THE FUTURE</div>
        </div>

        {/* RIGHT COLUMN: REC TAG */}
        <div className="badge absolute z-40 right-[3.5cqw] top-[78%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.5cqw_0.9cqw] flex items-center gap-[0.4cqw] shadow-md pointer-events-none">
          <span className="font-mono font-bold text-[clamp(6.5px,1.1cqw,14px)] tracking-[0.06em]">REC</span>
          <div className="w-[0.8cqw] min-w-[5px] h-[0.8cqw] min-h-[5px] rounded-full bg-[#c2272a] animate-[pulseLine_2s_ease-in-out_infinite]" />
        </div>

        {/* RIGHT COLUMN: KEEP THE CULTURE ALIVE */}
        <div className="badge absolute z-40 right-[4.5cqw] bottom-[8%] text-left text-[#ecdcaf] pointer-events-none">
          <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,18px)] leading-[1.12]">KEEP THE CULTURE ALIVE ★</div>
        </div>
        <div className="badge absolute z-40 right-[3cqw] bottom-[3%] font-serif italic font-bold text-[clamp(16px,3cqw,42px)] text-[#d1a437] -rotate-6 drop-shadow-md pointer-events-none">
          Tangy
        </div>

        {/* ============================================================ */}
        {/* NEGATIVE-SPACE EDITORIAL ANNOTATIONS — plain typography       */}
        {/* printed directly on the poster (no card backgrounds), like   */}
        {/* captions and metadata on a vintage record sleeve. Left/      */}
        {/* center columns only — the right column above already carries*/}
        {/* INHERIT/REC/KEEP/Tangy, so this fills the rest without       */}
        {/* crowding it or covering any performer/instrument.            */}
        {/* ============================================================ */}

        {/* LEFT COLUMN: EDITORIAL HEADING + CAPTION + QUOTE */}
        <div className="badge absolute z-40 left-[5%] sm:left-[6%] top-[60%] sm:top-[58%] max-w-[42cqw] sm:max-w-[19cqw] min-w-[130px] pointer-events-none">
          <div className="font-poster text-[clamp(11px,1.9cqw,22px)] leading-[0.92] tracking-[0.01em] text-[#d1a437] uppercase">
            The Sound<br />of the City
          </div>
          <p className="font-serif italic text-[clamp(6.5px,0.95cqw,10.5px)] leading-snug text-[#ecdcaf]/80 mt-[0.4rem]">
            Live music, heritage spaces, and stories from Hyderabad.
          </p>
          <p className="font-serif italic text-[clamp(6px,0.85cqw,9.5px)] leading-snug text-[#ecdcaf]/50 mt-[0.45rem]">
            "A room remembers every song."
          </p>
        </div>

        {/* CENTER: FIELD RECORDING ANNOTATION + TINY WAVEFORM (near the hanging microphone) */}
        <div className="badge absolute z-40 left-[52%] sm:left-[50%] top-[63%] sm:top-[61%] w-max max-w-[26cqw] min-w-[96px] flex flex-col items-center gap-[0.3rem] pointer-events-none">
          <div className="flex items-end gap-[2px] h-[1rem]" aria-hidden="true">
            {[0.4, 0.85, 0.55, 1, 0.35, 0.7, 0.5].map((h, i) => (
              <span
                key={i}
                className="w-[2.5px] sm:w-[3px] bg-[#d1a437]/80 rounded-sm origin-bottom animate-[eqBar_1.3s_ease-in-out_infinite]"
                style={{ height: `${h * 100}%`, animationDelay: `${i * 110}ms` }}
              />
            ))}
          </div>
          <div className="font-mono text-[clamp(5.5px,0.8cqw,8.5px)] font-bold tracking-[0.18em] text-[#ecdcaf]/80 uppercase text-center leading-relaxed">
            FIELD REC. // SIDE A<br />
            LIVE • REAL • LOCAL
          </div>
        </div>

        {/* LEFT COLUMN: SMALL LABEL + ARCHIVAL METADATA STRIP (plain typography, no card) */}
        <div className="badge absolute z-40 left-[5%] sm:left-[6%] top-[76%] sm:top-[74%] max-w-[58cqw] sm:max-w-[22cqw] min-w-[150px] pointer-events-none">
          <div className="font-mono text-[clamp(7px,1.05cqw,11.5px)] font-bold tracking-[0.1em] text-[#ecdcaf] uppercase leading-tight">
            Tangy Sessions
          </div>
          <div className="font-mono text-[clamp(5px,0.72cqw,8px)] tracking-[0.15em] text-[#ecdcaf]/55 uppercase mt-[0.2rem] leading-relaxed">
            Music experiences in unexpected places
          </div>
          <div className="font-mono text-[clamp(5px,0.7cqw,7.5px)] tracking-[0.12em] text-[#d1a437]/65 uppercase mt-[0.5rem] leading-relaxed border-t border-[#ecdcaf]/15 pt-[0.35rem]">
            33⅓ RPM · STEREO · SIDE A · VOL. 04 · LIVE TAKE · ARCHIVE NO. 1974 · HYD/TS · 432 Hz
          </div>
        </div>

        {/* TEXTURE OVERLAYS */}
        <div className="grain absolute inset-0 z-10 bg-[url('/noise.png')] opacity-13 mix-blend-overlay pointer-events-none" />
        <div className="vignette absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

      </div>
    </section>
  );
};
