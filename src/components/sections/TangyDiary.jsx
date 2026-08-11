import React from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import { useAudio } from '../../audio/AudioContext';

gsap.registerPlugin(ScrollTrigger);

// ─── EXACT BUG DIAGNOSIS & FIX ───────────────────────────────────────────────
//
//  BUG: "The backcover is appearing beside the front cover"
//  CAUSE:
//    1. The base 3D stage had a <div style={{ position:'absolute', inset:0, zIndex:0 }}>
//       which drew a dark brown leather board across the ENTIRE 880px width (left 0 to 100%).
//    2. The 2D closed overlay ALSO drew an 880px wide dark brown leather board with a
//       fake spine down the center!
//    Because Leaf 0 (Front Cover) only sits on the RIGHT half (left:50%, width:50%),
//    the left half (left:0, width:50%) of that dark brown board was completely exposed
//    next to the Front Cover when the book was closed!
//
//  CORRECT PHYSICAL MODEL:
//    - When the book is CLOSED (rotateY = 0 for all leaves):
//      * Right half (50%–100%): Leaf 0 (Front Cover) is visible on top of the right stack.
//      * Left half (0%–50%): EMPTY / INVISIBLE (opacity: 0). No back cover board exposed!
//      * The physical back cover board underneath the right stack sits ONLY on the right half (left:50%, width:50%).
//    - When the Front Cover (Leaf 0) OPENS (rotates from 0° to -180°):
//      * Leaf 0 swings around the spine (left edge, 0% 50%) to the left half (0%–50%).
//      * Its back face (Inside Cover) lands on the left side.
//      * The left side container smoothly fades to opacity:1 as the cover opens.
//      * Now the book is a balanced 2-page OPEN spread!
// ─────────────────────────────────────────────────────────────────────────────

const N_LEAVES = 7; // Leaf 0=cover, 1–5=content, 6=static final page

function leafZ(i) { return N_LEAVES + 10 - i; } // Leaf0→17 (highest), Leaf6→11

const PAPER_BG =
  'radial-gradient(ellipse at 32% 4%, rgba(255,255,255,0.28), transparent 56%), ' +
  'linear-gradient(172deg, #F5EEE0 0%, #EADFC5 42%, #E2D5B5 74%, #D8C9A5 100%)';
const SH_R = 'inset -14px 0 32px rgba(90,58,42,0.17), inset 0 0 44px rgba(90,58,42,0.1)';
const SH_L = 'inset  14px 0 32px rgba(90,58,42,0.17), inset 0 0 44px rgba(90,58,42,0.1)';

function leafStyle(i) {
  return {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    transformStyle: 'preserve-3d',
    zIndex: leafZ(i),
  };
}

const frontFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  ...extra,
});
const backFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  transform: 'rotateY(180deg)',
  ...extra,
});

