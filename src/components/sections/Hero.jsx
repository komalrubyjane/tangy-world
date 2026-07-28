import { useRef, useEffect } from 'react';
import { useGSAPContext } from '../../hooks/useGSAPContext';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const Hero = () => {
  const { setFilterCutoff, playSFX } = useAudio();
  const ticketRef = useRef(null);

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

    // Intro Entrance Animation
    gsap.from('.headline .word', {
      opacity: 0,
      y: 40,
      scale: 1.05,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out'
    });

    gsap.from('.portrait-wrap', {
      opacity: 0,
      scale: 0.9,
      y: 50,
      duration: 1.2,
      delay: 0.2,
      ease: 'back.out(1.2)'
    });

    gsap.from('.badge', {
      opacity: 0,
      scale: 0.7,
      stagger: 0.08,
      duration: 0.8,
      delay: 0.4,
      ease: 'back.out(1.4)'
    });

    gsap.from('.ticket', {
      opacity: 0,
      y: 40,
      duration: 0.8,
      delay: 0.6,
      ease: 'power3.out'
    });

  }, []);

  const handleExploreClick = () => {
    playSFX('ticketClick');
    if (ticketRef.current) {
      ticketRef.current.animate(
        [
          { transform: 'translateX(-50%) scale(1)' },
          { transform: 'translateX(-50%) scale(0.97)' },
          { transform: 'translateX(-50%) scale(1)' }
        ],
        { duration: 220 }
      );
    }
    document.querySelector('#manifesto')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef} 
      id="hero" 
      className="relative w-full max-w-full h-screen min-h-[720px] bg-[#3c0f0e] overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 select-none"
    >
      {/* SVG FILTERS */}
      <svg className="absolute width-0 height-0 overflow-hidden pointer-events-none z-0">
        <filter id="roughen" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>

      {/* STAGE & POSTER CONTAINER */}
      <div className="w-full max-w-[1706px] my-auto">
        <div className="container-inline-size w-full">
          <div 
            className="relative w-full aspect-[1706/955] overflow-hidden rounded-md shadow-[0_30px_80px_rgba(0,0,0,0.55),0_4px_0_rgba(0,0,0,0.4)] bg-[radial-gradient(120%_90%_at_50%_8%,#8a2320_0%,#6e1a19_45%,#4c1210_100%)] isolate"
          >
            {/* CORNER CROSSHAIRS */}
            <div className="absolute z-30 w-[3.2cqw] h-[3.2cqw] opacity-85 top-[1.6cqw] left-[1.3cqw]">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
            </div>
            <div className="absolute z-30 w-[3.2cqw] h-[3.2cqw] opacity-85 top-[1.6cqw] right-[1.3cqw]">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
            </div>
            <div className="absolute z-30 w-[3.2cqw] h-[3.2cqw] opacity-85 bottom-[1.8cqw] left-[1.3cqw]">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
            </div>
            <div className="absolute z-30 w-[3.2cqw] h-[3.2cqw] opacity-85 bottom-[1.8cqw] right-[1.3cqw]">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="8" fill="none" stroke="#ecdcaf" strokeWidth="1.4"/><line x1="20" y1="0" x2="20" y2="40" stroke="#ecdcaf" strokeWidth="1.2"/><line x1="0" y1="20" x2="40" y2="20" stroke="#ecdcaf" strokeWidth="1.2"/></svg>
            </div>

            {/* TOP BAR */}
            <div className="absolute z-31 top-[2.6cqw] left-[6.2cqw] right-[6.2cqw] flex items-start justify-between">
              <div className="text-[1.05cqw] leading-tight text-left">
                <div className="flex items-center gap-[0.5cqw] font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
                  <span>Hyderabad, India</span>
                </div>
                <div className="flex items-center gap-[0.5cqw] mt-[0.2cqw] font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
                  <span>Est. 2016</span>
                  <svg className="w-[1cqw] h-[1cqw] opacity-90" viewBox="0 0 24 24" fill="none" stroke="#ecdcaf" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
                </div>
                <div className="w-[2.6cqw] h-[2px] bg-[#ecdcaf] opacity-70 mt-[0.35cqw]" />
              </div>

              <div className="text-[1.05cqw] leading-tight text-right">
                <div className="flex items-center justify-end gap-[0.5cqw] font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
                  <span>Live Archive</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ecdcaf" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                </div>
                <div className="flex items-center justify-end gap-[0.5cqw] mt-[0.2cqw] font-mono font-semibold text-[#ecdcaf] uppercase tracking-[0.14em]">
                  <span>Issue 001 · Side A</span>
                </div>
                <div className="w-[2.6cqw] h-[2px] bg-[#ecdcaf] opacity-70 mt-[0.35cqw] ml-auto" />
              </div>
            </div>

            {/* TOP CENTER EYEBROW */}
            <div className="absolute z-31 top-[2.5cqw] left-1/2 -translate-x-1/2 text-center">
              <div className="font-mono font-semibold text-[1.5cqw] letter-spacing-[0.22em] text-[#ecdcaf] uppercase">
                Live Music · Heritage · Culture
              </div>
              <div className="flex items-center justify-center gap-[0.5cqw] mt-[0.5cqw]">
                <span className="w-[9cqw] h-[2px] bg-[#d1a437] opacity-80" />
                <svg className="w-[1cqw] h-[1cqw]" viewBox="0 0 24 24" fill="none" stroke="#d1a437" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </div>
            </div>

            {/* STEPWELL SILHOUETTE */}
            <svg className="absolute z-2 left-0 bottom-0 w-[34cqw] h-[36cqw] opacity-55 mix-blend-multiply" viewBox="0 0 400 420" preserveAspectRatio="xMinYMax meet">
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

            {/* HEADLINE "TANGY SESSIONS" */}
            <div className="headline absolute z-5 top-[2.5cqw] left-0 right-0 text-center [filter:url(#roughen)]">
              <span className="word tangy block font-poster text-[14.4cqw] leading-[0.82] tracking-[0.005em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative mt-[1.6cqw] before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410] before:[-webkit-text-stroke:0]" data-text="TANGY">
                TANGY
              </span>
              <span className="word sessions block font-poster text-[14.4cqw] leading-[0.82] tracking-[-0.01em] text-[#ecdcaf] uppercase [-webkit-text-stroke:0.12cqw_#191410] relative -mt-[0.5cqw] before:content-[attr(data-text)] before:absolute before:left-[0.42cqw] before:top-[0.55cqw] before:-z-1 before:text-[#191410] before:[-webkit-text-stroke:0]" data-text="SESSIONS">
                SESSIONS
              </span>
            </div>

            {/* HANGING MICROPHONE (WITH SWAY ANIMATION) */}
            <div className="mic absolute z-20 top-0 left-1/2 -translate-x-[4%] w-[9cqw] h-[23cqw] origin-top animate-[sway_6s_ease-in-out_infinite]">
              <svg viewBox="0 0 100 260" preserveAspectRatio="xMidYMin meet">
                <line x1="50" y1="0" x2="50" y2="90" stroke="#141110" strokeWidth="2.5"/>
                <g transform="translate(50,90)">
                  <rect x="-16" y="0" width="32" height="90" rx="16" fill="#cfd2d4" stroke="#141110" strokeWidth="2"/>
                  <rect x="-16" y="0" width="14" height="90" rx="7" fill="#9aa0a3" opacity=".6"/>
                  <g stroke="#141110" strokeWidth="1.6" opacity=".8">
                    <line x1="-11" y1="12" x2="11" y2="12"/>
                    <line x1="-11" y1="20" x2="11" y2="20"/>
                    <line x1="-11" y1="28" x2="11" y2="28"/>
                    <line x1="-11" y1="36" x2="11" y2="36"/>
                    <line x1="-11" y1="44" x2="11" y2="44"/>
                    <line x1="-11" y1="52" x2="11" y2="52"/>
                  </g>
                  <rect x="-19" y="88" width="38" height="14" rx="4" fill="#3a3d3f" stroke="#141110" strokeWidth="2"/>
                  <rect x="-6" y="100" width="12" height="26" fill="#3a3d3f" stroke="#141110" strokeWidth="2"/>
                </g>
              </svg>
            </div>

            {/* PORTRAIT ILLUSTRATION */}
            <div className="portrait-wrap absolute z-25 left-[44.5%] top-[26.5%] w-[26cqw] h-[52cqw]">
              <div className="portrait-blob absolute -inset-x-[8%] -top-[3%] -bottom-[1%] bg-[#ecdcaf] rounded-[46%_54%_52%_48%/45%_40%_60%_55%] shadow-[0_1.2cqw_2cqw_rgba(0,0,0,0.35)]" />
              <svg className="relative w-full h-full block z-2" viewBox="0 0 320 520" preserveAspectRatio="xMidYMax meet">
                <path d="M40 520 L40 430 Q40 360 100 335 L140 320 Q160 335 190 320 L225 335 Q285 360 285 430 L285 520 Z" fill="#5a1414"/>
                <path d="M120 335 L160 380 L200 335 L190 320 Q160 335 140 320 Z" fill="#3c0d0d"/>
                <rect x="140" y="270" width="42" height="60" rx="12" fill="#e9d6ab"/>
                <ellipse cx="161" cy="205" rx="76" ry="82" fill="#ecdcaf"/>
                <ellipse cx="86" cy="210" rx="10" ry="16" fill="#e2cd97"/>
                <ellipse cx="236" cy="210" rx="10" ry="16" fill="#e2cd97"/>
                <g fill="#1c140d">
                  <circle cx="95" cy="150" r="30"/>
                  <circle cx="120" cy="118" r="34"/>
                  <circle cx="160" cy="102" r="36"/>
                  <circle cx="200" cy="112" r="33"/>
                  <circle cx="232" cy="140" r="30"/>
                  <circle cx="245" cy="175" r="24"/>
                  <circle cx="80" cy="182" r="24"/>
                  <circle cx="70" cy="150" r="20"/>
                  <circle cx="252" cy="150" r="20"/>
                </g>
                <path d="M118 190 q16 -12 34 -2" stroke="#1c140d" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M192 188 q16 -10 34 2" stroke="#1c140d" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M122 210 q14 12 30 0" stroke="#1c140d" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M196 210 q14 12 30 0" stroke="#1c140d" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M158 210 q-6 22 0 30 q6 6 14 0" stroke="#c9b485" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M128 252 q34 20 70 0 q-6 14 -35 16 q-29 -2 -35 -16 Z" fill="#1c140d" opacity=".85"/>
                <path d="M132 262 q34 34 66 0 q-30 26 -66 0 Z" fill="#3c1e10"/>
                <path d="M140 264 q22 16 50 0" stroke="#ecdcaf" strokeWidth="5" fill="none" strokeLinecap="round"/>
                <path d="M110 250 q50 46 104 0 q4 24 -10 40 q-42 26 -84 0 q-14 -16 -10 -40 Z" fill="#1c140d" opacity=".18"/>
                <path d="M108 345 Q60 300 78 235 Q86 215 110 220 Q95 255 118 300 Q130 330 150 345 Z" fill="#5a1414"/>
                <ellipse cx="92" cy="222" rx="20" ry="16" fill="#e9d6ab" transform="rotate(-25 92 222)"/>
                <g transform="translate(150,225) rotate(-32)">
                  <path d="M0 -70 Q22 -66 22 -40 Q30 -20 20 0 Q30 20 20 45 Q22 66 0 70 Q-22 66 -20 45 Q-30 20 -20 0 Q-30 -20 -22 -40 Q-22 -66 0 -70 Z" fill="#7a3b1e" stroke="#3c1a0c" strokeWidth="3"/>
                  <line x1="0" y1="-70" x2="0" y2="-140" stroke="#3c1a0c" strokeWidth="6"/>
                  <ellipse cx="0" cy="-140" rx="9" ry="14" fill="#5a2a12" stroke="#3c1a0c" strokeWidth="2"/>
                  <line x1="-3" y1="-8" x2="-3" y2="30" stroke="#1c140d" strokeWidth="2"/>
                  <line x1="3" y1="-8" x2="3" y2="30" stroke="#1c140d" strokeWidth="2"/>
                  <path d="M-8 -10 q-6 12 0 24" stroke="#1c140d" strokeWidth="2" fill="none"/>
                  <path d="M8 -10 q6 12 0 24" stroke="#1c140d" strokeWidth="2" fill="none"/>
                </g>
                <line x1="255" y1="70" x2="95" y2="345" stroke="#2a1710" strokeWidth="4"/>
                <line x1="248" y1="80" x2="102" y2="336" stroke="#ecdcaf" strokeWidth="2" opacity=".7"/>
                <path d="M215 335 Q255 300 270 250 Q276 230 260 220 Q258 250 235 285 Q220 310 200 335 Z" fill="#5a1414"/>
                <ellipse cx="262" cy="228" rx="19" ry="15" fill="#e9d6ab" transform="rotate(30 262 228)"/>
                <rect x="248" y="205" width="20" height="8" rx="3" fill="#8a6a2a" transform="rotate(30 258 209)"/>
              </svg>
            </div>

            {/* BADGES & STICKERS */}
            {/* RPM BADGE */}
            <div className="badge absolute z-32 left-[1cqw] top-[41%] w-[11.5cqw] h-[11.5cqw] rounded-full bg-[#ecdcaf] border-[0.35cqw] border-[#c2272a] flex flex-col items-center justify-center text-center text-[#c2272a] shadow-[0_0.5cqw_1cqw_rgba(0,0,0,0.4)] -rotate-6">
              <div className="font-poster text-[2.6cqw] leading-[0.9]">33<span className="text-[1.2cqw] align-super">⅓</span></div>
              <div className="font-mono font-bold text-[1.15cqw] tracking-[0.08em] mt-[0.1cqw]">RPM</div>
              <svg className="w-[0.9cqw] h-[0.9cqw] mt-[0.25cqw]" viewBox="0 0 24 24" fill="#c2272a"><path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.3 7-6.3-3.6L5.7 21l1.3-7-5-4.9 7.1-.7z"/></svg>
              <div className="font-mono font-semibold text-[0.95cqw] tracking-[0.15em] mt-[0.3cqw]">STEREO</div>
            </div>

            {/* LIVE AND REAL STICKER */}
            <div className="badge absolute z-32 left-[17.5%] top-[44%] bg-[#191410] text-[#ecdcaf] p-[0.9cqw_1.3cqw] -rotate-7 shadow-[0_0.5cqw_1cqw_rgba(0,0,0,0.45)] text-center relative">
              <div className="absolute -top-[0.9cqw] left-1/2 -translate-x-1/2 -rotate-3 w-[4.2cqw] h-[1.6cqw] bg-[rgba(230,220,190,0.55)] border border-[rgba(255,255,255,0.3)]" />
              <div className="font-mono font-bold text-[1.55cqw] tracking-[0.04em]">LIVE</div>
              <div className="font-mono font-medium text-[0.95cqw] tracking-[0.1em] mt-[0.15cqw]">AND REAL</div>
            </div>

            {/* RECORDED LIVE STAMP */}
            <div className="badge absolute z-32 right-[1.2cqw] top-[37%] w-[9.5cqw] h-[9.5cqw] rounded-full border-[0.22cqw] border-dashed border-[#ecdcaf] outline-[0.05cqw] outline-solid outline-[#c2272a] bg-[radial-gradient(circle,rgba(194,39,42,0.12),transparent_70%)] flex items-center justify-center rotate-8">
              <div className="text-center">
                <div className="font-mono font-semibold text-[0.75cqw] tracking-[0.1em] text-[#ecdcaf]">RECORDED</div>
                <div className="font-poster text-[2.1cqw] text-[#c2272a] leading-none my-[0.15cqw]">LIVE</div>
                <div className="font-mono font-semibold text-[0.65cqw] tracking-[0.08em] text-[#ecdcaf]">AT STEPWELL</div>
              </div>
            </div>

            {/* INHERIT THE PAST TAG */}
            <div className="badge absolute z-32 right-[9.5%] top-[70%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.7cqw_1.1cqw] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.4)] text-center">
              <div className="font-mono font-bold text-[1.05cqw] tracking-[0.3em]">INHERIT THE PAST</div>
              <div className="font-mono font-bold text-[1.05cqw] tracking-[0.3em]">CREATE THE FUTURE</div>
            </div>

            {/* REC TAG */}
            <div className="badge absolute z-32 right-[1cqw] top-[75.5%] bg-[#e9decb] text-[#241a12] -rotate-3 p-[0.55cqw_1cqw] flex items-center gap-[0.5cqw] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.4)]">
              <span className="font-mono font-bold text-[1.15cqw] tracking-[0.06em]">REC</span>
              <div className="w-[0.85cqw] h-[0.85cqw] rounded-full bg-[#c2272a] shadow-[0_0_0.4cqw_#c2272a]" />
            </div>

            {/* CULTURE BLOCK + SIGNATURE */}
            <div className="badge absolute z-32 right-[5.5%] top-[82%] text-left text-[#ecdcaf]">
              <div className="font-mono font-semibold text-[1.5cqw] leading-[1.15] tracking-[0.01em]">KEEP</div>
              <div className="font-mono font-semibold text-[1.5cqw] leading-[1.15] tracking-[0.01em]">THE CULTURE</div>
              <div className="font-mono font-semibold text-[1.5cqw] leading-[1.15] tracking-[0.01em]">ALIVE ★</div>
              <div className="flex items-center gap-[0.4cqw] mt-[0.4cqw]">
                <svg className="w-[1.3cqw] h-[1.3cqw]" viewBox="0 0 24 24" fill="#c2272a"><path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.3 7-6.3-3.6L5.7 21l1.3-7-5-4.9 7.1-.7z"/></svg>
                <span className="flex-1 h-[1px] bg-[#d1a437] opacity-70 max-w-[3cqw]" />
              </div>
            </div>
            <div className="badge absolute z-32 right-[2.5%] top-[90%] font-serif italic font-bold text-[3.2cqw] text-[#d1a437] -rotate-6 drop-shadow-[0.08cqw_0.1cqw_0_rgba(0,0,0,0.3)]">
              Tangy
            </div>

            {/* BANSILALPET STEPWELL TAG */}
            <div className="badge absolute z-32 left-[3.5%] top-[85%] bg-[#191410] text-[#ecdcaf] -rotate-4 p-[0.9cqw_1.1cqw] shadow-[0_0.4cqw_0.8cqw_rgba(0,0,0,0.45)]">
              <div className="font-mono font-bold text-[1.15cqw] tracking-[0.03em] leading-[1.25]">BANSILALPET</div>
              <div className="font-mono font-bold text-[1.15cqw] tracking-[0.03em] leading-[1.25]">STEPWELL ★</div>
            </div>

            {/* TICKET COMPONENT */}
            <div ref={ticketRef} className="ticket absolute z-33 left-1/2 bottom-[2.2%] -translate-x-1/2 w-[34cqw] min-h-[15cqw] bg-[#e9decb] text-[#241a12] shadow-[0_1cqw_2cqw_rgba(0,0,0,0.5)] flex relative before:content-[''] before:absolute before:top-1/2 before:w-[1.6cqw] before:h-[1.6cqw] before:bg-[#4c1210] before:rounded-full before:-translate-y-1/2 before:shadow-[inset_0_0.15cqw_0.3cqw_rgba(0,0,0,0.4)] before:z-5 before:-left-[0.8cqw] after:content-[''] after:absolute after:top-1/2 after:w-[1.6cqw] after:h-[1.6cqw] after:bg-[#4c1210] after:rounded-full after:-translate-y-1/2 after:shadow-[inset_0_0.15cqw_0.3cqw_rgba(0,0,0,0.4)] after:z-5 after:-right-[0.8cqw]">
              <div className="absolute -top-[1cqw] left-[38%] -rotate-4 w-[6cqw] h-[1.8cqw] bg-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.4)] z-2" />
              
              <div className="w-[3.4cqw] flex items-center justify-center border-r-[0.14cqw] border-dashed border-[rgba(36,26,18,0.35)] [writing-mode:vertical-rl] font-mono text-[0.85cqw] tracking-[0.08em] text-[#241a12] opacity-75">
                TS-2016-001
              </div>

              <div className="flex-1 p-[1.1cqw_1.3cqw] flex flex-col justify-between">
                <div className="flex justify-between items-center font-mono font-semibold text-[0.85cqw] tracking-[0.06em] uppercase opacity-80 border-b-[0.12cqw] border-dashed border-[rgba(36,26,18,0.35)] pb-[0.6cqw]">
                  <span>Admit One</span>
                  <span>Vol. 01</span>
                  <span>Archive No. 001</span>
                </div>

                <div className="flex items-center justify-between gap-[1cqw] my-[0.7cqw]">
                  <button 
                    type="button"
                    onClick={handleExploreClick}
                    className="enter font-poster text-[2.6cqw] tracking-[0.01em] flex items-center gap-[0.6cqw] cursor-pointer bg-transparent border-none text-[#241a12] p-0 hover:text-[#c2272a] hover:translate-x-[0.2cqw] transition-all"
                  >
                    Enter Tangy
                    <svg className="w-[1.7cqw] h-[1.7cqw] transition-transform hover:translate-x-[0.3cqw]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </div>

                <div className="font-mono font-medium text-[0.78cqw] tracking-[0.1em] uppercase text-center opacity-75 border-t-[0.12cqw] border-dashed border-[rgba(36,26,18,0.35)] pt-[0.55cqw]">
                  Live Music · Community · Heritage
                </div>
              </div>

              <div className="w-[3.4cqw] flex items-center justify-center border-l-[0.14cqw] border-dashed border-[rgba(36,26,18,0.35)] [writing-mode:vertical-rl] font-mono text-[1.05cqw] tracking-[0.05em] text-[#c2272a]">
                09100
              </div>
            </div>

            {/* TEXTURE OVERLAYS */}
            <div className="spatter absolute inset-0 z-39 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_6%_88%,rgba(0,0,0,0.35)_0_3px,transparent_4px),radial-gradient(circle_at_9%_91%,rgba(0,0,0,0.3)_0_2px,transparent_3px),radial-gradient(circle_at_93%_12%,rgba(0,0,0,0.3)_0_2px,transparent_3px)]" />
            <div className="scratches absolute inset-0 z-41 pointer-events-none opacity-50 mix-blend-soft-light bg-[repeating-linear-gradient(78deg,rgba(0,0,0,0.12)_0_1px,transparent_1px_140px),repeating-linear-gradient(-83deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_220px)]" />
            <div className="grain absolute inset-0 z-40 bg-[url('data:image/svg+xml;utf8,<svg_xmlns=%22http://www.w3.org/2000/svg%22_width=%22180%22_height=%22180%22><filter_id=%22n%22><feTurbulence_type=%22fractalNoise%22_baseFrequency=%220.85%22_numOctaves=%222%22_stitchTiles=%22stitch%22/><feColorMatrix_type=%22saturate%22_values=%220%22/></filter><rect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%220.5%22/></svg>')] opacity-35 mix-blend-overlay pointer-events-none" />
            <div className="vignette absolute inset-0 z-42 pointer-events-none bg-[radial-gradient(120%_100%_at_50%_45%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />

          </div>
        </div>

        <p className="text-center text-[#ecdcaf]/35 font-mono text-[11px] tracking-[0.12em] uppercase mt-3">
          Tangy Sessions · Bansilalpet Stepwell · Hyderabad
        </p>
      </div>

    </section>
  );
};
