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
    const totalLeaves = leaves.length; // 7 physical leaves (Leaf 0 = Cover, Leaf 1 = Spread 1 Right/Spread 2 Left, etc.)

    // Master ScrollTrigger timeline pinned to the diary section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=1000%', // 1000vh scroll height ensures generous reading time for every spread
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        onUpdate: (self) => {
          const currentLeafIndex = Math.floor(self.progress * totalLeaves);
          if (self.previousLeafIndex !== undefined && self.previousLeafIndex !== currentLeafIndex) {
            playSFX('pageTurn');
          }
          self.previousLeafIndex = currentLeafIndex;

          // Micro-swinging motion of hanging microphone wire as pages turn
          gsap.to('.diary-mic-wire', {
            rotate: Math.sin(self.progress * Math.PI * 12) * 2.5,
            duration: 0.5,
            ease: 'power1.out'
          });
        }
      }
    });

    // INITIAL 3D STATES & STRICT LAYER HIERARCHY
    // Each leaf is hinged along the spine edge (0% 50%)
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
    gsap.set('.read-hint-cover', { opacity: 1 });

    // =========================================================================
    // SCROLL TIMELINE SEQUENCE & HARDCOVER SPINE ROTATION (170° RESTING ANGLE)
    // =========================================================================

    // 0% - 8%: LANDING (COVER CLOSED) -> COVER OPENS
    tl.to('.strap-layer', {
      opacity: 0,
      x: 35,
      scale: 0.95,
      duration: 0.03,
      ease: 'power2.in'
    }, 0.01)
    .to('.read-hint-cover', { opacity: 0, duration: 0.02 }, 0.01)

    // Cover (Leaf 0) turns open ~170° to rest naturally on the left back cover board.
    // As soon as cover opens (progress > 0.4), set zIndex: 0 so it rests BEHIND the left page stack!
    .to(leaves[0], {
      rotateY: -170,
      duration: 0.06,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.4) {
          gsap.set(leaves[0], { zIndex: 0 }); // Rest cover behind left page stack
        } else {
          gsap.set(leaves[0], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.03)

    // -------------------------------------------------------------------------
    // SPREAD 1 (8% - 22%):
    // Left  = Title / Field Diary Stamp (Leaf 0 Back, rests on open cover)
    // Right = The Beginning / Bansilalpet Stepwell (Leaf 1 Front)
    // -------------------------------------------------------------------------
    .to({}, { duration: 0.10 }) // Reading Buffer
    .to(leaves[1], { // Leaf 1 turns -180° to Left
      rotateY: -180,
      duration: 0.05,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[1], { zIndex: 2 }); // Turned page becomes top active left page (zIndex 2 > Leaf 0 zIndex 0)
        } else {
          gsap.set(leaves[1], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.18)

    // -------------------------------------------------------------------------
    // SPREAD 2 (23% - 37%):
    // Left  = The Beginning / Bansilalpet Stepwell (Leaf 1 Back)
    // Right = Monsoon Acoustics / Old City Haveli (Leaf 2 Front)
    // -------------------------------------------------------------------------
    .to({}, { duration: 0.10 }) // Reading Buffer
    .to(leaves[2], { // Leaf 2 turns -180° to Left
      rotateY: -180,
      duration: 0.05,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[2], { zIndex: 3 }); // Turned page becomes top active left page (zIndex 3 > zIndex 2)
        } else {
          gsap.set(leaves[2], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.33)

    // -------------------------------------------------------------------------
    // SPREAD 3 (38% - 52%):
    // Left  = Monsoon Acoustics (Leaf 2 Back)
    // Right = Artists & Performers (Leaf 3 Front)
    // -------------------------------------------------------------------------
    .to({}, { duration: 0.10 }) // Reading Buffer
    .to(leaves[3], { // Leaf 3 turns -180° to Left
      rotateY: -180,
      duration: 0.05,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[3], { zIndex: 4 });
        } else {
          gsap.set(leaves[3], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.48)

    // -------------------------------------------------------------------------
    // SPREAD 4 (53% - 67%):
    // Left  = Artists & Performers (Leaf 3 Back)
    // Right = Backstage Notes & Hidden Spaces (Leaf 4 Front)
    // -------------------------------------------------------------------------
    .to({}, { duration: 0.10 }) // Reading Buffer
    .to(leaves[4], { // Leaf 4 turns -180° to Left
      rotateY: -180,
      duration: 0.05,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[4], { zIndex: 5 });
        } else {
          gsap.set(leaves[4], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.63)

    // -------------------------------------------------------------------------
    // SPREAD 5 (68% - 82%):
    // Left  = Backstage Notes & Hidden Spaces (Leaf 4 Back)
    // Right = Community & Volunteers (Leaf 5 Front)
    // -------------------------------------------------------------------------
    .to({}, { duration: 0.10 }) // Reading Buffer
    .to(leaves[5], { // Leaf 5 turns -180° to Left
      rotateY: -180,
      duration: 0.05,
      ease: 'power2.inOut',
      onUpdate: function () {
        if (this.progress() > 0.5) {
          gsap.set(leaves[5], { zIndex: 6 });
        } else {
          gsap.set(leaves[5], { zIndex: totalLeaves + 10 });
        }
      }
    }, 0.78)

    // -------------------------------------------------------------------------
    // FINAL SPREAD (83% - 100%):
    // Left  = Community & Volunteers (Leaf 5 Back)
    // Right = Future of Tangy & Continue Reading → (Leaf 6 Front)
    // -------------------------------------------------------------------------
    .to('.read-more-cta', {
      opacity: 1,
      y: 0,
      pointerEvents: 'auto',
      duration: 0.07,
      ease: 'power2.out'
    }, 0.85)
    .to({}, { duration: 0.08 }); // Final reading buffer before seamless unpinning

  }, []);

  return (
    <section 
      ref={sectionRef}
      id="diary" 
      className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#241A14] via-[#1F1713] to-[#140E0B] text-[#EADFC5] overflow-hidden select-none font-serif border-t-4 border-[#2E221B]"
    >
      {/* WARM MUSEUM SPOTLIGHT & VIGNETTE OVERLAYS */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[900] opacity-[0.035] mix-blend-overlay">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,223,197,0.06)_0%,transparent_75%)] pointer-events-none z-10" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(20,14,11,0.92)] pointer-events-none z-10" />

      {/* ARCHIVAL SVG DEFINITIONS */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <symbol id="sym-clip" viewBox="0 0 40 90">
            <path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#A68853" strokeWidth="3.5" strokeLinecap="round"/>
          </symbol>
          <symbol id="sym-mic" viewBox="0 0 60 110">
            <g fill="none" stroke="#2E221B" strokeWidth="2.2" strokeLinecap="round">
              <rect x="20" y="6" width="20" height="40" rx="10"/>
              <path d="M12,40 a18,18 0 0 0 36,0"/>
              <line x1="30" y1="58" x2="30" y2="82"/>
              <line x1="14" y1="82" x2="46" y2="82"/>
              <line x1="24" y1="14" x2="36" y2="14"/><line x1="24" y1="22" x2="36" y2="22"/><line x1="24" y1="30" x2="36" y2="30"/>
            </g>
          </symbol>
          <symbol id="sym-rain" viewBox="0 0 26 26">
            <path d="M6,12 a5,5 0 0 1 9.5,-2 a4,4 0 0 1 1,7.9 h-11 a3.8,3.8 0 0 1 0.5,-5.9 z" fill="none" stroke="#5A4032" strokeWidth="1.3"/>
            <line x1="9" y1="21" x2="7" y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="13" y1="21" x2="12" y2="25" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="17" y1="21" x2="16" y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
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
          <symbol id="sym-flower" viewBox="0 0 80 100">
            <g fill="none" stroke="#5A4032" strokeWidth="1.2">
              <line x1="40" y1="95" x2="40" y2="45"/>
              <path d="M40,45 Q30,60 25,80" /><path d="M40,55 Q50,68 55,84" />
              <g fill="#A44A34" opacity="0.45" stroke="#5A4032">
                <ellipse cx="40" cy="20" rx="9" ry="16"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/>
                <ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/>
              </g>
              <circle cx="40" cy="20" r="5" fill="#A68853" stroke="none"/>
            </g>
          </symbol>
          <symbol id="sym-map-pin" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#A44A34"/>
          </symbol>
        </defs>
      </svg>

      {/* HANGING MICROPHONE WIRE (LEFT OUTSIDE READABLE AREA) */}
      <div className="diary-mic-wire absolute top-0 left-[3%] md:left-[5%] z-[100] pointer-events-none origin-top flex flex-col items-center">
        <div className="w-[1.5px] h-[340px] md:h-[420px] bg-[#1F1713] border-r border-[#5A4032]/40" />
        <div className="w-4 h-7 bg-[#2E221B] rounded-sm border border-[#A68853]/60 shadow-md flex items-center justify-center -mt-0.5">
          <div className="w-2.5 h-4 bg-[#A68853]/30 rounded-xs" />
        </div>
      </div>

      {/* TOP HEADER ARCHIVE METADATA */}
      <div className="absolute top-5 left-10 right-10 flex justify-between items-center z-20 pointer-events-none">
        <div>
          <div className="font-mono text-[9px] md:text-[10px] text-[#A68853] tracking-[0.25em] font-bold uppercase opacity-85">
            ARCHIVAL FIELD JOURNAL // FILE NO. 1974-TS
          </div>
          <p className="font-serif italic text-xs text-[#EADFC5]/75 mt-0.5">
            "Every room has a memory."
          </p>
        </div>
      </div>

      {/* 3D BOOK STAGE - SINGLE CONNECTED HARDCOVER JOURNAL */}
      <div className="relative [perspective:2200px] [perspective-origin:50%_42%]">
        
        {/* DESK SHADOW (LAYER 1) */}
        <div className="book-shadow absolute left-1/2 -bottom-5 w-[65%] h-[48px] -translate-x-1/2 bg-black blur-[45px] opacity-[0.18] z-1" />

        {/* DIARY CONTAINER */}
        <div className="relative w-[min(880px,90vw)] h-[min(650px,76vh)] [transform-style:preserve-3d]">
          
          {/* PERMANENT FIXED LEATHER SPINE BAR (LAYER 80 - ROTATION PIVOT HINGE) */}
          <div className="absolute left-[calc(50%-14px)] -top-[4px] -bottom-[4px] w-[28px] z-[80] rounded-sm bg-[linear-gradient(90deg,#2E221B_0%,#4B3529_12%,#6B4B39_50%,#4B3529_88%,#2E221B_100%)] shadow-[inset_0_0_16px_rgba(0,0,0,0.6),3px_0_8px_rgba(0,0,0,0.5),-3px_0_8px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rounded-sm bg-[repeating-linear-gradient(90deg,rgba(234,223,197,0.04)_0_2px,transparent_2px_7px,rgba(0,0,0,0.15)_7px_9px,transparent_9px_14px)]" />
            <div className="absolute top-[14px] bottom-[14px] left-[4px] right-[4px] bg-[repeating-linear-gradient(0deg,rgba(166,136,83,0.65)_0_3px,transparent_3px_8px)_left/2px_100%_no-repeat,repeating-linear-gradient(0deg,rgba(166,136,83,0.65)_0_3px,transparent_3px_8px)_right/2px_100%_no-repeat]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-mono text-[10.5px] tracking-[0.2em] text-[#A68853] opacity-[0.9] drop-shadow">
              TANGY DIARY · VOL. I · 2016–2026
            </div>
          </div>

          {/* LEFT PAGE STACK DEPTH (LAYER 3 - THIN 14px PAPER EDGE ATTACHED DIRECTLY BESIDE SPINE ON LEFT) */}
          <div className="absolute top-[1.5%] left-[calc(50%-14px-13px)] w-[14px] h-[97%] bg-[repeating-linear-gradient(0deg,#EADFC5_0_1.4px,#E6D8B7_1.4px_2.6px,#DCCDA7_2.6px_3.2px)] shadow-[-2px_0_6px_rgba(0,0,0,0.3),inset_2px_0_3px_rgba(0,0,0,0.2)] rounded-l-xs z-[2]" />

          {/* RIGHT PAGE STACK DEPTH (LAYER 15 - THIN 14px PAPER EDGE ON RIGHT) */}
          <div className="absolute top-[1.5%] -right-[12px] w-[14px] h-[97%] bg-[repeating-linear-gradient(0deg,#EADFC5_0_1.4px,#E6D8B7_1.4px_2.6px,#DCCDA7_2.6px_3.2px)] shadow-[2px_0_6px_rgba(0,0,0,0.3),inset_-2px_0_3px_rgba(0,0,0,0.2)] rounded-r-xs z-[15]" />

          {/* FABRIC BOOKMARK RIBBON */}
          <div className="absolute left-[44%] -bottom-[28px] w-[11px] h-[40px] bg-gradient-to-b from-[#A44A34] to-[#5A1D13] [clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)] opacity-95 z-3 shadow-md" />

          {/* HARDCOVER BACK BOARD UNDERNEATH LEFT STACK (LAYER 0) */}
          <div className="absolute top-0 left-0 w-[50%] h-full z-0 bg-[#4B3529] rounded-l-xs shadow-md border-r border-[#2E221B]" />

          {/* =================================================================== */}
          {/* 3D DOUBLE-SIDED SCRAPBOOK LEAVES (HINGED AT SPINE, ROTATES AROUND SPINE PIVOT) */}
          {/* =================================================================== */}

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 0: FRONT COVER (Front) / SPREAD 1 LEFT (Back - Inside Cover & Title) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 0: HANDCRAFTED LEATHER COVER */}
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-r-xs overflow-visible translate-z-[5px] bg-gradient-to-br from-[#6B4B39] via-[#5A4032] to-[#4B3529] text-[#EADFC5] p-6 shadow-2xl">
              <div className="absolute top-1.5 left-1.5 w-[20px] h-[20px] [clip-path:polygon(0_0,100%_0,0_100%)] bg-gradient-to-br from-[#A68853] to-[#7A5C30]" />
              <div className="absolute top-1.5 right-1.5 w-[20px] h-[20px] [clip-path:polygon(100%_0,100%_100%,0_0)] bg-gradient-to-bl from-[#A68853] to-[#7A5C30]" />
              <div className="absolute bottom-1.5 left-1.5 w-[20px] h-[20px] [clip-path:polygon(0_0,0_100%,100%_100%)] bg-gradient-to-tr from-[#A68853] to-[#7A5C30]" />
              <div className="absolute bottom-1.5 right-1.5 w-[20px] h-[20px] [clip-path:polygon(100%_100%,0_100%,100%_0)] bg-gradient-to-tl from-[#A68853] to-[#7A5C30]" />

              <div className="absolute inset-[14px] border-[1.5px] border-[#A68853]/45 pointer-events-none">
                <div className="absolute inset-[4px] border border-[#A68853]/25" />
              </div>

              <div className="absolute top-5 left-5 w-[48px] p-1 bg-[#E6D8B7] text-[#2E221B] shadow-sm -rotate-3 font-mono text-[6.5px] text-center">
                No. 001
                <span className="block h-1 mt-0.5 bg-[repeating-linear-gradient(90deg,#2E221B_0_1px,transparent_1px_3px)]" />
              </div>

              <div className="font-mono text-[8px] tracking-[0.14em] uppercase text-[#EADFC5]/65 text-center pt-4">
                Archive No. 001
              </div>

              <div className="text-center mt-10 relative">
                <div className="font-serif text-4xl md:text-5xl font-bold leading-none tracking-wider text-[#A68853] drop-shadow-sm">
                  TANGY<br/>DIARY
                </div>
                <div className="font-mono text-[9.5px] tracking-[0.35em] text-[#EADFC5]/80 mt-2 uppercase">Field Notes</div>
                <div className="font-handwriting text-xs text-[#EADFC5]/65 mt-1">Hyderabad • Since 2016</div>
                <svg className="w-5 h-5 mx-auto mt-2 opacity-50 text-[#A68853]"><use href="#sym-compass"/></svg>
              </div>

              <div className="strap-layer absolute -left-[3%] -right-[3%] top-[63%] h-[28px] -translate-y-1/2 -rotate-1 bg-gradient-to-b from-[#5A4032] via-[#4B3529] to-[#2E221B] shadow-md border-y border-dashed border-[#A68853]/40">
                <div className="absolute right-[16%] top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#A68853] rounded-xs bg-gradient-to-br from-[#A68853] to-[#7A5C30] shadow-xs" />
              </div>

              <div className="strap-layer absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 -rotate-4 w-11 h-11 rounded-full bg-radial from-[#A44A34] via-[#7A1F24] to-[#5A1D13] shadow-lg flex items-center justify-center text-[#EADFC5] font-serif font-bold text-xs">
                TS
              </div>

              <div className="font-mono text-[8px] tracking-[0.12em] uppercase text-[#EADFC5]/65 text-center mt-8 leading-relaxed">
                Field Journal<br/>Property of Tangy Sessions
              </div>
              <div className="absolute bottom-6 right-5 font-handwriting text-xs opacity-50">— T.S.</div>
              <svg className="absolute bottom-5 left-4 w-5 opacity-20 text-[#E6D8B7]"><use href="#sym-flower"/></svg>
            </div>

            {/* BACK OF LEAF 0: SPREAD 1 LEFT (Inside Cover, Title & Archive Stamp) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[5px] p-6 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] text-[#2E221B] flex flex-col items-center justify-center text-center rounded-l-xs shadow-[inset_0_0_46px_rgba(90,58,42,0.25)]">
              <div className="font-serif italic text-3xl font-normal text-[#2E221B]">Field Journal</div>
              <div className="inline-block font-mono text-[9px] tracking-[0.08em] uppercase text-[#5A4032] bg-[#E6D8B7] border border-dashed border-[#A68853] px-2.5 py-1 mt-2">
                Vol. I · 2016 — 2026
              </div>

              <svg className="w-[85px] h-[85px] mt-4 opacity-80 text-[#A44A34] mix-blend-multiply" viewBox="0 0 120 120">
                <defs>
                  <path id="ft1" d="M14,60 a46,46 0 1,1 92,0"/>
                  <path id="ft2" d="M106,60 a46,46 0 1,1 -92,0"/>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.3"/>
                <text fontSize="9.5" letterSpacing="2" fill="currentColor"><textPath href="#ft1" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath></text>
                <text fontSize="8.5" letterSpacing="2" fill="currentColor"><textPath href="#ft2" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath></text>
              </svg>

              <div className="bg-[#E6D8B7] shadow-[0_4px_10px_rgba(30,22,17,0.22)] [clip-path:polygon(0%_3%,6%_0%,13%_4%,21%_1%,29%_5%,38%_0%,47%_4%,56%_1%,65%_5%,74%_0%,83%_4%,92%_1%,100%_3%,100%_96%,93%_100%,85%_95%,76%_100%,67%_96%,58%_100%,49%_95%,40%_100%,31%_96%,22%_100%,13%_95%,6%_99%,0%_96%)] p-3 mt-5 max-w-[200px] -rotate-[1.5deg]">
                <div className="font-handwriting text-sm text-[#2E221B] font-medium">
                  Property of the Archive.<br/>Handle with care.
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 1: SPREAD 1 RIGHT (Front: Stepwell) / SPREAD 2 LEFT (Back: Stepwell Left) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 1: SPREAD 1 RIGHT (The Beginning / Bansilalpet Stepwell) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs">
              <svg className="absolute -top-2 right-[30px] w-[16px]"><use href="#sym-clip"/></svg>
              <div className="flex justify-between font-mono text-[9px] tracking-[0.1em] uppercase text-[#5A4032] mb-1.5">
                <span>Spread #01</span><span className="text-[#A44A34] font-bold">14 Oct, 2024</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-tight text-[#2E221B]">The Beginning &amp;<br/>Bansilalpet Stepwell</div>
              <div className="font-mono text-[8.5px] text-[#A44A34] uppercase tracking-wider mt-1">LOCATION: BANSILALPET STEPWELL</div>
              
              <p className="font-handwriting text-base text-[#2E221B] mt-2 max-w-[195px] leading-snug">
                The stepwell echoes before the crowd arrives. Water dripping against 350-year-old stone, acoustic instruments humming without amplification.
              </p>

              <figure className="absolute top-[105px] right-4 w-[100px] bg-[#FBF7EE] p-1.5 pb-4 shadow-md rotate-2">
                <div className="absolute -top-2 left-5 w-[36px] h-[14px] bg-[#A68853]/60 -rotate-3" />
                <svg viewBox="0 0 100 110" className="w-full">
                  <rect width="100" height="110" fill="#4B3529"/>
                  <circle cx="50" cy="55" r="14" fill="#1F1713"/>
                </svg>
                <figcaption className="text-center font-handwriting text-[10.5px] text-[#2E221B] mt-1">Stepwell Echoes</figcaption>
              </figure>

              <div className="bg-[#E6D8B7] p-2.5 shadow-sm mt-16 max-w-[130px] -rotate-1 border border-[#A68853]/30">
                <div className="font-handwriting text-xs text-[#2E221B]">Acoustic echo off 350-year-old stone.</div>
              </div>
            </div>

            {/* BACK OF LEAF 1: SPREAD 2 LEFT (The Beginning / Bansilalpet Stepwell) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-l-xs">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                Spread #02 — Left (The Beginning)
              </div>
              <div className="font-serif italic text-lg text-[#2E221B]">Bansilalpet Stepwell Log</div>
              <div className="font-mono text-[9.5px] leading-relaxed text-[#5A4032] mt-2">
                <b>Mic:</b> Ribbon R44<br/><b>Preamp:</b> Tube U47<br/><b>Echo Delay:</b> 2.4s
              </div>
              <p className="font-handwriting text-sm italic text-[#2E221B] mt-4 max-w-[180px]">
                "The acoustic echo bounced off limestone steps for 2.4 seconds before fading."
              </p>
              <div className="absolute bottom-5 left-4 font-mono text-[8.5px] text-[#A44A34] border border-[#A44A34] px-2 py-0.5 -rotate-2">
                STEPWELL ARCHIVE STAMPED
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 2: SPREAD 2 RIGHT (Front: Monsoon) / SPREAD 3 LEFT (Back: Monsoon Left) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 2: SPREAD 2 RIGHT (Monsoon Acoustics / Old City Haveli) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs">
              <div className="flex justify-between font-mono text-[9px] tracking-[0.1em] uppercase text-[#5A4032] mb-1.5">
                <span>Spread #02</span><span className="text-[#A44A34] font-bold">21 Dec, 2024</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-tight text-[#2E221B]">Monsoon Acoustics &amp;<br/>Old City Haveli</div>
              <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-[#5A4032] uppercase mt-1">
                <svg className="w-4 h-4"><use href="#sym-rain"/></svg>
                <span>300 AUDIENCE // MIDNIGHT</span>
              </div>

              <p className="font-handwriting text-base text-[#2E221B] mt-2 max-w-[180px] leading-snug">
                When the lights dropped at midnight, 300 people stood completely still under rain-soaked arches. No phones in the air.
              </p>

              <div className="bg-[#E6D8B7] p-2.5 shadow-sm mt-14 max-w-[135px] rotate-2 border border-[#A68853]/30">
                <div className="font-handwriting text-xs text-[#2E221B]">300 people stayed till sunrise.</div>
              </div>
            </div>

            {/* BACK OF LEAF 2: SPREAD 3 LEFT (Monsoon Acoustics Left) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-l-xs">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                Spread #03 — Left (Monsoon Acoustics)
              </div>
              <p className="font-handwriting text-base italic text-[#2E221B] max-w-[175px] mt-2">
                "Taramati pavilion was built so voice travels 2 miles without amplifiers."
              </p>
              <div className="mt-8 font-mono text-[8.5px] text-[#5A4032] border-t border-[#A68853]/40 pt-2">
                // DISPATCH LOG: MONSOON 1974
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 3: SPREAD 3 RIGHT (Front: Artists) / SPREAD 4 LEFT (Back: Artists Left) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 3: SPREAD 3 RIGHT (Artists & Performers) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs">
              <div className="flex justify-between font-mono text-[9px] tracking-[0.1em] uppercase text-[#5A4032] mb-1.5">
                <span>Spread #03</span><span className="text-[#A44A34] font-bold">05 Jan, 2025</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-tight text-[#2E221B]">Artists &amp;<br/>Performers</div>
              <p className="font-handwriting text-base text-[#2E221B] mt-2 max-w-[185px] leading-snug">
                The artists gathered around the ribbon microphones for an unscripted acoustic jam. Someone pulled out a tanpura, another started a vocal chant.
              </p>

              <div className="absolute top-[110px] right-[18px] w-[65px] -rotate-3">
                <svg className="w-[65px] text-[#2E221B] bg-[#E6D8B7] p-2 shadow-xs border border-[#A68853]/40"><use href="#sym-mic"/></svg>
              </div>

              <div className="bg-[#A44A34] text-[#EADFC5] p-2 font-mono text-[8.5px] rounded-xs max-w-[130px] mt-12 shadow-sm rotate-1">
                PERFORMER PASS // BACKSTAGE
              </div>
            </div>

            {/* BACK OF LEAF 3: SPREAD 4 LEFT (Artists & Performers Left) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-l-xs">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                Spread #04 — Left (Artists)
              </div>
              <div className="font-serif italic text-lg text-[#2E221B]">Artist Jam Log</div>
              <p className="font-handwriting text-sm italic text-[#2E221B] mt-3">
                "Unscripted, unplugged, and raw. The night decided what to play."
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 4: SPREAD 4 RIGHT (Front: Backstage Notes) / SPREAD 5 LEFT (Back: Backstage Left) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 4: SPREAD 4 RIGHT (Backstage Notes & Hidden Spaces) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs">
              <div className="flex justify-between font-mono text-[9px] tracking-[0.1em] uppercase text-[#5A4032] mb-1.5">
                <span>Spread #04</span><span className="text-[#A44A34] font-bold">Backstage</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-tight text-[#2E221B]">Backstage Notes &amp;<br/>Hidden Spaces</div>
              <p className="font-handwriting text-base text-[#2E221B] mt-2 max-w-[190px] leading-snug">
                A 300-year-old sanctuary tucked away behind stone arches. We mapped the acoustics by hand.
              </p>

              <div className="w-full h-22 border border-dashed border-[#5A4032]/40 rounded-xs p-2 mt-3 font-mono text-[8px] text-[#5A4032]">
                <div>[ NORTH WALL: REVERB 1.8s ]</div>
                <div>[ SOUTHERN ARCH: NATURAL BASS TRAP ]</div>
              </div>
            </div>

            {/* BACK OF LEAF 4: SPREAD 5 LEFT (Backstage Notes Left) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-l-xs">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                Spread #05 — Left (Backstage)
              </div>
              <p className="font-handwriting text-sm italic text-[#2E221B] mt-3">
                "No speaker stacks. The stone speaks."
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 5: SPREAD 5 RIGHT (Front: Community) / FINAL SPREAD LEFT (Back: Community Left) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 5: SPREAD 5 RIGHT (Community & Volunteers) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs">
              <div className="flex justify-between font-mono text-[9px] tracking-[0.1em] uppercase text-[#5A4032] mb-1.5">
                <span>Spread #05</span><span className="text-[#A44A34] font-bold">Community</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-tight text-[#2E221B]">Community &amp;<br/>Crew Letters</div>
              <p className="font-handwriting text-base text-[#2E221B] mt-3 max-w-[190px]">
                Great experiences are built by passionate people behind the scenes. Sound crews, chai makers, and listeners.
              </p>

              <div className="bg-[#E6D8B7] p-2.5 border border-[#A68853]/40 shadow-xs mt-6 max-w-[140px] -rotate-1">
                <div className="font-mono text-[8px] text-[#A44A34] font-bold">VOLUNTEER DOSSIER</div>
                <div className="font-handwriting text-xs text-[#2E221B] mt-1">Built with love by 40+ crew members.</div>
              </div>
            </div>

            {/* BACK OF LEAF 5: FINAL SPREAD LEFT (Community & Volunteers Left) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-l-xs">
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                Final Spread — Left (Community)
              </div>
              <div className="relative h-[100px] mt-3">
                <div className="absolute top-0 left-1 w-[95px] bg-gradient-to-r from-[#5A4032] to-[#4B3529] text-[#EADFC5] p-2 font-mono text-[8.5px] -rotate-6 shadow-xs">
                  STEPWELL 2024
                </div>
                <div className="absolute top-4 left-[65px] w-[95px] bg-gradient-to-r from-[#5A4032] to-[#4B3529] text-[#EADFC5] p-2 font-mono text-[8.5px] rotate-4 shadow-xs">
                  HAVELI 2024
                </div>
              </div>
              <div className="font-handwriting text-base text-[#2E221B] mt-2">"Every ticket tells a story."</div>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* LEAF 6: FINAL SPREAD RIGHT (Future of Tangy & Continue Reading →) */}
          {/* ------------------------------------------------------------------- */}
          <div className="diary-leaf absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d]">
            {/* FRONT OF LEAF 6: FINAL SPREAD RIGHT (Future of Tangy & Read More) */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] shadow-[inset_0_0_46px_rgba(90,58,42,0.25)] rounded-r-xs flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[#2E221B] border-b border-[#5A4032] inline-block pb-0.5 mb-2">
                  Future of Tangy
                </div>
                <div className="font-serif italic text-2xl text-[#2E221B] mt-2">More stories are waiting.</div>
                <p className="font-handwriting text-base text-[#5A4032] mt-3 max-w-[190px]">
                  Every Tangy Session leaves another page waiting to be written. The story continues with you.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center text-center my-auto">
                <svg className="w-[60px] h-[60px] opacity-80 text-[#A44A34] mix-blend-multiply" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                <div className="font-handwriting text-lg text-[#2E221B] mt-2 font-bold">To be continued…</div>
              </div>
            </div>

            {/* BACK OF LEAF 6: BACK COVER INNER */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[linear-gradient(180deg,#EADFC5,#E6D8B7_65%,#DCCDA7)] text-[#2E221B] flex flex-col items-center justify-center text-center rounded-l-xs">
              <div className="font-serif italic text-xs text-[#5A4032]">
                Tangy Sessions Field Journal<br/>End of Volume I
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* READ MORE CTA BUTTON (FADES IN NATURALLY ON FINAL SPREAD) */}
      <div className="read-more-cta absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-center flex flex-col items-center">
        <p className="font-serif italic text-xs text-[#EADFC5]/75 mb-2">
          Every Tangy Session leaves another page waiting to be written.
        </p>
        <a 
          href="/blogs"
          className="bg-[#A68853] text-[#1F1713] hover:bg-[#EADFC5] border-2 border-[#1F1713] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#1F1F13]"
        >
          Read the Complete Tangy Diary →
        </a>
      </div>

      {/* INITIAL SCROLL HINT (COVER CLOSED) */}
      <div className="read-hint-cover absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
        <div className="font-serif italic text-sm tracking-wider text-[#A68853]">Scroll to Open Journal</div>
        <div className="text-xs text-[#A68853] opacity-75 my-0.5 animate-bounce">↓</div>
      </div>

    </section>
  );
};