export const TangyDiary = () => {
  const { playSFX } = useAudio();

  const sectionRef = useGSAPContext((ctx) => {
    const leaves = gsap.utils.toArray('.diary-leaf');
    const N = leaves.length; // 7

    // Force-reset all leaves synchronously to initial closed state
    gsap.killTweensOf([...leaves, '.diary-strap', '.read-hint', '.read-more-cta', '.diary-left-base']);
    leaves.forEach((leaf, i) => {
      gsap.set(leaf, {
        rotateY: 0,
        transformOrigin: '0% 50%',
        zIndex: leafZ(i),
        immediateRender: true,
      });
    });

    // Left base board starts invisible (opacity:0) when book is closed
    gsap.set('.diary-left-base',   { opacity: 0, immediateRender: true });
    gsap.set('.diary-strap',       { opacity: 1, x: 0,  immediateRender: true });
    gsap.set('.read-hint',         { opacity: 1,         immediateRender: true });
    gsap.set('.read-more-cta',     { opacity: 0, y: 14, pointerEvents: 'none', immediateRender: true });

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

    // Master scroll-pinned timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: isMobile ? 'top 80%' : 'top top',
        end: isMobile ? '+=50%' : '+=900%',
        pin: !isMobile,
        scrub: 0.8,
        anticipatePin: isMobile ? 0 : 1,
        onUpdate(self) {
          gsap.to('.diary-mic-wire', {
            rotate: Math.sin(self.progress * Math.PI * 10) * 2,
            duration: 0.4,
            ease: 'power1.out',
          });
        },
      },
    });

    function flipLeaf(leaf, idx, at) {
      tl.to(leaf, {
        rotateY: -180,
        duration: 0.055,
        ease: 'power2.inOut',
        onUpdate() {
          const p = this.progress();
          if (p <= 0.02) {
            gsap.set(leaf, { zIndex: leafZ(idx) });
          } else if (p < 0.5) {
            gsap.set(leaf, { zIndex: N + 50 });
          } else {
            gsap.set(leaf, { zIndex: idx + 1 });
          }
        },
        onComplete() {
          if (playSFX) playSFX('pageTurn');
        },
      }, at);
    }

    // ── Timeline sequence ───────────────────────────────────────────────────

    // As cover opens, reveal left-side base board & fade strap / hint
    tl.to('.diary-left-base', { opacity: 1, duration: 0.04, ease: 'power1.out' }, 0.02)
      .to('.diary-strap',     { opacity: 0, x: 14, duration: 0.025 },            0.03)
      .to('.read-hint',       { opacity: 0, duration: 0.02 },                    0.04);

    // t=0.06: Front Cover (Leaf 0) opens → Spread 1: Inside Cover (L) | Stepwell (R)
    flipLeaf(leaves[0], 0, 0.06);
    tl.to({}, { duration: 0.12 }, 0.12);

    // t=0.25: Spread 2 → Stepwell Log (L) | Monsoon (R)
    flipLeaf(leaves[1], 1, 0.25);
    tl.to({}, { duration: 0.12 }, 0.31);

    // t=0.44: Spread 3 → Monsoon Log (L) | Artists (R)
    flipLeaf(leaves[2], 2, 0.44);
    tl.to({}, { duration: 0.12 }, 0.50);

    // t=0.63: Spread 4 → Artist Log (L) | Backstage (R)
    flipLeaf(leaves[3], 3, 0.63);
    tl.to({}, { duration: 0.12 }, 0.69);

    // t=0.82: Spread 5 → Backstage Log (L) | Community (R)
    flipLeaf(leaves[4], 4, 0.82);
    tl.to({}, { duration: 0.07 }, 0.88);

    // t=0.91: Final → Community Log (L) | Static final page / Leaf 6 (R)
    flipLeaf(leaves[5], 5, 0.91);
    tl.to({}, { duration: 0.04 }, 0.96);

    // t=0.96: Fade in CTA
    tl.to('.read-more-cta', {
      opacity: 1, y: 0, pointerEvents: 'auto',
      duration: 0.03, ease: 'power2.out',
    }, 0.96);

    tl.to({}, { duration: 0.03 });

  }, []);

  return (
    <section
      ref={sectionRef}
      id="diary"
      className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#241A14] via-[#1F1713] to-[#140E0B] overflow-hidden select-none font-serif border-t-4 border-[#2E221B]"
    >
      {/* Film-grain noise */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[900] opacity-[0.04] mix-blend-overlay" aria-hidden="true">
        <filter id="diary-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#diary-noise)"/>
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(234,223,197,0.06)_0%,transparent_75%)] pointer-events-none z-10"/>
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(20,14,11,0.92)] pointer-events-none z-10"/>

      {/* SVG symbol defs */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <symbol id="sym-clip" viewBox="0 0 40 90">
            <path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38"
              fill="none" stroke="#A68853" strokeWidth="3.5" strokeLinecap="round"/>
          </symbol>
          <symbol id="sym-compass" viewBox="0 0 40 40">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="20" cy="20" r="16"/>
              <path d="M20,4 L23,17 L20,20 L17,17 Z" fill="currentColor" stroke="none"/>
              <path d="M20,36 L23,23 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.5"/>
              <path d="M4,20  L17,17 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <path d="M36,20 L23,17 L20,20 L23,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none"/>
            </g>
          </symbol>
          <symbol id="sym-rain" viewBox="0 0 26 26">
            <path d="M6,12 a5,5 0 0 1 9.5,-2 a4,4 0 0 1 1,7.9 h-11 a3.8,3.8 0 0 1 0.5,-5.9 z"
              fill="none" stroke="#5A4032" strokeWidth="1.3"/>
            <line x1="9" y1="21" x2="7"  y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="13" y1="21" x2="12" y2="25" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="17" y1="21" x2="16" y2="24" stroke="#5A4032" strokeWidth="1.3" strokeLinecap="round"/>
          </symbol>
        </defs>
      </svg>

      {/* Hanging microphone wire */}
      <div className="diary-mic-wire absolute top-0 left-[4%] z-[100] pointer-events-none origin-top flex flex-col items-center">
        <div className="w-[1.5px] h-[360px] md:h-[430px] bg-[#1F1713] border-r border-[#5A4032]/40"/>
        <div className="w-4 h-7 bg-[#2E221B] rounded-sm border border-[#A68853]/60 shadow-md flex items-center justify-center -mt-0.5">
          <div className="w-2.5 h-4 bg-[#A68853]/30 rounded-xs"/>
        </div>
      </div>

      {/* Archive header */}
      <div className="absolute top-5 left-10 right-10 flex justify-between items-center z-20 pointer-events-none">
        <div>
          <div className="font-mono text-[9px] md:text-[10px] text-[#A68853] tracking-[0.25em] font-bold uppercase opacity-85">
            ARCHIVAL FIELD JOURNAL // FILE NO. 1974-TS
          </div>
          <p className="font-serif italic text-xs text-[#EADFC5]/75 mt-0.5">"Every room has a memory."</p>
        </div>
      </div>

      {/* 3D Stage */}
      <div style={{ perspective: '2200px', perspectiveOrigin: '50% 40%', position: 'relative' }}>

        {/* Desk shadow */}
        <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 bg-black blur-[55px] opacity-[0.22]"
          style={{ width: '72%', height: '54px' }}/>

        {/* Book Container */}
        <div
          id="diary-book"
          style={{
            position: 'relative',
            width: 'min(880px, 92vw)',
            height: 'min(620px, 74vh)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/*
            RIGHT BACK-COVER BOARD (z:0, right-half only)
            Underneath the right-side page stack. Always present.
          */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%',
            zIndex: 0, borderRadius: '0 2px 2px 0',
            background: 'linear-gradient(155deg,#2E1E14 0%,#3A2718 14%,#4B3529 34%,#5A4032 50%,#4B3529 66%,#3A2718 86%,#2E1E14 100%)',
            boxShadow: '8px 10px 40px rgba(0,0,0,0.6), inset -4px 0 20px rgba(0,0,0,0.3)',
            border: '1px solid #1F1310', borderLeft: 'none',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:0.17, borderRadius:'0 2px 2px 0',
              background:'repeating-linear-gradient(0deg,rgba(166,136,83,0.22) 0 1px,transparent 1px 6px)' }}/>
            <div style={{ position:'absolute', inset:'8px', border:'1px solid rgba(166,136,83,0.1)', borderRadius:'0 1px 1px 0' }}/>
          </div>

          {/*
            LEFT BASE BOARD (z:0, left-half only)
            Underneath the left-side flipped pages.
            Starts at opacity: 0 when closed so NO back cover board appears on the left!
            Fades to opacity: 1 as Leaf 0 turns open.
          */}
          <div className="diary-left-base" style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
            zIndex: 0, borderRadius: '2px 0 0 2px', opacity: 0,
            background: 'linear-gradient(155deg,#2E1E14 0%,#3A2718 14%,#4B3529 34%,#5A4032 50%,#4B3529 66%,#3A2718 86%,#2E1E14 100%)',
            boxShadow: '-8px 10px 40px rgba(0,0,0,0.6), inset 4px 0 20px rgba(0,0,0,0.3)',
            border: '1px solid #1F1310', borderRight: 'none',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:0.17, borderRadius:'2px 0 0 2px',
              background:'repeating-linear-gradient(0deg,rgba(166,136,83,0.22) 0 1px,transparent 1px 6px)' }}/>
            <div style={{ position:'absolute', inset:'8px', border:'1px solid rgba(166,136,83,0.1)', borderRadius:'1px 0 0 1px' }}/>
          </div>

          {/* Spine */}
          <div style={{
            position: 'absolute',
            left: 'calc(50% - 14px)', width: '28px',
            top: '-5px', bottom: '-5px',
            zIndex: 99, borderRadius: '2px',
            background: 'linear-gradient(90deg,#140D08 0%,#2E1E14 10%,#4B3529 28%,#6B4B39 50%,#4B3529 72%,#2E1E14 90%,#140D08 100%)',
            boxShadow: 'inset 0 0 16px rgba(0,0,0,0.75), 5px 0 14px rgba(0,0,0,0.55), -5px 0 14px rgba(0,0,0,0.55)',
          }}>
            <div style={{ position:'absolute', inset:0, opacity:0.5,
              background:'repeating-linear-gradient(0deg,rgba(166,136,83,0.6) 0 2px,transparent 2px 8px)' }}/>
            <div className="font-mono text-[9.5px] tracking-[0.18em] text-[#A68853] opacity-90 whitespace-nowrap select-none"
              style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%) rotate(90deg)' }}>
              TANGY DIARY · VOL. I · 2016–2026
            </div>
          </div>

          {/* Fabric bookmark */}
          <div style={{
            position:'absolute', left:'calc(50% - 5px)', width:11, height:40,
            bottom:-28, zIndex:3,
            background:'linear-gradient(to bottom,#A44A34,#5A1D13)',
            clipPath:'polygon(0 0,100% 0,100% 78%,50% 100%,0 78%)',
            boxShadow:'0 4px 8px rgba(0,0,0,0.4)',
          }}/>

          {/* ── LEAF 0: Front Cover / Inside Cover ─────────────────────── */}
          <div className="diary-leaf" style={leafStyle(0)}>
            {/* FRONT: leather hardcover */}
            <div style={frontFace({
              background: 'linear-gradient(145deg,#6B4B39 0%,#5A4032 45%,#4B3529 100%)',
              boxShadow: 'inset -8px 0 22px rgba(0,0,0,0.38)',
            })}>
              <div style={{ position:'absolute', inset:0, opacity:0.12,
                background:'repeating-linear-gradient(140deg,rgba(0,0,0,0.35) 0 1px,transparent 1px 4px)' }}/>
              <div style={{ position:'absolute', inset:13, border:'1.5px solid rgba(166,136,83,0.45)' }}>
                <div style={{ position:'absolute', inset:5, border:'1px solid rgba(166,136,83,0.22)' }}/>
              </div>
              {[
                { top:8,   left:8,   borderTop:'2px solid',    borderLeft:'2px solid' },
                { top:8,   right:8,  borderTop:'2px solid',    borderRight:'2px solid' },
                { bottom:8,left:8,   borderBottom:'2px solid', borderLeft:'2px solid' },
                { bottom:8,right:8,  borderBottom:'2px solid', borderRight:'2px solid' },
              ].map((s, k) => (
                <div key={k} style={{ position:'absolute', width:16, height:16,
                  borderColor:'rgba(166,136,83,0.75)', ...s }}/>
              ))}
              <div style={{ position:'absolute', inset:0, padding:24, display:'flex', flexDirection:'column' }}
                className="text-[#EADFC5]">
                <div className="font-mono text-[7px] tracking-[0.22em] uppercase text-[#EADFC5]/55 text-center mt-3">
                  Archive No. 001
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="font-serif font-bold leading-none tracking-wide text-[#A68853]"
                    style={{ fontSize:'min(50px,5vw)' }}>
                    TANGY<br/>DIARY
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.42em] text-[#EADFC5]/72 mt-3 uppercase">Field Notes</div>
                  <div className="font-serif italic text-xs text-[#EADFC5]/50 mt-1">Hyderabad · Since 2016</div>
                  <svg className="w-6 h-6 mx-auto mt-3 opacity-45 text-[#A68853]"><use href="#sym-compass"/></svg>
                </div>
                {/* Closure strap */}
                <div className="diary-strap" style={{
                  position:'absolute', left:-8, right:-4, height:25,
                  top:'61%', transform:'translateY(-50%) rotate(-0.8deg)',
                  background:'linear-gradient(to bottom,#4B3529,#2E1E14)',
                  borderTop:'1px dashed rgba(166,136,83,0.32)',
                  borderBottom:'1px dashed rgba(166,136,83,0.32)',
                }}>
                  <div style={{ position:'absolute', right:'13%', top:'50%', transform:'translateY(-50%)',
                    width:20, height:20, border:'2px solid #A68853', borderRadius:2,
                    background:'linear-gradient(135deg,#A68853,#7A5C30)' }}/>
                </div>
                <div className="diary-strap font-serif font-bold text-xs text-[#EADFC5]" style={{
                  position:'absolute', left:'34%', top:'61%',
                  transform:'translateX(-50%) translateY(-50%) rotate(-4deg)',
                  width:38, height:38, borderRadius:'50%',
                  background:'radial-gradient(circle,#A44A34,#5A1D13)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.55)',
                }}>TS</div>
                <div className="font-mono text-[7px] tracking-[0.14em] uppercase text-[#EADFC5]/42 text-center mt-auto mb-4 leading-relaxed">
                  Field Journal · Property of Tangy Sessions
                </div>
                <div className="absolute bottom-5 right-4 font-serif italic text-[11px] opacity-35">— T.S.</div>
              </div>
            </div>
            {/* BACK: Inside Cover — shown on LEFT after cover opens */}
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }}
                className="flex flex-col items-center justify-center text-center text-[#2E221B]">
                <div className="font-serif italic text-[22px]">Field Journal</div>
                <div className="font-mono text-[8px] tracking-[0.1em] uppercase text-[#5A4032] mt-2"
                  style={{ border:'1px dashed rgba(166,136,83,0.55)', padding:'4px 10px' }}>
                  Vol. I · 2016 — 2026
                </div>
                <svg className="opacity-70 text-[#A44A34] mt-4" style={{ width:70, height:70 }} viewBox="0 0 120 120">
                  <defs>
                    <path id="ic1" d="M14,60 a46,46 0 1,1 92,0"/>
                    <path id="ic2" d="M106,60 a46,46 0 1,1 -92,0"/>
                  </defs>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.1"/>
                  <text fontSize="9" letterSpacing="2" fill="currentColor">
                    <textPath href="#ic1" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath>
                  </text>
                  <text fontSize="8" letterSpacing="2" fill="currentColor">
                    <textPath href="#ic2" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath>
                  </text>
                </svg>
                <div className="mt-4" style={{ border:'1px dashed rgba(166,136,83,0.48)', padding:12, maxWidth:155 }}>
                  <div className="font-serif italic text-[11px] text-[#5A4032]">
                    Property of the Archive.<br/>Handle with care.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── LEAF 1: Spread 1 Right (Stepwell) / Spread 2 Left (Log) ── */}
          <div className="diary-leaf" style={leafStyle(1)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <svg className="absolute -top-1.5 right-7 w-[14px]"><use href="#sym-clip"/></svg>
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #01</span>
                  <span className="text-[#A44A34] font-bold">14 Oct, 2024</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">The Beginning &amp;<br/>Bansilalpet Stepwell</div>
                <div className="font-mono text-[8px] text-[#A44A34] uppercase tracking-wider mt-1">LOCATION: BANSILALPET STEPWELL</div>
                <p className="font-serif text-[13px] mt-2 leading-relaxed opacity-88">
                  The stepwell echoes before the crowd arrives. Water dripping against
                  350-year-old stone, acoustic instruments humming without amplification.
                </p>
                <figure className="absolute top-[106px] right-3 w-[86px] bg-[#FBF7EE] shadow-md rotate-2" style={{ padding:'6px 6px 16px' }}>
                  <div className="absolute -top-1.5 left-4 bg-[#A68853]/50 -rotate-2" style={{ width:30, height:11 }}/>
                  <svg viewBox="0 0 100 110" className="w-full">
                    <rect width="100" height="110" fill="#3D2B1F"/>
                    <circle cx="50" cy="55" r="13" fill="#1F1713"/>
                  </svg>
                  <figcaption className="text-center font-serif text-[10px] text-[#2E221B] mt-1">Stepwell Echoes</figcaption>
                </figure>
                <div className="absolute bottom-5 left-4 bg-[#E6D8B7] shadow-xs -rotate-1"
                  style={{ padding:8, maxWidth:115, border:'1px solid rgba(166,136,83,0.32)' }}>
                  <div className="font-serif text-[10px]">Echo off 350-year-old stone.</div>
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] tracking-[0.08em] uppercase mb-2"
                  style={{ borderBottom:'1px solid rgba(90,64,50,0.5)', display:'inline-block', paddingBottom:2 }}>
                  Spread #02 — Left
                </div>
                <div className="font-serif italic text-lg">Bansilalpet Stepwell Log</div>
                <div className="font-mono text-[8.5px] leading-relaxed text-[#5A4032] mt-2">
                  <b>Mic:</b> Ribbon R44<br/><b>Preamp:</b> Tube U47<br/><b>Echo Delay:</b> 2.4s
                </div>
                <p className="font-serif italic text-[13px] mt-4 opacity-80">
                  "The acoustic echo bounced off limestone steps for 2.4 seconds before fading."
                </p>
                <div className="absolute bottom-5 left-4 font-mono text-[8px] text-[#A44A34] -rotate-2"
                  style={{ border:'1px solid #A44A34', padding:'2px 8px' }}>STEPWELL ARCHIVE STAMPED</div>
              </div>
            </div>
          </div>

          {/* ── LEAF 2: Spread 2 Right (Monsoon) / Spread 3 Left (Log) ── */}
          <div className="diary-leaf" style={leafStyle(2)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #02</span>
                  <span className="text-[#A44A34] font-bold">21 Dec, 2024</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Monsoon Acoustics &amp;<br/>Old City Haveli</div>
                <div className="flex items-center gap-1.5 font-mono text-[8px] text-[#5A4032] uppercase mt-1">
                  <svg className="w-4 h-4"><use href="#sym-rain"/></svg>
                  <span>300 AUDIENCE // MIDNIGHT</span>
                </div>
                <p className="font-serif text-[13px] mt-2 leading-relaxed opacity-88">
                  When the lights dropped at midnight, 300 people stood completely still
                  under rain-soaked arches. No phones in the air.
                </p>
                <div className="absolute bottom-5 left-4 bg-[#E6D8B7] rotate-1 shadow-xs"
                  style={{ padding:8, maxWidth:120, border:'1px solid rgba(166,136,83,0.32)' }}>
                  <div className="font-serif text-[10px]">300 people stayed till sunrise.</div>
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] tracking-[0.08em] uppercase mb-2"
                  style={{ borderBottom:'1px solid rgba(90,64,50,0.5)', display:'inline-block', paddingBottom:2 }}>
                  Spread #03 — Left
                </div>
                <p className="font-serif italic text-[13px] mt-2 opacity-85">
                  "Taramati pavilion was built so a voice travels 2 miles without amplifiers."
                </p>
                <div className="font-mono text-[8px] text-[#5A4032] mt-6"
                  style={{ borderTop:'1px solid rgba(166,136,83,0.38)', paddingTop:8 }}>
                  // DISPATCH LOG: MONSOON 1974
                </div>
              </div>
            </div>
          </div>

          {/* ── LEAF 3: Spread 3 Right (Artists) / Spread 4 Left (Log) ── */}
          <div className="diary-leaf" style={leafStyle(3)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #03</span>
                  <span className="text-[#A44A34] font-bold">05 Jan, 2025</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Artists &amp;<br/>Performers</div>
                <p className="font-serif text-[13px] mt-2 leading-relaxed opacity-88">
                  The artists gathered around ribbon microphones for an unscripted acoustic jam.
                  Someone pulled out a tanpura, another started a vocal chant.
                </p>
                <div className="absolute bottom-5 left-4 text-[#EADFC5] font-mono text-[8px] rotate-1 shadow-sm"
                  style={{ background:'#A44A34', padding:8, maxWidth:122 }}>
                  PERFORMER PASS // BACKSTAGE
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] tracking-[0.08em] uppercase mb-2"
                  style={{ borderBottom:'1px solid rgba(90,64,50,0.5)', display:'inline-block', paddingBottom:2 }}>
                  Spread #04 — Left
                </div>
                <div className="font-serif italic text-lg mt-1">Artist Jam Log</div>
                <p className="font-serif italic text-[13px] mt-3 opacity-80">
                  "Unscripted, unplugged, and raw. The night decided what to play."
                </p>
              </div>
            </div>
          </div>

          {/* ── LEAF 4: Spread 4 Right (Backstage) / Spread 5 Left (Log) */}
          <div className="diary-leaf" style={leafStyle(4)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #04</span>
                  <span className="text-[#A44A34] font-bold">Backstage</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Backstage Notes &amp;<br/>Hidden Spaces</div>
                <p className="font-serif text-[13px] mt-2 leading-relaxed opacity-88">
                  A 300-year-old sanctuary tucked behind stone arches. We mapped the acoustics
                  by hand, with no digital tools.
                </p>
                <div className="font-mono text-[8px] text-[#5A4032] mt-3"
                  style={{ border:'1px dashed rgba(90,64,50,0.4)', padding:8 }}>
                  [ NORTH WALL: REVERB 1.8s ]<br/>
                  [ SOUTHERN ARCH: NATURAL BASS TRAP ]
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="font-mono text-[9px] tracking-[0.08em] uppercase mb-2"
                  style={{ borderBottom:'1px solid rgba(90,64,50,0.5)', display:'inline-block', paddingBottom:2 }}>
                  Spread #05 — Left
                </div>
                <p className="font-serif italic text-[13px] mt-3 opacity-80">"No speaker stacks. The stone speaks."</p>
              </div>
            </div>
          </div>

          {/* ── LEAF 5: Spread 5 Right (Community) / Final Left (Log) ─── */}
          <div className="diary-leaf" style={leafStyle(5)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }} className="text-[#2E221B]">
                <div className="flex justify-between font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-1.5">
                  <span>Spread #05</span>
                  <span className="text-[#A44A34] font-bold">Community</span>
                </div>
                <div className="font-serif italic text-xl leading-tight">Community &amp;<br/>Crew Letters</div>
                <p className="font-serif text-[13px] mt-2 leading-relaxed opacity-88">
                  Great experiences are built by passionate people behind the scenes.
                  Sound crews, chai makers, and listeners who stayed till dawn.
                </p>
                <div className="bg-[#E6D8B7] -rotate-1 shadow-xs mt-4"
                  style={{ padding:8, maxWidth:140, border:'1px solid rgba(166,136,83,0.4)' }}>
                  <div className="font-mono text-[8px] text-[#A44A34] font-bold">VOLUNTEER DOSSIER</div>
                  <div className="font-serif italic text-[11px] mt-1">Built with love by 40+ crew.</div>
                </div>
              </div>
            </div>
            <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
              <div style={{ position:'absolute', inset:0, padding:20 }}
                className="text-[#2E221B] flex flex-col items-center justify-center text-center">
                <div className="font-serif italic text-lg">The story continues.</div>
                <p className="font-serif text-[13px] text-[#5A4032] mt-3 opacity-80" style={{ maxWidth:155 }}>
                  Every Tangy Session leaves another page waiting to be written.
                </p>
                <div className="font-serif italic text-base mt-4 font-bold">To be continued…</div>
              </div>
            </div>
          </div>

          {/* ── LEAF 6: Static final right page (never flips) ──────────── */}
          <div className="diary-leaf" style={leafStyle(6)}>
            <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
              <div style={{ position:'absolute', inset:0, padding:20 }}
                className="text-[#2E221B] flex flex-col items-center justify-center text-center">
                <div className="font-mono text-[9px] tracking-[0.09em] uppercase text-[#5A4032] mb-4"
                  style={{ borderBottom:'1px solid rgba(90,64,50,0.5)', display:'inline-block', paddingBottom:2 }}>
                  Continue Reading
                </div>
                <div className="font-serif italic text-2xl">More stories<br/>are waiting.</div>
                <p className="font-serif text-[13px] text-[#5A4032] mt-3 opacity-80" style={{ maxWidth:158 }}>
                  The diary continues with every new Tangy Session.
                </p>
                <div className="font-serif italic text-base font-bold opacity-65 mt-5">To be continued…</div>
              </div>
            </div>
          </div>

        </div>{/* /book container */}
      </div>{/* /3d stage */}

      {/* Read More CTA */}
      <div className="read-more-cta absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-center flex flex-col items-center">
        <p className="font-serif italic text-xs text-[#EADFC5]/70 mb-2">
          Every Tangy Session leaves another page waiting to be written.
        </p>
        <a
          href="/blogs"
          className="bg-[#A68853] text-[#1F1713] hover:bg-[#EADFC5] border-2 border-[#1F1713] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors"
          style={{ boxShadow:'4px 4px 0px #2E221B' }}
        >
          Read the Complete Tangy Diary →
        </a>
      </div>

      {/* Scroll hint */}
      <div className="read-hint absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none"
        style={{ zIndex: 10000 }}>
        <div className="font-serif italic text-sm tracking-wider text-[#A68853]">Scroll to Open Journal</div>
        <div className="text-xs text-[#A68853] opacity-75 mt-0.5 animate-bounce">↓</div>
      </div>

    </section>
  );
};
