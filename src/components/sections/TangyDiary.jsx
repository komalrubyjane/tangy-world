import { useState, useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useAudio } from '../../audio/AudioContext';

gsap.registerPlugin(ScrollTrigger);

const PAPER_BG = 'linear-gradient(170deg, #F5EEE0 0%, #EADFC5 45%, #E3D4AC 100%)';
const SH_R = 'inset -8px 0 20px rgba(90,64,50,0.18), 8px 10px 32px rgba(0,0,0,0.48)';
const SH_L = 'inset  8px 0 20px rgba(90,64,50,0.18), -8px 10px 32px rgba(0,0,0,0.48)';

const leafStyle = (i, isMobile, mobileTurnedState) => {
  const isTurned = mobileTurnedState !== undefined ? mobileTurnedState : false;
  return {
    position: 'absolute',
    top: 0, right: 0, bottom: 0,
    width: '50%',
    transformOrigin: 'left center',
    transformStyle: 'preserve-3d',
    zIndex: isMobile ? (isTurned ? 20 + i : 20 - i) : (20 - i),
    transform: isMobile ? (isTurned ? 'rotateY(-180deg)' : 'rotateY(0deg)') : 'rotateY(0deg)',
    transition: isMobile ? 'transform 0.65s cubic-bezier(0.645, 0.045, 0.355, 1.000)' : 'none',
    willChange: 'transform',
    cursor: 'pointer'
  };
};

const frontFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  borderRadius: '0 2px 2px 0',
  overflow: 'hidden',
  ...extra,
});

const backFace = (extra = {}) => ({
  position: 'absolute', inset: 0,
  backfaceVisibility: 'hidden',
  transform: 'rotateY(180deg)',
  borderRadius: '2px 0 0 2px',
  overflow: 'hidden',
  ...extra,
});

