import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';
import { BandhaniDotField, RangoliMedallion, TextileBorderStrip, HandDrawnCircle, HandDrawnArrow, RegistrationMark } from '../ui/CulturalMotifs';

// Mobile-only cast cycle for the hero's single central spot: instead of a
// fixed guitarist, one performer at a time crossfades in/out every 2s so the
// full cast is still represented without spreading them across the poster
// again. Guitarist stays first (strongest silhouette, and the desktop
// composition's own centered performer). Desktop is untouched — it keeps its
// original static 5-across row via a separate, unconditional image.
const HERO_PERFORMER_CYCLE = [
  { src: '/media/hero-performer-2-guitarist.png', alt: 'Afro Rock Guitarist' },
  { src: '/media/hero-performer-4-kathak.png', alt: 'Kathak Dancer' },
  { src: '/media/hero-performer-3-veena.png', alt: 'Veena Musician' },
  { src: '/media/hero-performer-5-hiphop.png', alt: 'Hip-Hop Dancer' },
  { src: '/media/hero-performer-1-violinist.png', alt: 'Violinist' },
];
const HERO_PERFORMER_INTERVAL_MS = 2000;

export const Hero = () => {
  const navigate = useNavigate();
  const { setFilterCutoff, playSFX } = useAudio();
  const [activePerformer, setActivePerformer] = useState(0);

  // Cycle the mobile hero's central performer. Skipped entirely under
  // prefers-reduced-motion, which leaves the guitarist showing statically.
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const id = setInterval(() => {
      setActivePerformer((i) => (i + 1) % HERO_PERFORMER_CYCLE.length);
    }, HERO_PERFORMER_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

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

    // Riso-print "misregistration" pass: a vermilion ghost of the headline slides into
    // near-register with the real type and settles at a permanently visible offset —
    // a standing two-colour print-registration signature, not just an intro flash.
    const reducedMotionIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotionIntro) {
      gsap.fromTo('.riso-ghost',
        { x: 14, y: -11, opacity: 0.7 },
        { x: 5, y: -4, opacity: 0.45, duration: 1.1, ease: 'power3.out', delay: 0.35 }
      );
    } else {
      gsap.set('.riso-ghost', { x: 5, y: -4, opacity: 0.45 });
    }

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
        {/* CORNER REGISTRATION MARKS */}
        <RegistrationMark color="#ecdcaf" className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] left-[1.4cqw] pointer-events-none" />
        <RegistrationMark color="#ecdcaf" className="absolute z-30 w-[2.8cqw] min-w-[12px] h-[2.8cqw] min-h-[12px] opacity-85 top-[1.4cqw] right-[1.4cqw] pointer-events-none" />
        {/* BOTTOM-RIGHT — desktop only, mirrors the mobile pair that already existed; */}
        {/* completes the four-corner print-registration frame. */}
        <RegistrationMark color="#ecdcaf" className="hidden lg:block absolute z-30 w-[2.2cqw] min-w-[12px] h-[2.2cqw] min-h-[12px] opacity-60 bottom-[1.4cqw] right-[1.4cqw] pointer-events-none" />

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

        {/* CENTERED TYPOGRAPHY "TANGY SESSIONS" — moved down to sit right above the vertical middle of the */}
        {/* hero (mobile only; sm:/md:/lg: unchanged). dvh-based, not a fixed px, so "right above the middle" */}
        {/* holds consistently whether the phone is short or tall — a fixed px offset would sit progressively */}
        {/* higher (relatively) on taller phones. */}
        <div className="headline absolute z-15 top-[21dvh] sm:top-[16cqw] md:top-[12cqw] lg:top-[5cqw] left-0 right-0 text-center flex flex-col items-center justify-center [filter:url(#roughen)] pointer-events-none will-change-transform">
          <span
            className="word tangy block font-poster text-[clamp(2.8rem,15.5cqw,17.5rem)] leading-[0.80] tracking-[0.005em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410]"
            data-text="TANGY"
          >
            <span className="riso-ghost absolute inset-0 -z-1 text-[#D91E18] pointer-events-none select-none" aria-hidden="true">TANGY</span>
            TANGY
          </span>
          <span
            className="word sessions block font-poster text-[clamp(2.5rem,14.5cqw,16.5rem)] leading-[0.80] tracking-[-0.01em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative -mt-[0.2cqw] before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410]"
            data-text="SESSIONS"
          >
            <span className="riso-ghost absolute inset-0 -z-1 text-[#D91E18] pointer-events-none select-none" aria-hidden="true">SESSIONS</span>
            SESSIONS
          </span>
        </div>

        {/* PERFORMER COMPOSITION — mobile (<lg) shows ONLY the guitarist as a single */}
        {/* cover-star focal point (editorial poster direction); the other four are  */}
        {/* hidden below lg and the guitarist reclaims their space. Desktop (lg+)     */}
        {/* keeps the original flat 5-across row untouched via lg: overrides that     */}
        {/* reproduce the pre-existing values exactly. */}
        {/* FAR LEFT: Violinist — desktop only */}
        <div className="portrait-wrap-far-left hidden lg:block absolute z-[18] lg:left-[15%] lg:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[55px] max-w-[290px] h-[39cqw] min-h-[150px] max-h-[540px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-1-violinist.png" alt="Violinist" className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]" />
        </div>

        {/* INNER LEFT: Kathak Classical Dancer — desktop only */}
        <div className="portrait-wrap-inner-left hidden lg:block absolute z-[19] lg:left-[31%] lg:top-[33%] -translate-x-1/2 w-[16cqw] min-w-[60px] max-w-[300px] h-[40cqw] min-h-[160px] max-h-[550px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-4-kathak.png" alt="Kathak Dancer" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        </div>

        {/* CENTER: the hero's single focal spot — sized up substantially on mobile; desktop keeps its original modest scale. */}
        {/* Height is dvh-based (not cqw/width-based) on mobile: a width-driven box scales with how WIDE the */}
        {/* phone is, but the empty space above/below it is a function of viewport HEIGHT — on a tall phone */}
        {/* a width-driven box stayed small while the gaps above and below it grew into large dead zones. */}
        {/* Sizing off dvh instead makes the performer consistently fill the same proportion of the vertical */}
        {/* space on every phone, tall or short. */}
        <div className="portrait-wrap-center absolute z-20 left-[50%] top-[40%] lg:top-[32%] -translate-x-1/2 w-[72cqw] lg:w-[19cqw] min-w-[230px] lg:min-w-[92px] max-w-[440px] lg:max-w-[400px] h-[46dvh] lg:h-[44cqw] min-h-[200px] lg:min-h-[180px] max-h-[460px] lg:max-h-[620px] pointer-events-none will-change-transform">
          {/* Desktop: original static Afro Rock Guitarist, unchanged */}
          <div className="hidden lg:block w-full h-full">
            <img src="/media/hero-performer-2-guitarist.png" alt="Afro Rock Guitarist" className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]" />
          </div>
          {/* Mobile: the full cast crossfades through this same spot every 2s */}
          <div className="lg:hidden relative w-full h-full">
            {HERO_PERFORMER_CYCLE.map((performer, i) => (
              <img
                key={performer.src}
                src={performer.src}
                alt={performer.alt}
                className={`absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-opacity duration-700 ease-in-out ${
                  i === activePerformer ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))}
          </div>
        </div>

        {/* INNER RIGHT: Veena Classical Musician — desktop only */}
        <div className="portrait-wrap-inner-right hidden lg:block absolute z-[19] lg:left-[69%] lg:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[60px] max-w-[300px] h-[39cqw] min-h-[155px] max-h-[540px] pointer-events-none will-change-transform">
          <img src="/media/hero-performer-3-veena.png" alt="Veena Musician" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        </div>

        {/* FAR RIGHT: Hip-Hop Dancer — desktop only */}
        <div className="portrait-wrap-far-right hidden lg:block absolute z-[18] lg:left-[85%] lg:top-[34%] -translate-x-1/2 w-[16cqw] min-w-[55px] max-w-[290px] h-[40cqw] min-h-[155px] max-h-[550px] pointer-events-none will-change-transform">
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
        {/* 33⅓ RPM BADGE — nudged down on phone (base) only, past the now much-bigger */}
        {/* guitarist's head, into the clear margin beside his torso; sm:/desktop unchanged */}
        <div className="badge absolute z-40 left-[2cqw] top-[57%] sm:top-[18%] w-[11cqw] min-w-[45px] max-w-[120px] aspect-square -rotate-6 pointer-events-none drop-shadow-md">
          <img src="/media/33-rpm-stereo.png" alt="33⅓ RPM Stereo vinyl badge" className="w-full h-full object-contain" />
        </div>

        {/* LIVE AND REAL TAPE STICKER — same phone-only nudge */}
        <div className="badge absolute z-40 left-[14%] sm:left-[16.5%] top-[57%] sm:top-[18%] w-[12cqw] min-w-[50px] max-w-[140px] -rotate-6 pointer-events-none drop-shadow-md">
          <img src="/media/live-and-real.png" alt="Live and Real tape sticker" className="w-full h-full object-contain" />
        </div>

        {/* RIGHT COLUMN CLUSTER (INHERIT / REC / KEEP THE CULTURE / Tangy) — these four used to be four */}
        {/* independent absolutely-positioned badges with mismatched top/bottom anchors; on mobile that */}
        {/* let them drift into each other and into the fixed bottom nav once the guitarist grew larger. */}
        {/* This wrapper turns them into one flex-stacked, collision-free column on mobile (<lg), sized to */}
        {/* fit above the nav on every phone tested. On desktop (lg+) the wrapper becomes `contents` (it */}
        {/* renders no box of its own) and each child's own `lg:` classes put it back at its exact original */}
        {/* absolute position — desktop is byte-for-byte the same layout as before. */}
        <div className="absolute z-40 right-[4%] top-[64%] flex flex-col items-end gap-[0.4rem] lg:contents pointer-events-none">
          {/* INHERIT THE PAST TAG */}
          <div className="badge z-40 bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.6cqw_1cqw] shadow-md text-center lg:absolute lg:right-[11%] lg:top-[74%]">
            <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.18em]">INHERIT THE PAST</div>
            <div className="font-mono font-bold text-[clamp(5.5px,1cqw,13px)] tracking-[0.18em]">CREATE THE FUTURE</div>
          </div>

          {/* REC TAG — circled by hand, an editor's-mark annotation calling it out */}
          <div className="badge relative z-40 bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.5cqw_0.9cqw] flex items-center gap-[0.4cqw] shadow-md lg:absolute lg:right-[3.5cqw] lg:top-[78%]">
            <span className="font-mono font-bold text-[clamp(6.5px,1.1cqw,14px)] tracking-[0.06em]">REC</span>
            <div className="w-[0.8cqw] min-w-[5px] h-[0.8cqw] min-h-[5px] rounded-full bg-[#c2272a] animate-[pulseLine_2s_ease-in-out_infinite]" />
            <HandDrawnCircle color="#c2272a" className="absolute -inset-[45%] pointer-events-none" />
          </div>

          {/* KEEP THE CULTURE ALIVE */}
          <div className="badge z-40 text-right text-[#ecdcaf] lg:absolute lg:right-[4.5cqw] lg:bottom-[8%] lg:text-left">
            <div className="font-mono font-semibold text-[clamp(7.5px,1.4cqw,18px)] leading-[1.12]">KEEP THE CULTURE ALIVE ★</div>
          </div>

          {/* Tangy signature */}
          <div className="badge z-40 font-serif italic font-bold text-[clamp(13px,3cqw,42px)] text-[#d1a437] -rotate-6 drop-shadow-md lg:absolute lg:right-[3cqw] lg:bottom-[3%] lg:text-[clamp(16px,3cqw,42px)]">
            Tangy
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE-ONLY RECORD-SLEEVE COMPOSITION (below lg / <1024px)    */}
        {/* Small printed-object graphics — not sections, not paragraphs  */}
        {/* — scattered through the negative space of the staggered       */}
        {/* performer arc, sized to fit inside the existing single-        */}
        {/* viewport hero (no extra hero height). Dark ink shadow keeps   */}
        {/* text legible over the artwork. Desktop (lg+) renders none of  */}
        {/* this — untouched.                                             */}
        {/* ============================================================ */}
        <div className="lg:hidden">

          {/* SUBTLE INSET POSTER FRAME */}
          <div className="absolute inset-[10px] border border-[#ecdcaf]/20 pointer-events-none" aria-hidden="true" />
          {/* BOTTOM REGISTRATION CROSSHAIRS (mirrors the two existing top ones) */}
          <div className="absolute z-30 w-[14px] h-[14px] opacity-70 bottom-[14px] left-[14px] pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
          </div>
          <div className="absolute z-30 w-[14px] h-[14px] opacity-70 bottom-[14px] right-[14px] pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
          </div>

          <div className="[text-shadow:0_1px_5px_rgba(17,16,12,0.95),0_1px_2px_rgba(17,16,12,0.95)]">

            {/* ARCHIVE STAMP — upper-right, below the existing "LIVE ARCHIVE" text, dashed distressed stamp */}
            <div className="badge absolute z-40 right-[5%] top-[13%] rotate-3 border border-dashed border-[#C99A2E]/70 px-[0.5rem] py-[0.25rem] pointer-events-none">
              <div className="font-mono text-[clamp(6px,1.2cqw,8px)] font-bold tracking-[0.16em] text-[#C99A2E] uppercase text-center">Archive</div>
              <div className="font-mono text-[clamp(5px,0.95cqw,6.5px)] tracking-[0.12em] text-[#ecdcaf]/75 uppercase text-center mt-[0.1rem]">Hyd / TS</div>
              <div className="font-mono text-[clamp(6px,1.2cqw,8px)] font-bold tracking-[0.14em] text-[#ecdcaf] uppercase text-center">001</div>
            </div>

            {/* FIELD RECORDING LABEL — right side, level with the guitarist's torso (below the guitar's headstock), with a tiny eq */}
            <div className="badge absolute z-40 right-[5%] top-[57%] text-right pointer-events-none">
              <div className="font-mono text-[clamp(6px,1.15cqw,8px)] font-bold tracking-[0.14em] text-[#ecdcaf]/85 uppercase leading-relaxed">
                Field Recording // Side A
              </div>
              <div className="flex items-center justify-end gap-[0.4rem] mt-[0.2rem]">
                <span className="font-mono text-[clamp(5.5px,1.05cqw,7px)] tracking-[0.14em] text-[#d1a437]/85 uppercase">Vol. 01</span>
                <div className="flex items-end gap-[2px] h-[0.6rem]" aria-hidden="true">
                  {[0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
                    <span
                      key={i}
                      className="w-[2px] bg-[#d1a437] rounded-sm origin-bottom animate-[eqBar_1.3s_ease-in-out_infinite]"
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* LIVE SESSION TICKET — lower-left, taped, perforated, small archive metadata folded in. */}
            {/* The handwritten quote now lives in its footer (a separate floating quote badge above */}
            {/* it didn't leave enough room for the ticket above the bottom nav on the shortest phones */}
            {/* tested) — this keeps it as the hero's one short quote/sentence, just consolidated into */}
            {/* a single card instead of two stacked elements. */}
            {/* [text-shadow:none] cancels the wrapper's inherited legibility shadow (5px blur radius, */}
            {/* meant for text floating directly over the artwork background) — this ticket sits on its */}
            {/* own opaque cream card and doesn't need it; at this card's tiny font sizes that shadow's */}
            {/* blur radius was larger than the glyphs themselves, reading as blur rather than print. */}
            <div className="badge absolute z-40 left-[5%] top-[68%] w-[56%] max-w-[230px] min-w-[172px] -rotate-2 bg-[#EFE3BE] text-[#241a12] border border-[#241a12]/70 shadow-[3px_3px_0_rgba(17,16,12,0.55)] [text-shadow:none] pointer-events-none">
              <div className="absolute -top-[6px] left-[14%] w-[28%] h-[9px] bg-[rgba(231,213,164,0.75)] rotate-[-3deg] border border-black/20" aria-hidden="true" />
              <div className="flex">
                <div className="flex-1 px-[0.4rem] py-[0.3rem] border-r border-dashed border-[#241a12]/40">
                  <div className="font-mono text-[clamp(5px,1cqw,6.5px)] font-bold tracking-[0.1em] uppercase opacity-70">Hyd / TS / 001 · 432 Hz</div>
                  <div className="font-mono text-[clamp(6.5px,1.5cqw,9.5px)] font-bold tracking-[0.06em] uppercase text-[#B94717] mt-[0.2rem]">Live Session</div>
                  <div className="font-mono text-[clamp(5px,1cqw,6.5px)] tracking-[0.1em] uppercase mt-[0.3rem] opacity-80 leading-relaxed">
                    Bansilalpet Stepwell<br />Hyderabad, India
                  </div>
                  <p className="font-serif italic text-[clamp(6px,1.3cqw,8px)] leading-snug opacity-75 mt-[0.3rem] border-t border-dashed border-[#241a12]/30 pt-[0.25rem]">
                    "Every room has a memory."
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-[2px] px-[0.3rem] text-[#C99A2E] text-[6.5px]" aria-hidden="true">
                  <span>★</span><span>★</span><span>★</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BANDHANI-INSPIRED DOT FIELD — a real visible mustard tie-dye pattern across the */}
        {/* field, not a barely-there texture. */}
        <BandhaniDotField color="#D1A437" opacity={0.16} size={38} className="z-5" />

        {/* POSTER BORDER FRAME — bold woven textile strips top and bottom, turning the whole */}
        {/* hero into a framed printed sheet rather than an edge-to-edge background. */}
        <TextileBorderStrip className="absolute top-0 left-0 right-0 z-30" height={11} colorA="#D1A437" colorB="#191410" />
        <TextileBorderStrip className="absolute bottom-0 left-0 right-0 z-30" height={11} colorA="#D1A437" colorB="#191410" />

        {/* BOTTOM-LEFT COLOUR-BLOCK WEDGE — desktop only. Breaks the uniform maroon field with */}
        {/* a mustard spot-colour panel (vintage-poster colour blocking), carrying a large */}
        {/* Rangoli medallion bleeding off the left edge and a rotated masthead label — the */}
        {/* section's biggest single asymmetric-composition move. */}
        <div
          className="hidden lg:block absolute z-6 left-0 bottom-0 w-[30cqw] h-[46cqw] pointer-events-none overflow-hidden"
          style={{ clipPath: 'polygon(0 100%, 0 22%, 100% 100%)' }}
        >
          <div className="absolute inset-0 bg-[#D1A437]" />
          <RangoliMedallion
            color="#4C1210"
            className="absolute -left-[10cqw] bottom-[-6cqw] w-[34cqw] h-[34cqw] opacity-40 animate-[spin_140s_linear_infinite]"
          />
        </div>
        <div className="hidden lg:flex absolute z-30 left-[1.1cqw] bottom-[3cqw] top-[8cqw] items-end justify-center pointer-events-none">
          <span
            className="font-poster text-[#ECDCAF] text-[clamp(13px,1.7cqw,22px)] tracking-[0.1em] uppercase whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            VOL. 01 — HYDERABAD ARCHIVE — EST. 2016
          </span>
        </div>

        {/* HAND-DRAWN CALLOUT — a single sparing annotation tying the new colour-block */}
        {/* wedge to the masthead label, an editor's pencil mark rather than a UI hint. */}
        <HandDrawnArrow
          color="#191410"
          className="hidden lg:block absolute z-25 left-[4cqw] bottom-[24cqw] w-[5cqw] max-w-[75px] opacity-45 pointer-events-none rotate-[35deg]"
        />

        {/* TEXTURE OVERLAYS */}
        <div className="grain absolute inset-0 z-10 bg-[url('/noise.png')] opacity-13 mix-blend-overlay pointer-events-none" />
        <div className="vignette absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

      </div>
    </section>
  );
};
