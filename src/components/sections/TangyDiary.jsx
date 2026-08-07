import React, { useState, useEffect, useRef } from 'react';

export const TangyDiary = () => {
  const sectionRef = useRef(null);
  const dustLayerRef = useRef(null);

  const [currentSpread, setCurrentSpread] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sectionActive, setSectionActive] = useState(false);
  const [hasTriggeredOpen, setHasTriggeredOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const leavesCount = 5; // Cover (0) + Leaf 1 (1) + Leaf 2 (2) + Leaf 3 (3) + Leaf 4 (4)
  const maxSpread = leavesCount;

  // Audio synthesis for realistic page turns
  const audioCtxRef = useRef(null);

  const playPageSound = () => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const dur = 0.35;
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.value = 0.12;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {
      console.error(e);
    }
  };

  // IntersectionObserver for active section state
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isActive = entry.isIntersecting && entry.intersectionRatio > 0.4;
          setSectionActive(isActive);
        });
      },
      { threshold: [0, 0.4, 0.8] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Floating dust animation creation
  useEffect(() => {
    if (!dustLayerRef.current) return;
    const dustContainer = dustLayerRef.current;
    dustContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const d = document.createElement('div');
      d.className = 'dust-particle';
      const size = 2 + Math.random() * 3;
      d.style.width = `${size}px`;
      d.style.height = `${size}px`;
      d.style.left = `${Math.random() * 100}%`;
      d.style.top = `${60 + Math.random() * 35}%`;
      d.style.setProperty('--dx', `${Math.random() * 40 - 20}px`);
      d.style.setProperty('--dy', `${-(100 + Math.random() * 140)}px`);
      d.style.setProperty('--dust-op', (0.3 + Math.random() * 0.4).toFixed(2));
      d.style.animationDuration = `${7 + Math.random() * 8}s`;
      d.style.animationDelay = `${Math.random() * 6}s`;
      dustContainer.appendChild(d);
    }
  }, []);

  // Wheel and Touch interactions
  const wheelAccumRef = useRef(0);
  const THRESHOLD = 45;

  const goForward = () => {
    if (isAnimating || currentSpread >= maxSpread) return;
    setIsAnimating(true);
    playPageSound();

    if (currentSpread === 0) {
      setHasTriggeredOpen(true);
      setTimeout(() => {
        setCurrentSpread(1);
        setIsAnimating(false);
      }, 1200);
    } else {
      setTimeout(() => {
        setCurrentSpread((prev) => Math.min(prev + 1, maxSpread));
        setIsAnimating(false);
      }, 750);
    }
  };

  const goBackward = () => {
    if (isAnimating || currentSpread <= 0) return;
    setIsAnimating(true);
    playPageSound();

    setTimeout(() => {
      setCurrentSpread((prev) => Math.max(prev - 1, 0));
      setIsAnimating(false);
    }, 750);
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (!sectionActive) return;

      const down = e.deltaY > 0;
      if (currentSpread === 0 && !down) return;
      if (currentSpread === maxSpread && down) return;

      e.preventDefault();
      if (isAnimating) return;

      wheelAccumRef.current += e.deltaY;
      if (wheelAccumRef.current > THRESHOLD) {
        wheelAccumRef.current = 0;
        goForward();
      } else if (wheelAccumRef.current < -THRESHOLD) {
        wheelAccumRef.current = 0;
        goBackward();
      }
    };

    let touchStartY = null;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!sectionActive || touchStartY === null) return;
      const currentY = e.touches[0].clientY;
      const delta = touchStartY - currentY;
      const down = delta > 0;

      if (currentSpread === 0 && !down) return;
      if (currentSpread === maxSpread && down) return;

      e.preventDefault();
      if (isAnimating) return;

      if (Math.abs(delta) > 40) {
        if (delta > 0) goForward();
        else goBackward();
        touchStartY = currentY;
      }
    };

    const currentSec = sectionRef.current;
    if (currentSec) {
      currentSec.addEventListener('wheel', handleWheel, { passive: false });
      currentSec.addEventListener('touchstart', handleTouchStart, { passive: true });
      currentSec.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (currentSec) {
        currentSec.removeEventListener('wheel', handleWheel);
        currentSec.removeEventListener('touchstart', handleTouchStart);
        currentSec.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [sectionActive, isAnimating, currentSpread]);

  // Z-Index calculation helper for 3D stacks
  const getZIndex = (idx) => {
    if (idx < currentSpread) return leavesCount + idx;
    return leavesCount - idx;
  };

  return (
    <section 
      ref={sectionRef}
      id="diary" 
      className={`relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1C130C] via-[#120C07] to-[#0C0805] text-[#F3E7C9] overflow-hidden select-none font-serif ${sectionActive ? 'active' : ''}`}
    >
      {/* SVG GRAIN & DECOR DEFINITIONS */}
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

      {/* SOUND TOGGLE */}
      <button 
        onClick={() => setSoundOn(!soundOn)} 
        className="absolute top-5 right-6 z-30 w-9 h-9 rounded-full bg-[#1E1A17]/60 border border-[#C8A24A]/40 text-[#C8A24A] flex items-center justify-center cursor-pointer text-sm transition-opacity hover:opacity-100"
        aria-label="Toggle page sound"
        title="Toggle page sound"
      >
        {soundOn ? '♪' : '✕'}
      </button>

      {/* VINTAGE DESK BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none z-1 opacity-70">
        <svg className="absolute left-[4%] top-[12%] w-[230px] text-black opacity-[0.055]"><use href="#sym-staff"/></svg>
        <svg className="absolute right-[4%] bottom-[8%] w-[240px] text-black opacity-[0.055]"><use href="#sym-contour"/></svg>
        <svg className="absolute left-[5%] bottom-[14%] w-[220px] text-black opacity-[0.055]"><use href="#sym-manuscript"/></svg>
        <div className="absolute w-[120px] h-[120px] left-[8%] top-[44%] rounded-full opacity-[0.28] mix-blend-multiply bg-[radial-gradient(circle,transparent_54%,rgba(90,58,42,0.32)_57%,rgba(90,58,42,0.14)_62%,transparent_66%),radial-gradient(circle,transparent_38%,rgba(90,58,42,0.18)_41%,transparent_46%)]" />
        <div className="absolute w-[70px] h-[70px] right-[10%] top-[18%] rounded-full opacity-[0.15] mix-blend-multiply bg-[radial-gradient(circle,transparent_54%,rgba(90,58,42,0.32)_57%,rgba(90,58,42,0.14)_62%,transparent_66%)]" />
      </div>

      {/* DUST PARTICLES LAYER */}
      <div ref={dustLayerRef} className="absolute inset-0 pointer-events-none z-5" />

      {/* 3D BOOK STAGE */}
      <div className={`relative transition-transform duration-1000 [perspective:2200px] [perspective-origin:50%_42%] ${sectionActive ? 'scale-100' : 'scale-[0.93]'}`}>
        
        {/* DESK SHADOW & LIGHTING */}
        <div className="absolute left-1/2 -bottom-5 w-[60%] h-[44px] -translate-x-1/2 bg-black blur-[50px] opacity-[0.15] z-1" />
        <div className="absolute -inset-[30px] pointer-events-none z-[85] bg-[radial-gradient(ellipse_at_18%_8%,rgba(255,238,205,0.16),transparent_55%),linear-gradient(160deg,rgba(255,255,255,0.05),transparent_40%,rgba(0,0,0,0.15)_100%)] mix-blend-soft-light" />

        {/* BOOK CONTAINER */}
        <div className={`relative w-[min(880px,90vw)] h-[min(660px,76vh)] [transform-style:preserve-3d] ${currentSpread > 0 ? 'book-opening' : ''}`}>
          
          {/* SPINE HINGE BAR */}
          <div className="absolute left-[calc(50%-14px)] -top-[3px] -bottom-[3px] w-[28px] z-[80] rounded-sm bg-[linear-gradient(90deg,#3a2115_0%,#5A3927_12%,#6b4530_50%,#5A3927_88%,#3a2115_100%)] shadow-[inset_0_0_16px_rgba(0,0,0,0.55),3px_0_8px_rgba(0,0,0,0.45),-3px_0_8px_rgba(0,0,0,0.45),0_10px_26px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 rounded-sm bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.05)_0_2px,transparent_2px_7px,rgba(0,0,0,0.14)_7px_9px,transparent_9px_14px)]" />
            <div className="absolute top-[14px] bottom-[14px] left-[4px] right-[4px] bg-[repeating-linear-gradient(0deg,rgba(224,196,140,0.75)_0_3px,transparent_3px_8px)_left/2px_100%_no-repeat,repeating-linear-gradient(0deg,rgba(224,196,140,0.75)_0_3px,transparent_3px_8px)_right/2px_100%_no-repeat]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-sans text-[11.5px] tracking-[0.2em] text-[#C8A55A] opacity-[0.88] drop-shadow">
              TANGY DIARY · VOL. I · 2016–2026
            </div>
          </div>

          {/* PAGE STACK DEPTH */}
          <div className="absolute top-[1.5%] -right-[11px] w-[13px] h-[97%] bg-[repeating-linear-gradient(0deg,#f2e6c4_0_1.4px,#e2cf9c_1.4px_2.6px,#cdb789_2.6px_3.2px)] shadow-[2px_0_6px_rgba(0,0,0,0.32),inset_-2px_0_3px_rgba(0,0,0,0.18)] rounded-r-sm z-[15]" />

          {/* COVER CAST SHADOW */}
          <div className={`absolute left-[2%] top-0 w-[46%] h-full bg-gradient-to-r from-black/50 to-transparent pointer-events-none z-6 transition-opacity duration-500 ${currentSpread > 0 ? 'opacity-55' : 'opacity-0'}`} />

          {/* STATIC FRONTISPIECE (LEFT TITLE PAGE REVEALED WHEN COVER OPENS) */}
          <div className={`absolute top-0 left-[2%] w-[46%] h-full z-5 transition-all duration-500 ${currentSpread >= 1 ? 'opacity-100 filter-none' : 'opacity-0 brightness-[0.82]'}`}>
            <div className="relative w-full h-full p-6 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32),inset_0_0_3px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center text-[#1E1A17]">
              <div className="absolute w-[100px] h-[100px] bottom-[10px] right-[10px] rounded-full opacity-70 mix-blend-multiply bg-[radial-gradient(circle,transparent_54%,rgba(90,58,42,0.32)_57%,transparent_66%)]" />
              <div className="font-serif italic text-3xl font-normal">Field Diary</div>
              <div className="inline-block font-mono text-[9px] tracking-[0.07em] uppercase text-[#6b4a34] bg-[#e6d5a8] border border-dashed border-[#C8A24A] px-2 py-1 mt-2">
                Vol. I · 2016 — 2026
              </div>

              {/* ARCHIVE STAMP RING */}
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

          {/* LEAF 0 : MUSEUM COVER */}
          <div 
            className={`absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d] [transform-origin:0%_50%] transition-transform duration-1000 ease-in-out ${currentSpread >= 1 ? '-rotate-y-180' : 'rotate-y-0'}`}
            style={{ zIndex: getZIndex(0) }}
          >
            <div className="absolute top-0 left-full w-[12px] h-full [transform-origin:0%_50%] rotate-y-90 [backface-visibility:hidden] bg-[repeating-linear-gradient(0deg,#e9dcb8_0_2px,#cdb789_2px_4px,#b8a06a_4px_5px,#cdb789_5px_6px)] shadow-[inset_0_0_8px_rgba(0,0,0,0.35)] z-2" />

            {/* COVER FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-sm overflow-visible translate-z-[6px] bg-gradient-to-br from-[#6b4530] via-[#5A3927] to-[#3A2418] text-[#F5E7C8] p-6 shadow-2xl">
              {/* BRASS CORNER CLIPS */}
              <div className="absolute top-1.5 left-1.5 w-[22px] h-[22px] z-9 [clip-path:polygon(0_0,100%_0,0_100%)] bg-gradient-to-br from-[#c2a06a] to-[#7a5c30] shadow-sm" />
              <div className="absolute top-1.5 right-1.5 w-[22px] h-[22px] z-9 [clip-path:polygon(100%_0,100%_100%,0_0)] bg-gradient-to-bl from-[#c2a06a] to-[#7a5c30] shadow-sm" />
              <div className="absolute bottom-1.5 left-1.5 w-[22px] h-[22px] z-9 [clip-path:polygon(0_0,0_100%,100%_100%)] bg-gradient-to-tr from-[#c2a06a] to-[#7a5c30] shadow-sm" />
              <div className="absolute bottom-1.5 right-1.5 w-[22px] h-[22px] z-9 [clip-path:polygon(100%_100%,0_100%,100%_0)] bg-gradient-to-tl from-[#c2a06a] to-[#7a5c30] shadow-sm" />

              {/* GOLD FILIGREE FRAME */}
              <div className="absolute inset-[14px] border-[1.5px] border-[#C8A55A]/55 pointer-events-none z-6">
                <div className="absolute inset-[5px] border border-[#C8A55A]/28" />
              </div>

              {/* LIBRARY STICKER */}
              <div className="absolute top-5 left-5 w-[50px] p-1 bg-[#e9dcb8] text-[#3a2416] shadow-md -rotate-4 font-mono text-[6.5px] text-center z-8">
                No. 001
                <span className="block h-1 mt-0.5 bg-[repeating-linear-gradient(90deg,#2b211b_0_1px,transparent_1px_3px)]" />
              </div>

              <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-[#F5E7C8]/70 text-center pt-4">
                Archive No. 001
              </div>

              {/* TITLE BLOCK */}
              <div className="text-center mt-10 z-6 relative">
                <div className="font-serif text-4xl md:text-5xl font-bold leading-none tracking-wider text-[#C8A55A] drop-shadow-md">
                  TANGY<br/>DIARY
                </div>
                <div className="font-sans text-[10.5px] tracking-[0.4em] text-[#F5E7C8]/85 mt-2 uppercase">Field Notes</div>
                <div className="font-handwriting text-xs text-[#F5E7C8]/65 mt-1">Hyderabad • Since 2016</div>
                <svg className="w-6 h-6 mx-auto mt-2 opacity-60 text-[#C8A55A]"><use href="#sym-compass"/></svg>
              </div>

              {/* LEATHER STRAP & WAX SEAL */}
              <div className={`absolute -left-[3%] -right-[3%] top-[63%] h-[30px] -translate-y-1/2 -rotate-1 bg-gradient-to-b from-[#6b4024] via-[#4a2c18] to-[#3a2115] shadow-lg border-y border-dashed border-[#C8A55A]/40 z-9 transition-all duration-350 ${hasTriggeredOpen ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100'}`}>
                <div className="absolute right-[16%] top-1/2 -translate-y-1/2 w-6 h-6 border-[3px] border-[#9D7A3C] rounded-sm bg-gradient-to-br from-[#c2a06a] to-[#8a6a3a] shadow-md" />
              </div>

              <div className="absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 -rotate-4 w-12 h-12 rounded-full bg-radial from-[#9c2b2f] via-[#7A1F24] to-[#5a1216] shadow-2xl flex items-center justify-center text-[#F5E7C8] font-serif font-bold text-sm z-10">
                TS
              </div>

              <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-[#F5E7C8]/70 text-center mt-6 leading-relaxed">
                Field Journal<br/>Property of Tangy Sessions
              </div>
              <div className="absolute bottom-8 right-5 font-handwriting text-xs opacity-50">— T.S.</div>
              <svg className="absolute bottom-6 left-4 w-6 opacity-20 text-[#e9dcb8]"><use href="#sym-flower"/></svg>
              <div className="absolute -right-1.5 bottom-[66px] w-[32px] h-[19px] bg-gradient-to-br from-[#b8895f] to-[#8a5f3a] shadow-md -rotate-6 z-4 rounded-xs" />
              <div className="absolute left-[44%] -bottom-[22px] w-[11px] h-[36px] bg-gradient-to-b from-[#7A1F24] to-[#5a1216] [clip-path:polygon(0_0,100%_0,100%_78%,50%_100%,0_78%)] opacity-90 z-3" />
            </div>

            {/* COVER BACK (INSIDE FRONT COVER) */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[6px] bg-[repeating-linear-gradient(45deg,rgba(90,58,42,0.05)_0_3px,transparent_3px_9px),linear-gradient(180deg,#F5E7C8,#e9d9ac_65%,#ddc999)] text-[#2B211B] p-6 flex flex-col items-center justify-center text-center">
              <div className="absolute left-1/2 bottom-[56px] -translate-x-1/2 w-[120px] h-[64px] bg-gradient-to-b from-[#e2d1a0] to-[#cbb87f] [clip-path:polygon(6%_100%,0_20%,20%_0,80%_0,100%_20%,94%_100%)] shadow-md">
                <div className="absolute left-1/2 -top-[10px] -translate-x-1/2 w-[84px] h-[30px] bg-[#f5ecd2] border border-[#5A3A2A]/30 shadow-xs" />
              </div>
              <div className="font-serif italic text-xs text-[#6b4a34] mt-2">
                This diary belongs to the<br/>Tangy Sessions Archive.
                <b className="block font-mono text-[9px] tracking-[0.1em] uppercase text-[#7A1F24] mt-1">Ex Libris · Hyderabad</b>
              </div>
            </div>
          </div>

          {/* LEAF 1 : ENTRY #03 */}
          <div 
            className={`absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d] [transform-origin:0%_50%] transition-transform duration-1000 ease-in-out ${currentSpread >= 2 ? '-rotate-y-180' : 'rotate-y-0'} ${currentSpread >= 1 ? 'opacity-100 filter-none' : 'opacity-0 brightness-[0.82]'}`}
            style={{ zIndex: getZIndex(1) }}
          >
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            {/* PAGE 1 FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <svg className="absolute -top-2 right-[34px] w-[18px] text-[#b9b9b9]"><use href="#sym-clip"/></svg>
              <div className="flex justify-between font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6b4a34] mb-2">
                <span>Entry #03</span><span className="text-[#A33828] font-bold">21 Dec, 1974</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-none text-[#1E1A17]">The Night of<br/>Rain &amp; Ragas</div>
              <svg className="w-[120px] h-[8px] my-1" viewBox="0 0 120 8"><path d="M2,5 Q18,1 34,5 T64,5 T94,5 T118,5" stroke="#A33828" strokeWidth="1.6" fill="none"/></svg>
              
              <div className="flex items-start gap-2 mt-2 font-mono text-[9px] text-[#6b4a34] uppercase tracking-wider">
                <svg className="w-5 h-5 shrink-0"><use href="#sym-rain"/></svg>
                <span>Old City Haveli · 7:30 PM</span>
              </div>

              <p className="font-handwriting text-base text-[#3a2416] mt-2 max-w-[190px]">
                The sky didn't stop us. It poured, and still they came — umbrellas, shawls, laughter echoing off ancient walls.
              </p>

              {/* POLAROID */}
              <figure className="absolute top-[96px] right-4 w-[100px] bg-[#fbf7ee] p-1.5 pb-5 shadow-lg">
                <div className="absolute -top-2.5 left-6 w-[40px] h-[16px] bg-[linear-gradient(180deg,rgba(200,162,74,0.85),rgba(168,132,54,0.85))] -rotate-4 opacity-90" />
                <svg viewBox="0 0 100 118" className="w-full">
                  <rect width="100" height="118" fill="#4a3a2a"/>
                  <path d="M35,110 L35,75 Q35,66 42,66 Q47,66 47,72 L47,110 Z" fill="#120c07"/>
                  <circle cx="41" cy="60" r="7" fill="#120c07"/>
                </svg>
                <figcaption className="text-center font-handwriting text-[11px] text-[#4a3016] mt-1">Old City Haveli</figcaption>
              </figure>

              <div className="bg-[#e6d5a8] p-3 shadow-md [clip-path:polygon(0%_3%,6%_0%,13%_4%,21%_1%,29%_5%,38%_0%,47%_4%,56%_1%,65%_5%,74%_0%,83%_4%,92%_1%,100%_3%,100%_96%,93%_100%,85%_95%,76%_100%,67%_96%,58%_100%,49%_95%,40%_100%,31%_96%,22%_100%,13%_95%,6%_99%,0%_96%)] mt-16 max-w-[130px] -rotate-1">
                <div className="font-handwriting text-sm text-[#3a2416]">300 people.<br/>No tickets.<br/>Just music.</div>
              </div>
              <div className="absolute bottom-4 left-5 inline-block font-mono text-[9px] tracking-[0.07em] uppercase text-[#6b4a34] bg-[#e6d5a8] border border-dashed border-[#C8A24A] px-2 py-1">
                TS-1974-21-12-03
              </div>
            </div>

            {/* PAGE 1 BACK */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Sound Check Notes
              </div>
              <div className="font-mono text-[10.5px] leading-relaxed text-[#3a2416]">
                <b>Mic:</b> Ribbon R44<br/><b>Preamp:</b> Tube U47<br/><b>Reel:</b> Studer A80<br/><b>Speed:</b> 15 IPS
              </div>
              <div className="inline-block font-mono text-[11px] tracking-[0.1em] text-[#A33828] border-2 border-[#A33828] px-2 py-0.5 -rotate-4 opacity-80 mix-blend-multiply mt-2">
                Unreleased
              </div>

              <div className="absolute top-5 right-4 w-[118px] bg-[#e6d5a8] p-3 shadow-md [clip-path:polygon(0%_3%,6%_0%,13%_4%,21%_1%,29%_5%,38%_0%,47%_4%,56%_1%,65%_5%,74%_0%,83%_4%,92%_1%,100%_3%,100%_96%,93%_100%,85%_95%,76%_100%,67%_96%,58%_100%,49%_95%,40%_100%,31%_96%,22%_100%,13%_95%,6%_99%,0%_96%)] rotate-2">
                <div className="font-mono text-[9px] uppercase border-b border-[#6b4a34] mb-1">Setlist</div>
                <ol className="font-handwriting text-sm text-[#3a2416] list-decimal pl-4 leading-tight">
                  <li>Raindrops</li><li>Khwaab</li><li>Between The Walls</li><li>The Long Jam</li>
                </ol>
              </div>

              <div className="bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2.5 rounded-xs font-mono text-[9px] shadow-md max-w-[150px] mt-10">
                <b className="font-sans text-xs tracking-wider block">ARTIST PASS</b>
                Backstage Access<br/>Date: 21/12/74
              </div>

              <p className="font-handwriting text-sm italic text-[#3a2416] mt-4 max-w-[180px]">
                "We planned an acoustic set. We got a monsoon symphony."
                <span className="block font-mono text-[9px] text-right text-[#6b4a34] not-italic">— K.</span>
              </p>
              <div className="text-center font-mono text-[9px] tracking-[0.18em] uppercase text-[#6b4a34] border-t border-[#C8A24A] pt-2 mt-4 opacity-85">
                Memories, not recorded
              </div>
            </div>
          </div>

          {/* LEAF 2 : ENTRY #07 */}
          <div 
            className={`absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d] [transform-origin:0%_50%] transition-transform duration-1000 ease-in-out ${currentSpread >= 3 ? '-rotate-y-180' : 'rotate-y-0'}`}
            style={{ zIndex: getZIndex(2) }}
          >
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            {/* PAGE 2 FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="flex justify-between font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#6b4a34] mb-2">
                <span>Entry #07</span><span className="text-[#A33828] font-bold">14 Mar, 1975</span>
              </div>
              <div className="font-serif italic text-xl md:text-2xl leading-none text-[#1E1A17]">Behind the<br/>Microphones</div>
              <div className="font-mono text-[9px] tracking-[0.05em] text-[#6b4a34] uppercase mt-1">Golconda Fort Amphitheatre</div>
              <p className="font-handwriting text-base text-[#3a2416] mt-2 max-w-[180px]">
                Dawn soundcheck, no crowd yet. Just him, a mic, and the fort waking up around us.
              </p>

              <div className="absolute top-[118px] right-[18px] w-[70px] -rotate-3">
                <div className="absolute -top-2 left-5 w-[34px] h-[14px] bg-[linear-gradient(180deg,rgba(200,162,74,0.85),rgba(168,132,54,0.85))]" />
                <svg className="w-[70px] text-[#3a2416] bg-[#efe4c8] p-2 shadow-md"><use href="#sym-mic"/></svg>
              </div>

              <div className="absolute bottom-[74px] left-[18px] flex items-start gap-2">
                <svg className="w-[34px] text-[#7a5236]"><use href="#sym-flower"/></svg>
                <div className="font-handwriting text-xs text-[#3a2416] max-w-[100px]">Found this backstage. Kept it.</div>
              </div>

              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 rounded-xs font-mono text-[9px] shadow-md max-w-[120px]">
                <b className="font-sans text-[11px] block">GOLCONDA LIVE</b>14 MAR 1975
              </div>
            </div>

            {/* PAGE 2 BACK */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Notes
              </div>
              <p className="font-handwriting text-base italic text-[#3a2416] max-w-[170px]">
                "Some songs aren't written. They're just remembered out loud."
              </p>

              <div className="absolute top-[74px] right-[18px] w-[66px]">
                <svg className="w-[66px]"><use href="#sym-cassette"/></svg>
                <div className="inline-block font-mono text-[9px] tracking-[0.07em] uppercase text-[#6b4a34] bg-[#e6d5a8] border border-dashed border-[#C8A24A] px-2 py-0.5 mt-1 text-center w-full">
                  B-Side Mix
                </div>
              </div>

              <svg className="w-[100px] absolute bottom-[56px] left-[18px]"><use href="#sym-wave"/></svg>
              <div className="absolute bottom-4 right-4 bg-[#e6d5a8] p-3 shadow-md [clip-path:polygon(0%_3%,6%_0%,13%_4%,21%_1%,29%_5%,38%_0%,47%_4%,56%_1%,65%_5%,74%_0%,83%_4%,92%_1%,100%_3%,100%_96%,93%_100%,85%_95%,76%_100%,67%_96%,58%_100%,49%_95%,40%_100%,31%_96%,22%_100%,13%_95%,6%_99%,0%_96%)] w-[130px] rotate-[1.5deg]">
                <div className="font-handwriting text-xs text-[#3a2416]">Hands too cold to play. Played anyway.</div>
              </div>
              <div className="text-center font-mono text-[9px] tracking-[0.18em] uppercase text-[#6b4a34] border-t border-[#C8A24A] pt-2 mt-20 opacity-85">
                Golconda Sessions, 1975
              </div>
            </div>
          </div>

          {/* LEAF 3 : LETTERS & QUOTES */}
          <div 
            className={`absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d] [transform-origin:0%_50%] transition-transform duration-1000 ease-in-out ${currentSpread >= 4 ? '-rotate-y-180' : 'rotate-y-0'}`}
            style={{ zIndex: getZIndex(3) }}
          >
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            {/* PAGE 3 FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[repeating-linear-gradient(180deg,transparent_0_27px,rgba(90,58,42,0.16)_27px_28px),radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <svg className="absolute -top-2 left-[60px] w-[18px] text-[#b9b9b9]"><use href="#sym-clip"/></svg>
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                Letters &amp; Quotes
              </div>
              <p className="font-handwriting text-xl italic text-[#3a2416] mt-2 max-w-[200px]">
                "Music is the strongest form of magic."
              </p>
              <div className="font-mono text-[9px] text-[#6b4a34] mt-1">— Tangy Sessions, field notes</div>
              <p className="font-handwriting text-base text-[#3a2416] mt-6 max-w-[200px]">
                Dear diary — real people, real stories, real music. That's all this ever was.
              </p>
              <svg className="w-[22px] absolute bottom-[60px] left-[22px] text-[#A33828]"><use href="#sym-heart"/></svg>
              <div className="absolute bottom-4 right-4 bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 rounded-xs font-mono text-[9px] shadow-md max-w-[110px] rotate-3">
                <b className="font-sans text-[11px] block">TARAMATI BARADARI</b>25 OCT 2024
              </div>
            </div>

            {/* PAGE 3 BACK */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                A Collection of Tickets
              </div>
              <div className="relative h-[120px] mt-4">
                <div className="absolute top-0 left-1.5 w-[100px] bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 font-mono text-[9px] -rotate-6 shadow-md">
                  STEPWELL SESSIONS
                </div>
                <div className="absolute top-4 left-[70px] w-[100px] bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 font-mono text-[9px] rotate-4 shadow-md">
                  OLD CITY HAVELI
                </div>
                <div className="absolute top-[44px] left-[26px] w-[100px] bg-gradient-to-r from-[#b8895f] to-[#8a5f3a] text-[#F3E7C9] p-2 font-mono text-[9px] -rotate-2 shadow-md">
                  GOLCONDA FORT
                </div>
              </div>
              <svg viewBox="0 0 100 40" className="w-[90px] mt-2 opacity-70">
                <path d="M4,34 L28,20 L48,30 L74,10 L96,18" fill="none" stroke="#6b4a34" strokeWidth="1.3" strokeDasharray="3 3"/>
                <circle cx="4" cy="34" r="2" fill="#A33828"/>
                <circle cx="96" cy="18" r="2" fill="#A33828"/>
              </svg>
              <div className="font-handwriting text-base text-[#3a2416] mt-1 max-w-[190px]">Every ticket tells a story.</div>
            </div>
          </div>

          {/* LEAF 4 : MEMORIES & END */}
          <div 
            className={`absolute top-0 left-1/2 w-[46%] h-full [transform-style:preserve-3d] [transform-origin:0%_50%] transition-transform duration-1000 ease-in-out ${currentSpread >= 5 ? '-rotate-y-180' : 'rotate-y-0'}`}
            style={{ zIndex: getZIndex(4) }}
          >
            <div className="absolute top-[2%] -right-[5px] w-[9px] h-[96%] bg-[repeating-linear-gradient(0deg,#ecdfb6_0_2px,#d8c48f_2px_4px,#c2a86e_4px_5px)] shadow-md rounded-r-xs" />
            
            {/* PAGE 4 FRONT */}
            <div className="absolute inset-0 [backface-visibility:hidden] translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)]">
              <div className="font-mono text-[11px] tracking-[0.09em] uppercase text-[#1E1A17] border-b border-[#6b4a34] inline-block pb-0.5 mb-2">
                A Collection of Memories
              </div>
              <figure className="w-[120px] bg-[#fbf7ee] p-1.5 pb-5 shadow-lg mt-3">
                <div className="absolute -top-2 left-7 w-[40px] h-[14px] bg-[linear-gradient(180deg,rgba(200,162,74,0.85),rgba(168,132,54,0.85))]" />
                <svg viewBox="0 0 120 96" className="w-full">
                  <rect width="120" height="96" fill="#c9b78d"/>
                  <g fill="#241a10" opacity="0.85">
                    <circle cx="20" cy="80" r="5"/><circle cx="34" cy="82" r="5"/><circle cx="48" cy="78" r="5"/><circle cx="62" cy="82" r="5"/>
                  </g>
                </svg>
                <figcaption className="text-center font-handwriting text-xs text-[#4a3016] mt-1">Still gives me chills</figcaption>
              </figure>
              <div className="absolute bottom-[56px] right-4 inline-block font-mono text-xs tracking-[0.1em] text-[#A33828] border-2 border-[#A33828] px-2 py-1 rotate-6 opacity-80 mix-blend-multiply text-center">
                Archive<br/>Sealed
              </div>
              <p className="absolute bottom-4 left-4 font-handwriting text-base text-[#3a2416] max-w-[190px]">
                Not just a page. It's a memory.
              </p>
            </div>

            {/* PAGE 4 BACK */}
            <div className="absolute inset-0 [backface-visibility:hidden] rotate-y-180 translate-z-[1px] p-5 bg-[radial-gradient(ellipse_at_25%_0%,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,#F3E7C9,#e6d5a8_65%,#ddc999)] shadow-[inset_0_0_46px_rgba(90,58,42,0.32)] flex flex-col items-center justify-center text-center">
              <svg className="w-[80px] h-[80px] opacity-85 text-[#A33828] mix-blend-multiply" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="et1" d="M14,60 a46,46 0 1,1 92,0"/>
                  <path id="et2" d="M106,60 a46,46 0 1,1 -92,0"/>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                <text fontSize="10" letterSpacing="2" fill="currentColor"><textPath href="#et1" startOffset="50%" textAnchor="middle">END OF VOLUME</textPath></text>
                <text fontSize="9" letterSpacing="2.2" fill="currentColor"><textPath href="#et2" startOffset="50%" textAnchor="middle">MORE SOON ★</textPath></text>
              </svg>
              <div className="font-handwriting text-lg text-[#3a2416] mt-4">To be continued…</div>
            </div>
          </div>

        </div>
      </div>

      {/* SCROLL HINT */}
      <div 
        onClick={currentSpread === maxSpread ? () => window.location.assign('/blogs') : goForward}
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 text-center cursor-pointer transition-opacity duration-600 ${sectionActive ? 'opacity-85' : 'opacity-0'}`}
      >
        {currentSpread === 0 && (
          <>
            <div className="font-serif italic text-base tracking-wider text-[#C8A55A]">Open the Archive</div>
            <div className="text-xs text-[#C8A55A] opacity-75 my-0.5 animate-bounce">↓</div>
            <div className="font-serif italic text-[10px] tracking-widest text-[#F5E7C8]/55">Scroll to unlock the memories</div>
          </>
        )}
        {currentSpread > 0 && currentSpread < maxSpread && (
          <>
            <div className="font-serif italic text-sm tracking-wider text-[#C8A55A]">Scroll to Turn Page</div>
            <div className="text-xs text-[#C8A55A] opacity-75 my-0.5 animate-bounce">↓</div>
          </>
        )}
        {currentSpread === maxSpread && (
          <a href="/blogs" className="font-serif italic text-base tracking-wider text-[#C8A55A] hover:underline flex items-center gap-1">
            Read More →
          </a>
        )}
      </div>
    </section>
  );
};