export const TangyDiary = () => {
  const { playSFX } = useAudio();
  const [isMobile, setIsMobile] = useState(false);
  const [currentMobileLeaf, setCurrentMobileLeaf] = useState(0);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop 3D Page Flipping Timeline attached via useGSAPContext
  const sectionRef = useGSAPContext((ctx) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=600%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          // Fade out scroll hint when scrolling starts
          if (self.progress > 0.05) {
            gsap.to('.read-hint', { opacity: 0, duration: 0.3 });
          } else {
            gsap.to('.read-hint', { opacity: 1, duration: 0.3 });
          }
        }
      }
    });

    // 1. Fade in left base cover board as book opens
    tl.to('.diary-left-base', { opacity: 1, duration: 0.3 }, 0);

    // 2. Flip each leaf sequentially from 0deg to -180deg with 3D zIndex stacking
    const numLeaves = 6;
    for (let i = 0; i < numLeaves; i++) {
      const startTime = i * 1;
      const midTime = startTime + 0.5;

      // Rotate leaf from 0 to -180 degrees
      tl.to(`.desktop-leaf-${i}`, {
        rotateY: -180,
        duration: 1,
        ease: 'power1.inOut',
      }, startTime);

      // At mid-flip (-90deg), switch zIndex so turned leaf sits ON TOP of left stack
      tl.set(`.desktop-leaf-${i}`, { zIndex: 20 + i }, midTime);
    }
  }, [isMobile]);

  // Mobile & Desktop Manual Leaf Click/Turn
  const handleLeafClick = (leafIndex) => {
    playSFX('ticketClick');
    if (isMobile) {
      if (currentMobileLeaf >= leafIndex + 1) {
        setCurrentMobileLeaf(leafIndex);
      } else {
        setCurrentMobileLeaf(leafIndex + 1);
      }
    }
  };

  const handleNextLeaf = () => {
    playSFX('ticketClick');
    if (currentMobileLeaf < 6) {
      setCurrentMobileLeaf((prev) => prev + 1);
    }
  };

  const handlePrevLeaf = () => {
    playSFX('ticketClick');
    if (currentMobileLeaf > 0) {
      setCurrentMobileLeaf((prev) => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (!isHorizontalSwipe.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (isHorizontalSwipe.current && Math.abs(deltaX) > 30) {
      if (deltaX < 0) {
        handleNextLeaf();
      } else {
        handlePrevLeaf();
      }
    }
  };

  return (
    <section ref={sectionRef} id="diary"
      className="relative w-full bg-[#241A14] overflow-hidden flex flex-col items-center justify-center border-t-8 border-[#4A3529]"
      style={{ minHeight: isMobile ? 'auto' : '100svh', padding: isMobile ? '80px 0 40px' : '0' }}>

      {/* Parchment noise overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.14] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

      {/* SVG Definitions */}
      <svg className="hidden">
        <defs>
          <symbol id="sym-compass" viewBox="0 0 40 40">
            <g fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="20" cy="20" r="16"/>
              <path d="M20,4 L23,17 L20,20 L17,17 Z" fill="currentColor" stroke="none"/>
              <path d="M20,36 L23,23 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.5"/>
              <path d="M4,20  L17,17 L20,20 L17,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <path d="M36,20 L23,17 L20,20 L23,23 Z" fill="currentColor" stroke="none" opacity="0.7"/>
              <circle cx="20" cy="20" r="2.2" fill="currentColor" stroke="none"/>
            </g>
          </symbol>
        </defs>
      </svg>

      {/* Section Header */}
      <div className="pt-4 lg:pt-0 lg:absolute lg:top-5 left-10 right-10 flex flex-col lg:flex-row justify-between items-center z-20 text-center lg:text-left pointer-events-none mb-4 lg:mb-0">
        <div>
          <div className="font-mono text-[9px] md:text-[10px] text-[#A68853] tracking-[0.25em] font-bold uppercase opacity-85">
            ARCHIVAL FIELD JOURNAL // FILE NO. 1974-TS
          </div>
          <p className="font-serif italic text-xs text-[#EADFC5]/75 mt-0.5">"Every room has a memory."</p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3D DIARY BOOK (ZOOMED OUT ON MOBILE, SCROLL & CLICK 3D PAGE FLIP)  */}
      {/* ================================================================= */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex flex-col items-center justify-center select-none"
        style={{ touchAction: 'pan-y' }}
      >
        <div 
          style={{ 
            perspective: '2200px', 
            perspectiveOrigin: '50% 40%', 
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: isMobile ? 'scale(0.55)' : 'scale(1)',
            transformOrigin: 'center center',
            margin: isMobile ? '-110px 0 -90px' : '0'
          }}
        >
          {/* Desk shadow */}
          <div className="absolute left-1/2 -bottom-5 -translate-x-1/2 bg-black blur-[55px] opacity-[0.22]"
            style={{ width: '72%', height: '54px' }}/>

          {/* Book Container */}
          <div
            id="diary-book"
            style={{
              position: 'relative',
              width: 'min(880px, 94vw)',
              height: 'min(620px, 70vh)',
              minHeight: '520px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* RIGHT BACK-COVER BOARD (z:0) */}
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

            {/* LEFT BASE BOARD (z:0) */}
            <div 
              className="diary-left-base" 
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
                zIndex: 0, borderRadius: '2px 0 0 2px',
                opacity: isMobile ? (currentMobileLeaf > 0 ? 1 : 0) : 0,
                transition: 'opacity 0.3s ease',
                background: 'linear-gradient(155deg,#2E1E14 0%,#3A2718 14%,#4B3529 34%,#5A4032 50%,#4B3529 66%,#3A2718 86%,#2E1E14 100%)',
                boxShadow: '-8px 10px 40px rgba(0,0,0,0.6), inset 4px 0 20px rgba(0,0,0,0.3)',
                border: '1px solid #1F1310', borderRight: 'none',
              }}
            >
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
              <div className="font-mono text-[8.5px] md:text-[9.5px] tracking-[0.18em] text-[#A68853] opacity-90 whitespace-nowrap select-none"
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
            <div 
              className="diary-leaf desktop-leaf-0" 
              style={leafStyle(0, isMobile, currentMobileLeaf >= 1)}
              onClick={() => handleLeafClick(0)}
            >
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
                <div style={{ position:'absolute', inset:0, padding:18, display:'flex', flexDirection:'column' }}
                  className="text-[#EADFC5]">
                  <div className="font-mono text-[7px] tracking-[0.22em] uppercase text-[#EADFC5]/55 text-center mt-2">
                    Archive No. 001
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="font-serif font-bold leading-none tracking-wide text-[#A68853]"
                      style={{ fontSize:'min(46px,4.5vw)' }}>
                      TANGY<br/>DIARY
                    </div>
                    <div className="font-mono text-[9px] tracking-[0.38em] text-[#EADFC5]/72 mt-2 uppercase">Field Notes</div>
                    <div className="font-serif italic text-[11px] text-[#EADFC5]/50 mt-1">Hyderabad · Since 2016</div>
                    <svg className="w-5 h-5 mx-auto mt-2 opacity-45 text-[#A68853]"><use href="#sym-compass"/></svg>
                  </div>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }}
                  className="flex flex-col items-center justify-center text-center text-[#2E221B]">
                  <div className="font-serif italic text-lg">Field Journal</div>
                  <div className="font-mono text-[8px] tracking-[0.1em] uppercase text-[#5A4032] mt-1.5"
                    style={{ border:'1px dashed rgba(166,136,83,0.55)', padding:'3px 8px' }}>
                    Vol. I · 2016 — 2026
                  </div>
                  <div className="mt-3" style={{ border:'1px dashed rgba(166,136,83,0.48)', padding:8, maxWidth:140 }}>
                    <div className="font-serif italic text-[10px] text-[#5A4032]">
                      Property of the Archive.<br/>Handle with care.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── LEAF 1: Stepwell ── */}
            <div 
              className="diary-leaf desktop-leaf-1" 
              style={leafStyle(1, isMobile, currentMobileLeaf >= 2)}
              onClick={() => handleLeafClick(1)}
            >
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="flex justify-between font-mono text-[8.5px] tracking-[0.09em] uppercase text-[#5A4032] mb-1">
                    <span>Spread #01</span>
                    <span className="text-[#A44A34] font-bold">14 Oct, 2024</span>
                  </div>
                  <div className="font-serif italic text-lg leading-tight">The Beginning &amp;<br/>Bansilalpet Stepwell</div>
                  <div className="font-mono text-[7.5px] text-[#A44A34] uppercase tracking-wider mt-0.5">LOCATION: BANSILALPET STEPWELL</div>
                  <p style={{ fontFamily:'Caveat, cursive', fontSize:'14px' }} className="mt-1.5 leading-relaxed opacity-90 text-[#2E221B]">
                    The stepwell echoes before the crowd arrives. Water dripping against
                    350-year-old stone, acoustic instruments humming without amplification.
                  </p>
                  <figure className="absolute top-[90px] right-2 w-[72px] bg-[#FBF7EE] shadow-md rotate-2" style={{ padding:'4px 4px 12px' }}>
                    <div className="absolute -top-1 left-3 bg-[#A68853]/50 -rotate-2" style={{ width:24, height:9 }}/>
                    <svg viewBox="0 0 100 110" className="w-full">
                      <rect width="100" height="110" fill="#3D2B1F"/>
                      <circle cx="50" cy="55" r="13" fill="#1F1713"/>
                    </svg>
                    <figcaption className="text-center font-serif text-[8.5px] text-[#2E221B] mt-0.5">Stepwell Echoes</figcaption>
                  </figure>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="font-mono text-[8px] uppercase mb-1 border-b border-[#5A4032]/40 pb-0.5 inline-block">
                    Spread #02 — Left
                  </div>
                  <div className="font-serif italic text-base">Bansilalpet Stepwell Log</div>
                  <p className="font-serif italic text-[11.5px] mt-2 opacity-80">
                    "The acoustic echo bounced off limestone steps for 2.4 seconds before fading."
                  </p>
                </div>
              </div>
            </div>

            {/* ── LEAF 2: Monsoon ── */}
            <div 
              className="diary-leaf desktop-leaf-2" 
              style={leafStyle(2, isMobile, currentMobileLeaf >= 3)}
              onClick={() => handleLeafClick(2)}
            >
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="flex justify-between font-mono text-[8.5px] uppercase text-[#5A4032] mb-1">
                    <span>Spread #02</span>
                    <span className="text-[#A44A34] font-bold">21 Dec, 2024</span>
                  </div>
                  <div className="font-serif italic text-lg leading-tight">Monsoon Acoustics &amp;<br/>Old City Haveli</div>
                  <p style={{ fontFamily:'Caveat, cursive', fontSize:'14px' }} className="mt-1.5 leading-relaxed opacity-90 text-[#2E221B]">
                    When the lights dropped at midnight, 300 people stood completely still
                    under rain-soaked arches. No phones in the air.
                  </p>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="font-mono text-[8px] uppercase mb-1 border-b border-[#5A4032]/40 pb-0.5 inline-block">
                    Spread #03 — Left
                  </div>
                </div>
              </div>
            </div>

            {/* ── LEAF 3: Performers ── */}
            <div 
              className="diary-leaf desktop-leaf-3" 
              style={leafStyle(3, isMobile, currentMobileLeaf >= 4)}
              onClick={() => handleLeafClick(3)}
            >
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="flex justify-between font-mono text-[8.5px] uppercase text-[#5A4032] mb-1">
                    <span>Spread #03</span>
                    <span className="text-[#A44A34] font-bold">05 Jan, 2025</span>
                  </div>
                  <div className="font-serif italic text-lg leading-tight">Artists &amp;<br/>Performers</div>
                  <p style={{ fontFamily:'Caveat, cursive', fontSize:'14px' }} className="mt-1.5 leading-relaxed opacity-90 text-[#2E221B]">
                    The artists gathered around ribbon microphones for an unscripted acoustic jam.
                  </p>
                  <div className="absolute bottom-3 left-3 text-[#EADFC5] font-mono text-[7.5px] rotate-1 shadow-sm"
                    style={{ background:'#A44A34', padding:'5px 8px', maxWidth:115 }}>
                    PERFORMER PASS // BACKSTAGE
                  </div>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="font-mono text-[8px] uppercase mb-1 border-b border-[#5A4032]/40 pb-0.5 inline-block">
                    Spread #04 — Left
                  </div>
                </div>
              </div>
            </div>

            {/* ── LEAF 4: Backstage ── */}
            <div 
              className="diary-leaf desktop-leaf-4" 
              style={leafStyle(4, isMobile, currentMobileLeaf >= 5)}
              onClick={() => handleLeafClick(4)}
            >
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="font-serif italic text-lg leading-tight">Backstage Notes &amp;<br/>Hidden Spaces</div>
                  <p style={{ fontFamily:'Caveat, cursive', fontSize:'14px' }} className="mt-1.5 opacity-88">
                    A 300-year-old sanctuary tucked behind stone arches. We mapped the acoustics
                    by hand, with no digital tools.
                  </p>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }} className="text-[#2E221B]">
                  <div className="font-mono text-[8px] uppercase mb-1 border-b border-[#5A4032]/40 pb-0.5 inline-block">
                    Spread #05 — Left
                  </div>
                </div>
              </div>
            </div>

            {/* ── LEAF 5: Community Note ── */}
            <div 
              className="diary-leaf desktop-leaf-5" 
              style={leafStyle(5, isMobile, currentMobileLeaf >= 6)}
              onClick={() => handleLeafClick(5)}
            >
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:12 }} className="text-[#2E221B]">
                  <div className="relative mx-auto" style={{
                    background: 'linear-gradient(170deg, #FDFAF4 0%, #F8F3E8 60%, #F2EBD8 100%)',
                    border: '1px solid rgba(90,64,50,0.15)',
                    boxShadow: '3px 4px 12px rgba(60,40,20,0.25)',
                    padding: '10px 12px',
                    transform: 'rotate(-1.2deg)',
                  }}>
                    <p style={{ fontFamily:'Caveat, cursive', fontSize:'14px', lineHeight:'1.45', color:'#2E221B' }}>
                      Dear You,<br/><br/>
                      Every gathering leaves something behind.<br/><br/>
                      A song. A conversation. A place. A memory.<br/><br/>
                      And somehow, we carry it with us.
                    </p>
                    <p style={{ fontFamily:'Caveat, cursive', fontSize:'13px', color:'#A44A34', textAlign:'right', marginTop:4 }}>— Tangy</p>
                  </div>
                </div>
              </div>
              <div style={backFace({ background:PAPER_BG, boxShadow:SH_L })}>
                <div style={{ position:'absolute', inset:0, padding:16 }}
                  className="text-[#2E221B] flex flex-col items-center justify-center text-center">
                  <div className="font-serif italic text-base">The story continues.</div>
                </div>
              </div>
            </div>

            {/* ── LEAF 6: Static final right page ──────────── */}
            <div className="diary-leaf" style={leafStyle(6, isMobile, false)}>
              <div style={frontFace({ background:PAPER_BG, boxShadow:SH_R })}>
                <div style={{ position:'absolute', inset:0, padding:16 }}
                  className="text-[#2E221B] flex flex-col items-center justify-center text-center">
                  <div className="font-serif italic text-xl">More stories<br/>are waiting.</div>
                  <div style={{ fontFamily:'Caveat, cursive', fontSize:'16px', fontWeight:700 }} className="mt-3 opacity-60">To be continued…</div>
                </div>
              </div>
            </div>

          </div>{/* /book container */}
        </div>{/* /3d stage */}

        {/* Page Turn Controls & Touch Hint (Visible on mobile or as controls) */}
        <div className="flex flex-col items-center gap-2 z-30 mt-4 lg:mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevLeaf}
              disabled={currentMobileLeaf === 0}
              className="font-mono text-[10px] sm:text-xs font-bold text-[#EADFC5] border border-[#A68853] px-3.5 py-1.5 rounded-sm disabled:opacity-30 active:scale-95 bg-[#2E1E14] hover:bg-[#A68853] hover:text-[#1F1713] transition-colors"
            >
              ← PREV PAGE
            </button>

            <span className="font-mono text-[10px] sm:text-xs text-[#A68853] font-bold">
              LEAF {currentMobileLeaf} / 6
            </span>

            <button
              onClick={handleNextLeaf}
              disabled={currentMobileLeaf === 6}
              className="font-mono text-[10px] sm:text-xs font-bold text-[#EADFC5] border border-[#A68853] px-3.5 py-1.5 rounded-sm disabled:opacity-30 active:scale-95 bg-[#2E1E14] hover:bg-[#A68853] hover:text-[#1F1713] transition-colors"
            >
              NEXT PAGE →
            </button>
          </div>
          <div className="font-serif italic text-[11px] text-[#EADFC5]/65 text-center">
            {isMobile ? '👈 Swipe left/right on book to turn pages 👉' : 'Scroll down to flip pages in 3D, or use the buttons above!'}
          </div>
        </div>
      </div>

      {/* Read More CTA */}
      <div className="read-more-cta mt-6 lg:mt-0 lg:absolute lg:bottom-8 left-1/2 lg:-translate-x-1/2 z-30 flex flex-col items-center">
        <p className="font-serif italic text-xs text-[#EADFC5]/70 mb-2 text-center">
          Every Tangy Session leaves another page waiting to be written.
        </p>
        <a
          href="/blogs"
          className="bg-[#A68853] text-[#1F1713] hover:bg-[#EADFC5] border-2 border-[#1F1713] px-6 py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors shadow-[4px_4px_0px_#2E221B]"
        >
          Read the Complete Tangy Diary →
        </a>
      </div>

      {/* Desktop Scroll hint */}
      <div className="read-hint hidden lg:block absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none" style={{ zIndex: 10000 }}>
        <div className="font-serif italic text-sm tracking-wider text-[#A68853]">Scroll to Open Journal</div>
        <div className="text-xs text-[#A68853] opacity-75 mt-0.5 animate-bounce">↓</div>
      </div>

    </section>
  );
};
