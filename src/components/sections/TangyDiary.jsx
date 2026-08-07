import React, { useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { useAudio } from '../../audio/AudioContext';

gsap.registerPlugin(ScrollTrigger);

export const TangyDiary = () => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const leaves = gsap.utils.toArray('.diary-leaf');
    const totalLeaves = leaves.length; // 6 leaves: Leaf 0 (Cover), Leaf 1 (Frontispiece/Page1), Leaf 2, 3, 4, 5 (Final)

    // Master ScrollTrigger timeline pinned to the diary section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=800%', // 800vh scroll height ensures comfortable reading distance for all spreads
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Play page turn SFX when crossing leaf boundaries
          const pageProgress = self.progress;
          const currentLeafIndex = Math.floor(pageProgress * totalLeaves);
          if (self.previousLeafIndex !== undefined && self.previousLeafIndex !== currentLeafIndex) {
            playSFX('pageTurn');
          }
          self.previousLeafIndex = currentLeafIndex;
        }
      }
    });

    // INITIAL STATES
    // The spine and book container never move, scale, or slide!
    gsap.set('.book-shadow', { opacity: 0.15 });

    // Set 3D origin on left edge (hinged to spine) for all leaves
    leaves.forEach((leaf, i) => {
      gsap.set(leaf, {
        rotateY: 0,
        transformOrigin: '0% 50%',
        zIndex: totalLeaves - i,
        display: 'block'
      });
    });

    gsap.set('.strap-layer', { opacity: 1, x: 0, scale: 1 });
    gsap.set('.read-more-cta', { opacity: 0, y: 15, pointerEvents: 'none' });
    gsap.set('.read-hint-1', { opacity: 1 });

    // =========================================================================
    // SCROLL TIMELINE SEQUENCE: SCROLLING = READING
    // =========================================================================

    // -------------------------------------------------------------------------
    // 0% - 10%: LANDING (COVER CLOSED) -> COVER OPENS
    // -------------------------------------------------------------------------
    // Strap releases & wax seal splits
    tl.to('.strap-layer', {
      opacity: 0,
      x: 40,
      scale: 0.95,
      duration: 0.04,
      ease: 'power2.in'
    }, 0.02)
    .to('.read-hint-1', { opacity: 0, duration: 0.03 }, 0.02)

    // Cover (Leaf 0) turns open (rotateY -180deg) with paper curl & shadow
    .to(leaves[0], {
      rotateY: -180,
      duration: 0.08,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[0], { zIndex: 1 });
        } else {
          gsap.set(leaves[0], { zIndex: totalLeaves });
        }
      }
    }, 0.04)

    // -------------------------------------------------------------------------
    // 10% - 22%: SPREAD 1 (THE BEGINNING & BANSILALPET STEPWELL) - READING
    // -------------------------------------------------------------------------
    // User reads Spread 1 comfortably during scroll buffer (0.08 -> 0.22)
    .to({}, { duration: 0.12 })

    // -------------------------------------------------------------------------
    // 22% - 28%: TURN SPREAD 1 (LEAF 1)
    // -------------------------------------------------------------------------
    .to(leaves[1], {
      rotateY: -180,
      duration: 0.06,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[1], { zIndex: 2 });
        } else {
          gsap.set(leaves[1], { zIndex: totalLeaves - 1 });
        }
      }
    }, 0.22)

    // -------------------------------------------------------------------------
    // 28% - 40%: SPREAD 2 (MONSOON ACOUSTICS & OLD CITY HAVELI) - READING
    // -------------------------------------------------------------------------
    // Reading buffer
    .to({}, { duration: 0.12 })

    // -------------------------------------------------------------------------
    // 40% - 46%: TURN SPREAD 2 (LEAF 2)
    // -------------------------------------------------------------------------
    .to(leaves[2], {
      rotateY: -180,
      duration: 0.06,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[2], { zIndex: 3 });
        } else {
          gsap.set(leaves[2], { zIndex: totalLeaves - 2 });
        }
      }
    }, 0.40)

    // -------------------------------------------------------------------------
    // 46% - 58%: SPREAD 3 (BEHIND THE MICROPHONES & GOLCONDA FORT) - READING
    // -------------------------------------------------------------------------
    // Reading buffer
    .to({}, { duration: 0.12 })

    // -------------------------------------------------------------------------
    // 58% - 64%: TURN SPREAD 3 (LEAF 3)
    // -------------------------------------------------------------------------
    .to(leaves[3], {
      rotateY: -180,
      duration: 0.06,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[3], { zIndex: 4 });
        } else {
          gsap.set(leaves[3], { zIndex: totalLeaves - 3 });
        }
      }
    }, 0.58)

    // -------------------------------------------------------------------------
    // 64% - 76%: SPREAD 4 (ARTISTS & LETTERS) - READING
    // -------------------------------------------------------------------------
    // Reading buffer
    .to({}, { duration: 0.12 })

    // -------------------------------------------------------------------------
    // 76% - 82%: TURN SPREAD 4 (LEAF 4)
    // -------------------------------------------------------------------------
    .to(leaves[4], {
      rotateY: -180,
      duration: 0.06,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[4], { zIndex: 5 });
        } else {
          gsap.set(leaves[4], { zIndex: totalLeaves - 4 });
        }
      }
    }, 0.76)

    // -------------------------------------------------------------------------
    // 82% - 100%: FINAL SPREAD (FUTURE & READ MORE CTA) - READING & EXIT
    // -------------------------------------------------------------------------
    .to('.read-more-cta', {
      opacity: 1,
      y: 0,
      pointerEvents: 'auto',
      duration: 0.08,
      ease: 'power2.out'
    }, 0.84)
    .to({}, { duration: 0.08 }); // Final scroll buffer before unpinning smoothly

  }, []);

  return (
    <section 
      ref={sectionRef}
      id="diary" 
      className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1C130C] via-[#120C07] to-[#0C0805] text-[#F3E7C9] overflow-hidden select-none font-serif border-t-8 border-[#11100C]"
    >
      {/* SVG NOISE GRAIN & AMBIENT DESK SVG DEFINITIONS */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[900] opacity-[0.045] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
      </svg>

      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <symbol id="sym-clip" viewBox="0 0 40 90">
            <path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#b9b9b9" strokeWidth="4" strokeLinecap="round"/>
          </symbol>
          <symbol id="sym-mic" viewBox="0 0 60 110">
            <g fill="none" stroke="#3a2416" strokeWidth="2.2" strokeLinecap="round">
              <rect x="20" y="6" width="20" height="40" rx="10"/>
              <path d="M12,40 a18,18 0 0 0 36,0"/>
              <line x1="30" y1="58" x2="30" y2="82"/>
              <line x1="14" y1="82" x2="46" y2="82"/>
              <line x1="24" y1="14" x2="36" y2="14"/><line x1="24" y1="22" x2="36" y2="22"/><line x1="24" y1="30" x2="36" y2="30"/>
            </g>
          </symbol>
          <symbol id="sym-wave" viewBox="0 0 120 30">
            <path d="M0,15 Q7,2 14,15 T28,15 T42,15 T56,15 T70,15 T84,15 T98,15 T112,15 T120,15" fill="none" stroke="#3a2416" strokeWidth="1.6" strokeLinecap="round"/>
          </symbol>
          <symbol id="sym-flower" viewBox="0 0 80 100">
            <g fill="none" stroke="#7a5236" strokeWidth="1.3">
              <line x1="40" y1="95" x2="40" y2="45"/>
              <path d="M40,45 Q30,60 25,80" /><path d="M40,55 Q50,68 55,84" />
              <g fill="#a33828" opacity="0.55" stroke="#7a5236">
                <ellipse cx="40" cy="20" rx="9" ry="16"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/>
                <ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/>
              </g>
              <circle cx="40" cy="20" r="5" fill="#C8A24A" stroke="none"/>
            </g>
          </symbol>
          <symbol id="sym-cassette" viewBox="0 0 60 40">
            <rect x="1" y="1" width="58" height="38" rx="3" fill="#d8d2c4" stroke="#8a7f68" strokeWidth="1"/>
            <rect x="8" y="6" width="44" height="9" fill="#7B1E1E"/>
            <circle cx="18" cy="27" r="7" fill="none" stroke="#3a332f" strokeWidth="2"/>
            <circle cx="42" cy="27" r="7" fill="none" stroke="#3a332f" strokeWidth="2"/>
          </symbol>
          <symbol id="sym-rain" viewBox="0 0 26 26">
            <path d="M6,12 a5,5 0 0 1 9.5,-2 a4,4 0 0 1 1,7.9 h-11 a3.8,3.8 0 0 1 0.5,-5.9 z" fill="none" stroke="#6b4a34" strokeWidth="1.3"/>
            <line x1="9" y1="21" x2="7" y2="24" stroke="#6b4a34" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="13" y1="21" x2="12" y2="25" stroke="#6b4a34" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="17" y1="21" x2="16" y2="24" stroke="#6b4a34" strokeWidth="1.3" strokeLinecap="round"/>
          </symbol>
          <symbol id="sym-heart" viewBox="0 0 24 22">
            <path d="M12,20 C2,13 1,6 6,3 C9,1 12,3 12,6 C12,3 15,1 18,3 C23,6 22,13 12,20 Z" fill="none" stroke="#A33828" strokeWidth="1.4"/>
          </symbol>
          <symbol id="sym-compass" viewBox="0 0 40 40">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="20" cy="20" r="16"/>
              <path d="M20,4 L23,17 L20,20 L17,17 Z" fill="currentColor" stroke="none"/>
              <path d="M20,36 L23,23 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.5"/>
              <path d="M4,20 L17,17 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <path d="M36,20 L23,17 L20,20 L23,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none"/>
            </g>
          </symbol>
          <symbol id="sym-flourish" viewBox="0 0 30 30">
            <path d="M2,2 Q2,18 18,18 M2,2 Q18,2 18,18" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
          </symbol>
          <symbol id="sym-staff" viewBox="0 0 200 60">
            <g stroke="#000" strokeWidth="1" fill="none">
              <line x1="0" y1="10" x2="200" y2="10"/><line x1="0" y1="20" x2="200" y2="20"/>
              <line x1="0" y1="30" x2="200" y2="30"/><line x1="0" y1="40" x2="200" y2="40"/><line x1="0" y1="50" x2="200" y2="50"/>
            </g>
            <g fill="#000">
              <ellipse cx="30" cy="34" rx="6" ry="4" transform="rotate(-20 30 34)"/><line x1="36" y1="34" x2="36" y2="6"/>
              <ellipse cx="90" cy="24" rx="6" ry="4" transform="rotate(-20 90 24)"/><line x1="96" y1="24" x2="96" y2="0"/>
              <ellipse cx="150" cy="44" rx="6" ry="4" transform="rotate(-20 150 44)"/><line x1="156" y1="44" x2="156" y2="14"/>
            </g>
          </symbol>
          <symbol id="sym-contour" viewBox="0 0 220 140">
            <g fill="none" stroke="#000" strokeWidth="1">
              <path d="M10,100 Q60,40 120,70 T210,50"/><path d="M20,120 Q70,70 130,95 T215,80"/><path d="M0,60 Q50,20 100,40 T200,20"/>
            </g>
          </symbol>
          <symbol id="sym-manuscript" viewBox="0 0 220 100">
            <g fill="none" stroke="#000" strokeWidth="1">
              <path d="M0,10 Q10,4 20,10 T40,10 T60,10 T80,10 T100,10 T120,10 T140,10 T160,10 T180,10 T200,10 T220,10"/>
              <path d="M0,30 Q10,24 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30"/>
              <path d="M0,50 Q10,44 20,50 T40,50 T60,50 T80,50 T100,50 T120,50 T140,50 T160,50 T180,50"/>
              <path d="M0,70 Q10,64 20,70 T40,70 T60,70 T80,70 T100,70 T120,70 T140,70 T160,70 T180,70 T200,70"/>
            </g>
          </symbol>
        </defs>
      </svg>

      {/* VINTAGE DESK BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none z-1 opacity-70">
        <svg className="absolute left-[4%] top-[12%] w-[230px] text-black opacity-[0.055]"><use href="#sym-staff"/></svg>
        <svg className="absolute right-[4%] bottom-[8%] w-[240px] text-black opacity-[0.055]"><use href="#sym-contour"/></svg>
        <svg className="absolute left-[5%] bottom-[14%] w-[220px] text-black opacity-[0.055]"><use href="#sym-manuscript"/></svg>
        <div className="absolute w-[120px] h-[120px] left-[8%] top-[44%] rounded-full opacity-[0.28] mix-blend-multiply bg-[radial-gradient(circle,transparent_54%,rgba(90,58,42,0.32)_57%,rgba(90,58,42,0.14)_62%,transparent_66%),radial-gradient(circle,transparent_38%,rgba(90,58,42,0.18)_41%,transparent_46%)]" />
        <div className="absolute w-[70px] h-[70px] right-[10%] top-[18%] rounded-full opacity-[0.15] mix-blend-multiply bg-[radial-gradient(circle,transparent_54%,rgba(90,58,42,0.32)_57%,rgba(90,58,42,0.14)_62%,transparent_66%)]" />
      </div>

      {/* TOP HEADER SECTION STAMP */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-20 pointer-events-auto">
        <div>
          <div className="font-mono text-[9.5px] md:text-[10.5px] text-[#C8A55A] tracking-[0.3em] font-bold uppercase opacity-80">
            TANGY SESSIONS // FIELD JOURNAL ARCHIVE
          </div>
          <p className="font-serif italic text-xs text-[#F3E7C9]/90">
            "Some stories deserve more than a caption."
          </p>
        </div>
      </div>

      {/* 3D BOOK STAGE - FIXED & PERFECTLY CENTERED */}
      <div className="relative [perspective:2200px] [perspective-origin:50%_42%]">
        
        {/* DESK SHADOW & WARM MUSEUM LIGHTING */}
        <div className="book-shadow absolute left-1/2 -bottom-5 w-[60%] h-[44px] -translate-x-1/2 bg-black blur-[50px] opacity-[0.15] z-1" />
        <div className="absolute -inset-[30px] pointer-events-none z-[85] bg-[radial-gradient(ellipse_at_18%_8%,rgba(255,238,205,0.16),transparent_55%),linear-gradient(160deg,rgba(255,255,255,0.05),transparent_40%,rgba(0,0,0,0.15)_100%)] mix-blend-soft-light" />

        {/* DIARY CONTAINER */}
        <div className="relative w-[min(880px,90vw)] h-[min(660px,76vh)] [transform-style:preserve-3d]">
          
          {/* PERMANENT FIXED LEATHER SPINE BAR */}
          <div className="absolute left-[calc(50%-14px)] -top-[3px] -bottom-[3px] w-[28px] z-[80] rounded-sm bg-[linear-gradient(90deg,#3a2115_0%,#5A3927_12%,#6b4530_50%,#5A3927_88%,#3a2115_100%)] shadow-[inset_0_0_16px_rgba(0,0,0,0.55),3px_0_8px_rgba(0,0,0,0.45),-3px_0_8px_rgba(0,0,0,0.45),0_10px_26px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rounded-sm bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_2px,transparent_2px_7px,rgba(0,0,0,0.14)_7px_9px,transparent_9px_14px)]" />
            <div className="absolute top-[14px] bottom-[14px] left-[4px] right-[4px] bg-[repeating-linear-gradient(0deg,rgba(224,196,140,0.75)_0_3px,transparent_3px_8px)_left/2px_100%_no-repeat,repeating-linear-gradient(0deg,rgba(224,196,140,0.75)_0_3px,transparent_3px_8px)_right/2px_100%_no-repeat]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-sans text-[11.5px] tracking-[0.2em] text-[#C8A55A] opacity-[0.88] drop-shadow">
              TANGY DIARY · VOL. I · 2016–2026
            </div>
          </div>

          {/* PAGE STACK DEPTH */}
          <div className="absolute top-[1.5%] -right-[11px] w-[13px] h-[97%] bg-[repeating-linear-gradient(0deg,#f2e6c4_0_1.4px,#e2cf9c_1.4px_2.6px,#cdb789_2.6px_3.2px)] shadow-[2px_0_6px_rgba(0,0,0,0.32),inset_-2px_0_3px_rgba(0,0,0,0.18)] rounded-r-sm z-[15]" />

          {/* STATIC FRONTISPIECE (LEFT TITLE PAGE) */}
          <div className="absolute top-0 left-[2%] w-[46%] h-full z-5">
            <div className="relative w-full h-full p-6 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32),inset_0_0_3px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center text-[#1E1A17]">
              <div className="font-serif italic text-3xl font-normal">Field Diary</div>
              <div className="inline-block font-mono text-[9px] tracking-[0.07em] uppercase text-[#6b4a34] bg-[#e6d5a8] border border-dashed border-[#C8A24A] px-2 py-1 mt-2">
                Vol. I · 2016 — 2026
              </div>

              <svg className="w-[90px] h-[90px] mt-4 opacity-85 text-[#A33828] mix-blend-multiply" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="ft1" d="M14,60 a46,46 0 1,1 92,0"/>
                  <path id="ft2" d="M106,60 a46,46 0 1,1 -92,0"/>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                <text fontSize="10" letterSpacing="2" fill="currentColor"><textPath href="#ft1" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath></text>
                <text fontSize="9" letterSpacing="2.2" fill="currentColor"><textPath href="#ft2" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath></text>
              </svg>

              <div className="bg-[#e6d5a8] shadow-[0_6px_12px_rgba(18,13,9,0.3)] [clip-path:polygon(0%_3%,6%_0%,13%_4%,21%_1%,29%_5%,38%_0%,47%_4%,56%_1%,65%_5%,74%_0%,83%_4%,92%_1%,100%_3%,100%_96%,93%_100%,85%_95%,76%_100%,67%_96%,58%_100%,49%_95%,40%_100%,31%_96%,22%_100%,13%_95%,6%_99%,0%_96%)] p-3 mt-4 max-w-[200px] -rotate-[1.5deg]">
                <div className="font-handwriting text-sm text-[#3a2416] font-semibold">
                  Property of the Archive.<br/>Handle with care.
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 3D SCRAPBOOK LEAVES - HINGED ON LEFT, RIGHT PAGE TURNS */}
          {/* =================================================================== */}

          {/* LEAF 0 : MUSEUM COVER */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-visible translate-z-[6px] bg-gradient-to-br from-[#6b4530] via-[#5A3927] to-[#3A2418] text-[#F5E7C8] p-6 shadow-2xl">
              <div className="absolute top-1.5 left-1.5 w-[22px] h-[22px] [clip-path:polygon(0_0,100%_0,0_100%)] bg-gradient-to-br from-[#c2a06a] to-[#7a5c30]" />
              <div className="absolute top-1.5 right-1.5 w-[22px] h-[22px] [clip-path:polygon(100%_0,100%_100%,0_0)] bg-gradient-to-bl from-[#c2a06a] to-[#7a5c30]" />
              <div className="absolute bottom-1.5 left-1.5 w-[22px] h-[22px] [clip-path:polygon(0_0,0_100%,100%_100%)] bg-gradient-to-tr from-[#c2a06a] to-[#7a5c30]" />
              <div className="absolute bottom-1.5 right-1.5 w-[22px] h-[22px] [clip-path:polygon(100%_100%,0_100%,100%_0)] bg-gradient-to-tl from-[#c2a06a] to-[#7a5c30]" />

              <div className="absolute inset-[14px] border-[1.5px] border-[#C8A55A]/55 pointer-events-none">
                <div className="absolute inset-[5px] border border-[#C8A55A]/28" />
              </div>

              <div className="absolute top-5 left-5 w-[50px] p-1 bg-[#e9dcb8] text-[#3a2416] shadow-md -rotate-4 font-mono text-[6.5px] text-center">
                No. 001
                <span className="block h-1 mt-0.5 bg-[repeating-linear-gradient(90deg,#2b211b_0_1px,transparent_1px_3px)]" />
              </div>

              <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-[#F5E7C8]/70 text-center pt-4">
                Archive No. 001
              </div>

              <div className="text-center mt-10 relative">
                <div className="font-serif text-4xl md:text-5xl font-bold leading-none tracking-wider text-[#C8A55A] drop-shadow-md">
                  TANGY<br/>DIARY
                </div>
                <div className="font-sans text-[10.5px] tracking-[0.4em] text-[#F5E7C8]/85 mt-2 uppercase">Field Notes</div>
                <div className="font-handwriting text-xs text-[#F5E7C8]/65 mt-1">Hyderabad • Since 2016</div>
                <svg className="w-6 h-6 mx-auto mt-2 opacity-60 text-[#C8A55A]"><use href="#sym-compass"/></svg>
              </div>

              <div className="strap-layer absolute -left-[3%] -right-[3%] top-[63%] h-[30px] -translate-y-1/2 -rotate-1 bg-gradient-to-b from-[#6b4024] via-[#4a2c18] to-[#3a2115] shadow-lg border-y border-dashed border-[#C8A55A]/40">
                <div className="absolute right-[16%] top-1/2 -translate-y-1/2 w-6 h-6 border-[3px] border-[#9D7A3C] rounded-sm bg-gradient-to-br from-[#c2a06a] to-[#8a6a3a] shadow-md" />
              </div>

              <div className="strap-layer absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 -rotate-4 w-12 h-12 rounded-full bg-radial from-[#9c2b2f] via-[#7A1F24] to-[#5a1216] shadow-2xl flex items-center justify-center text-[#F5E7C8] font-serif font-bold text-sm">
                TS
              </div>

              <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-[#F5E7C8]/70 text-center mt-6 leading-relaxed">
                Field Journal<br/>Property of Tangy Sessions
              </div>
              <div className="absolute bottom-8 right-5 font-handwriting text-xs opacity-50">— T.S.</div>
              <svg className="absolute bottom-6 left-4 w-6 opacity-20 text-[#e9dcb8]"><use href="#sym-flower"/></svg>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[6px] bg-[repeating-linear-gradient(45deg,rgba(90,58,42,0.05)_0_3px,transparent_3px_9px),linear-gradient(180deg,#F5E7C8,#e9d9ac_65%,#ddc999)] text-[#2B211B] p-6 flex flex-col items-center justify-center text-center">
              <div className="font-serif italic text-xs text-[#6b4a34] mt-2">
                This diary belongs to the<br/>Tangy Sessions Archive.
                <b className="block font-mono text-[9px] tracking-[0.1em] uppercase text-[#7A1F24] mt-1">Ex Libris · Hyderabad</b>
              </div>
            </div>
          </div>

          {/* LEAF 1 : SPREAD 1 (THE BEGINNING & BANSILALPET STEPWELL) */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <svg className="absolute -top-2 right-[34px] w-[18px] text-[#b9b9b9]"><use href="#sym-clip"/></svg>
              <div className="flex justify-between font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6b4a34] mb-2">
                <span>Spread #01</span><span className="text-[#A33828] font-bold">14 Oct, 2024</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-none text-[#1E1A17]">The Beginning &amp;<br/>Bansilalpet Stepwell</div>
              <svg className="w-[120px] h-[8px] my-1" viewBox="0 0 120 8"><path d="M2,5 Q18,1 34,5 T64,5 T94,5 T118,5" stroke="#A33828" strokeWidth="1.6" fill="none"/></svg>
              
              <p className="font-handwriting text-base text-[#3a2416] mt-2 max-w-[190px]">
                The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification.
              </p>

              <figure className="absolute top-[105px] right-4 w-[100px] bg-[#fbf7ee] p-1.5 pb-5 shadow-lg">
                <div className="absolute -top-2.5 left-6 w-[40px] h-[16px] bg-[linear-gradient(180deg,rgba(200,162,74,0.85),rgba(168,132,54,0.85))] -rotate-4 opacity-90" />
                <svg viewBox="0 0 100 118" className="w-full">
                  <rect width="100" height="118" fill="#4a3a2a"/>
                  <circle cx="50" cy="60" r="14" fill="#120c07"/>
                </svg>
                <figcaption className="text-center font-handwriting text-[11px] text-[#4a3016] mt-1">Bansilalpet Stepwell</figcaption>
              </figure>

              <div className="bg-[#e6d5a8] p-3 shadow-md mt-16 max-w-[130px] -rotate-1">
                <div className="font-handwriting text-sm text-[#3a2416]">Acoustic echo off 350-year-old stone.</div>
              </div>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Sound Check Log
              </div>
              <div className="font-mono text-[10.5px] leading-relaxed text-[#3a2416]">
                <b>Mic:</b> Ribbon R44<br/><b>Preamp:</b> Tube U47<br/><b>Echo Delay:</b> 2.4s
              </div>
              <p className="font-handwriting text-sm italic text-[#3a2416] mt-4 max-w-[180px]">
                "The acoustic echo bounced off limestone steps for 2.4 seconds before fading."
              </p>
            </div>
          </div>

          {/* LEAF 2 : SPREAD 2 (MONSOON ACOUSTICS & OLD CITY HAVELI) */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="flex justify-between font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6b4a34] mb-2">
                <span>Spread #02</span><span className="text-[#A33828] font-bold">21 Dec, 2024</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-none text-[#1E1A17]">Monsoon Acoustics &amp;<br/>Old City Haveli</div>
              <p className="font-handwriting text-base text-[#3a2416] mt-2 max-w-[180px]">
                When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches. No phones in the air.
              </p>

              <div className="absolute top-[118px] right-[18px] w-[70px] -rotate-3">
                <svg className="w-[70px] text-[#3a2416] bg-[#efe4c8] p-2 shadow-md"><use href="#sym-mic"/></svg>
              </div>

              <div className="bg-[#e6d5a8] p-3 shadow-md mt-16 max-w-[130px] rotate-2">
                <div className="font-handwriting text-xs text-[#3a2416]">300 people stayed till sunrise.</div>
              </div>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Haveli Acoustic Notes
              </div>
              <p className="font-handwriting text-base italic text-[#3a2416] max-w-[170px]">
                "Taramati pavilion was built so voice travels 2 miles without amplifiers."
              </p>
            </div>
          </div>

          {/* LEAF 3 : SPREAD 3 (BEHIND THE MICROPHONES & GOLCONDA FORT) */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="flex justify-between font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6b4a34] mb-2">
                <span>Spread #03</span><span className="text-[#A33828] font-bold">05 Jan, 2025</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-none text-[#1E1A17]">Behind The Microphones &amp;<br/>Golconda Fort</div>
              <p className="font-handwriting text-base text-[#3a2416] mt-2 max-w-[180px]">
                The artists gathered around the ribbon microphones for an unscripted acoustic jam. Someone pulled out a tanpura, another started a vocal chant.
              </p>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Behind The Stage
              </div>
              <p className="font-handwriting text-base italic text-[#3a2416] max-w-[170px]">
                "The rain almost ruined the set. Then it became the set."
              </p>
            </div>
          </div>

          {/* LEAF 4 : SPREAD 4 (ARTISTS & LETTERS) */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[repeating-linear-gradient(180deg,transparent_0_27px,rgba(90,58,42,0.16)_27px_28px),radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Artists &amp; Letters
              </div>
              <p className="font-handwriting text-xl italic text-[#3a2416] mt-2 max-w-[200px]">
                "Music is the strongest form of magic."
              </p>
              <div className="font-mono text-[9px] text-[#6b4a34] mt-1">— Tangy Sessions, field notes</div>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Ticket Collection
              </div>
              <div className="relative h-[120px] mt-4">
                <div className="absolute top-0 left-1.5 w-[100px] bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 font-mono text-[9px] -rotate-6 shadow-md">
                  STEPWELL SESSIONS
                </div>
                <div className="absolute top-4 left-[70px] w-[100px] bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 font-mono text-[9px] rotate-4 shadow-md">
                  OLD CITY HAVELI
                </div>
              </div>
            </div>
          </div>

          {/* LEAF 5 : FINAL SPREAD (FUTURE & READ MORE CTA) */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Future &amp; Unwritten Pages
              </div>
              <p className="font-handwriting text-base text-[#3a2416] mt-4 max-w-[190px]">
                Every Tangy Session leaves another page waiting to be written. The story continues with you.
              </p>
            </div>

            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)] flex flex-col items-center justify-center text-center">
              <svg className="w-[70px] h-[70px] opacity-85 text-[#A33828] mix-blend-multiply" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              <div className="font-handwriting text-lg text-[#3a2416] mt-3 font-bold">To be continued…</div>
            </div>
          </div>

        </div>
      </div>

      {/* READ MORE CTA BUTTON (FADES IN ON FINAL SPREAD) */}
      <div className="read-more-cta absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-center flex flex-col items-center">
        <p className="font-serif italic text-xs text-[#F3E7C9]/80 mb-2">
          Every Tangy Session leaves another page waiting to be written.
        </p>
        <a 
          href="/blogs"
          className="bg-[#C8A55A] text-[#11100C] hover:bg-[#F3E7C9] border-2 border-[#11100C] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#11100C]"
        >
          Read the Complete Tangy Diary →
        </a>
      </div>

      {/* READ HINT (ONLY VISIBLE ON INITIAL COVER CLOSED) */}
      <div className="read-hint-1 absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <div className="font-serif italic text-sm tracking-wider text-[#C8A55A]">Scroll to Open Journal</div>
        <div className="text-xs text-[#C8A55A] opacity-75 my-0.5 animate-bounce">↓</div>
      </div>

    </section>
  );
};
