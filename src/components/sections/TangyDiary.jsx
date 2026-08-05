import { useEffect, useRef, useState, useCallback } from 'react';
import { diaryEntries } from '../../data/mockData';

/*
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║  TANGY DIARY — Strict Scroll-Driven State Machine                         ║
  ║                                                                           ║
  ║  State Flow:                                                              ║
  ║  [-1] CLOSED_COVER   : Hardcover closed in viewport                       ║
  ║  [ 0] OPENING_COVER  : Cover swings open -> Flyleaf + Intro               ║
  ║  [ 1] SPREAD_1       : Entry #001 (Bansilalpet Stepwell)                  ║
  ║  [ 2] SPREAD_2       : Entry #002 (Monsoon Acoustic Sessions)             ║
  ║  [ 3] SPREAD_3       : Entry #003 (Behind the Microphones)                ║
  ║  [ 4] FINAL_PAGE     : "The story doesn't end here" + Read More CTA       ║
  ║                                                                           ║
  ║  Pinning & Scroll Lock Contract:                                          ║
  ║  • While pinned (-1 <= state <= 4): all wheel/touch events are intercepted  ║
  ║    with e.preventDefault().                                               ║
  ║  • Scroll down advances state +1; scroll up reverses state -1.            ║
  ║  • Scroll down past state 4 -> UNPIN & smooth scroll to next section.     ║
  ║  • Scroll up past state -1 -> UNPIN & smooth scroll to previous section.  ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
*/

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap';

const SVG_DEFS = `<svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true"><defs>
  <symbol id="dts-clip" viewBox="0 0 40 90"><path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#b9b9b9" stroke-width="4" stroke-linecap="round"/></symbol>
  <symbol id="dts-wave" viewBox="0 0 120 30"><path d="M0,15 Q7,2 14,15 T28,15 T42,15 T56,15 T70,15 T84,15 T98,15 T112,15 T120,15" fill="none" stroke="#3a2416" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="dts-flower" viewBox="0 0 80 100"><g fill="none" stroke="#7a5236" stroke-width="1.3"><line x1="40" y1="95" x2="40" y2="45"/><path d="M40,45 Q30,60 25,80"/><path d="M40,55 Q50,68 55,84"/><g fill="#a33828" opacity="0.55" stroke="#7a5236"><ellipse cx="40" cy="20" rx="9" ry="16"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/></g><circle cx="40" cy="20" r="5" fill="#C8A24A" stroke="none"/></g></symbol>
</defs></svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   CSS
───────────────────────────────────────────────────────────────────────────── */
const DIARY_CSS = `
.dts-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(90,58,42,.55), transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(123,30,30,.28), transparent 55%),
    linear-gradient(155deg, #1c130c 0%, #120c07 55%, #0c0805 100%);
  user-select: none;
}
.dts-container::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .45;
  background:
    repeating-linear-gradient(92deg, rgba(0,0,0,.12) 0 2px, transparent 2px 40px),
    repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 80px);
}

/* ─ Book Stage ─ */
#dts-stage {
  position: relative;
  perspective: 2400px;
  perspective-origin: 50% 46%;
  z-index: 10;
}
#dts-book {
  position: relative;
  width: min(880px, 88vw);
  height: min(570px, 68vh);
  transform-style: preserve-3d;
}

/* Leather base container */
.dts-base {
  position: absolute; inset: 0; border-radius: 8px; z-index: 0;
  background: linear-gradient(165deg, #6b3f2b, #5A3A2A 40%, #3d2216 85%);
  box-shadow:
    inset 0 0 50px rgba(0,0,0,.6),
    0 60px 80px rgba(0,0,0,.85),
    0 20px 40px rgba(0,0,0,.65);
}

/* Static Left Page Pane */
.dts-left-pane {
  position: absolute;
  top: 0; left: 0;
  width: 50%; height: 100%;
  z-index: 5;
  overflow: hidden;
  border-radius: 4px 0 0 4px;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(255,255,255,.18), transparent 44%),
    linear-gradient(180deg, #EFE5C0, #E2D09B 65%, #D8C895);
  box-shadow: inset -15px 0 20px -10px rgba(0,0,0,.25), inset 0 0 3px rgba(0,0,0,.2);
  padding: 20px 16px 20px 20px;
  transition: opacity 0.22s ease;
}
.dts-left-pane.fading { opacity: 0; }

/* Right Leaf Stack */
.dts-leaf {
  position: absolute;
  top: 0; left: 50%; width: 50%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: 0% 50%;
  z-index: 10;
  border-radius: 0 4px 4px 0;
}
.dts-leaf.flipped { transform: rotateY(-180deg); }

/* Full-width Leather Cover */
.dts-cover {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  z-index: 60;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0,0,0,.7);
}
.dts-cover.flipped { transform: rotateY(-180deg); }

/* Page Faces */
.dts-face {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
.dts-face-front { transform: rotateY(0deg); }
.dts-face-back  { transform: rotateY(180deg); }

/* Page Surface */
.dts-page {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  padding: 20px 18px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.22), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
  box-shadow: inset 15px 0 20px -10px rgba(0,0,0,.22), inset 0 0 3px rgba(0,0,0,.28);
}
.dts-page.lined {
  background-image:
    repeating-linear-gradient(180deg, transparent 0 26px, rgba(90,58,42,.14) 26px 27px),
    radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.22), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
}

/* Outside Leather Cover */
.dts-leather {
  width: 100%; height: 100%;
  background: linear-gradient(165deg, #6b3f2b, #5A3A2A 40%, #3d2216 85%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #F4EAC9; position: relative;
  box-shadow: inset 0 0 70px rgba(0,0,0,.6);
}
.dts-leather::before {
  content:""; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(170deg,rgba(255,255,255,.04) 0 1px,transparent 1px 8px);
}

/* Inside Flyleaf */
.dts-flyleaf {
  width: 100%; height: 100%;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(255,255,255,.18), transparent 44%),
    linear-gradient(180deg, #EFE5C0, #E2D09B 65%, #D8C895);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 10px; padding: 20px;
}

/* Right Stack Edge */
.dts-edge {
  position: absolute; right: -8px; top: 2.5%; height: 95%; width: 8px;
  background: repeating-linear-gradient(0deg, #d8c48f 0 2px, #c2a86e 2px 4px);
  border-radius: 0 4px 4px 0;
  box-shadow: 3px 0 8px rgba(0,0,0,.35);
  z-index: 3;
}
.dts-leaf-edge {
  position: absolute; top: 2%; right: -5px; width: 5px; height: 96%;
  background: repeating-linear-gradient(0deg, #d8c48f 0 2px, #c2a86e 2px 4px);
  border-radius: 0 2px 2px 0;
  box-shadow: 2px 0 5px rgba(0,0,0,.28);
  z-index: 4;
  backface-visibility: hidden;
}

/* Central Leather Spine */
.dts-spine {
  position: absolute; left: calc(50% - 15px); top: 0; bottom: 0; width: 30px;
  background: linear-gradient(90deg, rgba(0,0,0,.1), rgba(0,0,0,.6) 45%, rgba(0,0,0,.6) 55%, rgba(0,0,0,.1));
  z-index: 80; pointer-events: none;
}

/* Book Shadow */
.dts-shadow {
  position: absolute; left: 50%; bottom: -36px; width: 84%; height: 56px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(0,0,0,.65), transparent 70%);
  filter: blur(10px); z-index: 1;
}

/* Animations */
@keyframes dts-flip-fwd {
  0%   { transform: rotateY(0deg); box-shadow: 12px 2px 25px rgba(0,0,0,.38); }
  40%  { transform: rotateY(-90deg); box-shadow: 0 0 60px rgba(0,0,0,.6); }
  100% { transform: rotateY(-180deg); box-shadow: -12px 2px 25px rgba(0,0,0,.32); }
}
@keyframes dts-flip-bwd {
  0%   { transform: rotateY(-180deg); box-shadow: -12px 2px 25px rgba(0,0,0,.32); }
  40%  { transform: rotateY(-90deg); box-shadow: 0 0 60px rgba(0,0,0,.6); }
  100% { transform: rotateY(0deg); box-shadow: 12px 2px 25px rgba(0,0,0,.38); }
}
.dts-anim-fwd { animation: dts-flip-fwd 850ms cubic-bezier(0.645,0.045,0.355,1) forwards; }
.dts-anim-bwd { animation: dts-flip-bwd 850ms cubic-bezier(0.645,0.045,0.355,1) forwards; }

@keyframes dts-cover-open {
  0%   { transform: rotateY(0deg); }
  40%  { transform: rotateY(-90deg); }
  100% { transform: rotateY(-180deg); }
}
@keyframes dts-cover-close {
  0%   { transform: rotateY(-180deg); }
  40%  { transform: rotateY(-90deg); }
  100% { transform: rotateY(0deg); }
}
.dts-anim-cover-open  { animation: dts-cover-open  950ms cubic-bezier(0.645,0.045,0.355,1) forwards; }
.dts-anim-cover-close { animation: dts-cover-close 950ms cubic-bezier(0.645,0.045,0.355,1) forwards; }

/* Scrapbook Elements */
.dts-coffee {
  position: absolute; border-radius: 50%; pointer-events: none; mix-blend-mode: multiply; opacity: .65;
  background:
    radial-gradient(circle, transparent 52%, rgba(90,58,42,.30) 55%, rgba(90,58,42,.12) 62%, transparent 66%),
    radial-gradient(circle, transparent 36%, rgba(90,58,42,.16) 40%, transparent 46%);
}
.dts-tape {
  position: absolute;
  background:
    repeating-linear-gradient(115deg,rgba(255,255,255,.14) 0 2px,transparent 2px 6px),
    linear-gradient(180deg,rgba(200,162,74,.85),rgba(168,132,54,.85));
  box-shadow: 0 3px 5px rgba(0,0,0,.28); opacity: .9; z-index: 4;
}
.dts-torn {
  background: #e6d5a8;
  clip-path: polygon(0% 3%,6% 0%,13% 4%,21% 1%,29% 5%,38% 0%,47% 4%,56% 1%,65% 5%,74% 0%,83% 4%,92% 1%,100% 3%,100% 96%,93% 100%,85% 95%,76% 100%,67% 96%,58% 100%,49% 95%,40% 100%,31% 96%,22% 100%,13% 95%,6% 99%,0% 96%);
  padding: 9px 12px 14px; box-shadow: 0 5px 12px rgba(18,13,9,.25);
}
.dts-ticket {
  background: linear-gradient(155deg,#b8895f,#8a5f3a);
  color: #F4EAC9; padding: 8px 13px; border-radius: 2px;
  font-family: 'Special Elite', monospace; font-size: 8.5px; line-height: 1.5;
  box-shadow: 0 8px 14px rgba(18,13,9,.32); position: relative;
}
.dts-ticket::before,.dts-ticket::after {
  content: ""; position: absolute; top: 50%; width: 10px; height: 10px;
  background: #e6d5a8; border-radius: 50%; transform: translateY(-50%);
}
.dts-ticket::before{left:-5px;}.dts-ticket::after{right:-5px;}

/* Controls & Badges */
.dts-dots {
  position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 20;
}
.dts-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(200,162,74,.3); border: 1px solid rgba(200,162,74,.5);
  transition: background .3s, transform .3s;
}
.dts-dot.active { background: #C8A24A; transform: scale(1.35); }

.dts-hint {
  position: absolute; bottom: 42px; left: 50%; transform: translateX(-50%);
  font-family: 'Special Elite', monospace; font-size: 10px; letter-spacing: .24em;
  text-transform: uppercase; color: #C8A24A; opacity: 0;
  transition: opacity .6s ease; pointer-events: none; white-space: nowrap; z-index: 30;
}
.dts-hint.show { opacity: .85; animation: dts-pulse 2.2s ease-in-out infinite; }
@keyframes dts-pulse { 0%,100%{opacity:.4;} 50%{opacity:1;} }

.dts-topbar {
  position: absolute; top: 16px; left: 18px; right: 18px;
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 8px; z-index: 30;
}

@media (max-width:700px) {
  #dts-book { height: min(440px, 60vh); }
  .dts-page, .dts-left-pane { padding: 12px 10px; }
}
`;

const cream   = '#F4EAC9';
const darkInk = '#1E1A17';
const rust    = '#A33828';
const gold    = '#C8A24A';
const inkSoft = '#6b4a34';
const F = {
  elite:  { fontFamily: "'Special Elite', monospace" },
  caveat: { fontFamily: "'Caveat', cursive", fontWeight: 600 },
  serif:  { fontFamily: "'Old Standard TT', serif" },
  bebas:  { fontFamily: "'Bebas Neue', sans-serif" },
  mono:   { fontFamily: "'Courier Prime', monospace" },
};

const Coffee = ({ style }) => <div className="dts-coffee" style={style} />;
const Tape   = ({ style }) => <div className="dts-tape" style={style} />;

const Polaroid = ({ src, alt, caption, style }) => (
  <figure style={{ background:'#fbf7ee', padding:'6px 6px 20px', position:'relative',
    boxShadow:'0 10px 20px rgba(18,13,9,.42)', margin:0, flexShrink:0, ...style }}>
    <img src={src} alt={alt} style={{ display:'block', width:'100%', aspectRatio:'4/3',
      objectFit:'cover', filter:'grayscale(1) sepia(0.28) contrast(1.18)',
      border:`1px solid ${darkInk}` }} />
    {caption && (
      <figcaption style={{ position:'absolute', bottom:5, left:0, right:0,
        textAlign:'center', ...F.caveat, fontSize:10, color:'#4a3016' }}>{caption}</figcaption>
    )}
  </figure>
);

const StampRing = ({ top, bottom, size = 78 }) => (
  <svg viewBox="0 0 120 120" style={{ width:size, height:size, color:rust, mixBlendMode:'multiply' }}>
    <defs>
      <path id="dts-sr-t" d="M14,60 a46,46 0 1,1 92,0" />
      <path id="dts-sr-b" d="M106,60 a46,46 0 1,1 -92,0" />
    </defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <text fontSize="9" letterSpacing="2" fill="currentColor">
      <textPath href="#dts-sr-t" startOffset="50%" textAnchor="middle">{top}</textPath>
    </text>
    <text fontSize="8" letterSpacing="2.2" fill="currentColor">
      <textPath href="#dts-sr-b" startOffset="50%" textAnchor="middle">{bottom}</textPath>
    </text>
  </svg>
);

const SectionHead = ({ children, style }) => (
  <div style={{ ...F.elite, fontSize:10, letterSpacing:'.09em', textTransform:'uppercase',
    color:darkInk, borderBottom:`1px solid ${inkSoft}`, display:'inline-block',
    paddingBottom:2, marginBottom:7, ...style }}>{children}</div>
);

const Label = ({ children }) => (
  <div style={{ ...F.elite, fontSize:8.5, letterSpacing:'.07em', textTransform:'uppercase',
    color:inkSoft, background:'#e6d5a8', border:`1px dashed ${gold}`,
    padding:'3px 7px', display:'inline-block' }}>{children}</div>
);

const SoundLog = ({ lines, status }) => (
  <div style={{ background:'#e6d5a8', padding:'7px 9px', border:`1px solid ${darkInk}`,
    ...F.mono, fontSize:8.5, color:darkInk, display:'flex', flexDirection:'column', gap:2 }}>
    <div style={{ fontWeight:700, color:rust, borderBottom:'1px solid rgba(30,26,23,.3)',
      paddingBottom:2, textTransform:'uppercase', marginBottom:2 }}>Sound Check Log</div>
    {lines.map((l,i) => <div key={i}>{l}</div>)}
    <span style={{ border:`1px solid ${rust}`, color:rust, fontWeight:700,
      padding:'1px 5px', alignSelf:'flex-start', marginTop:3 }}>{status}</span>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   LEFT SPREAD CONTENT (Static Pane)
───────────────────────────────────────────────────────────────────────────── */
const LeftContent = ({ page, entries }) => {
  const [d1, d2, d3] = entries;

  if (page === -1) return null;

  if (page === 0) return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', textAlign:'center', gap:10, position:'relative' }}>
      <Coffee style={{ width:85, height:85, bottom:10, right:10 }} />
      <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(16px,2vw,22px)', color:darkInk }}>Field Diary</div>
      <Label>Vol. I · 2016 — 2025</Label>
      <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" />
      <div className="dts-torn" style={{ maxWidth:180, transform:'rotate(-1.5deg)', marginTop:10 }}>
        <p style={{ ...F.caveat, fontSize:14, color:'#3a2416', margin:0, lineHeight:1.35 }}>
          Property of the Archive.<br />Handle with care.
        </p>
      </div>
      <div style={{ ...F.elite, fontSize:9, letterSpacing:'.12em', textTransform:'uppercase',
        color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, marginTop:4, opacity:.85 }}>
        Memories, not merely recorded
      </div>
    </div>
  );

  if (page === 1) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between',
      height:'100%', position:'relative', overflow:'hidden' }}>
      <Coffee style={{ width:64, height:64, bottom:14, left:8, opacity:.42 }} />
      <div>
        <svg style={{ position:'absolute', top:-8, right:30, width:15, color:'#b9b9b9' }}><use href="#dts-clip" /></svg>
        <div style={{ display:'flex', justifyContent:'space-between', ...F.elite, fontSize:9,
          letterSpacing:'.1em', textTransform:'uppercase', color:inkSoft, marginBottom:5 }}>
          <span>Entry #001</span>
          <span style={{ color:rust, fontWeight:'bold' }}>{d1?.date}</span>
        </div>
        <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(15px,1.8vw,19px)',
          lineHeight:1.15, marginBottom:5, color:darkInk }}>
          Why We Play Inside<br />a Stepwell
        </div>
        <div style={{ ...F.elite, fontSize:8, color:rust, textTransform:'uppercase',
          letterSpacing:'.05em', marginBottom:6 }}>{d1?.location}</div>
        <p style={{ ...F.caveat, fontSize:13.5, lineHeight:1.42, color:'#3a2416', margin:0 }}>
          {d1?.content}
        </p>
      </div>
      <div style={{ position:'relative', width:105, alignSelf:'center' }}>
        <Tape style={{ position:'absolute', top:-9, left:20, width:36, height:13, transform:'rotate(-4deg)' }} />
        <Polaroid src={d1?.image} alt={d1?.title} caption="BANSILALPET 14.10.24" />
      </div>
      <Label>TS-2024-14-10-001</Label>
    </div>
  );

  if (page === 2) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between',
      height:'100%', position:'relative', overflow:'hidden' }}>
      <Coffee style={{ width:60, height:60, top:8, left:6, opacity:.4 }} />
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', ...F.elite, fontSize:9,
          letterSpacing:'.1em', textTransform:'uppercase', color:inkSoft, marginBottom:5 }}>
          <span>Entry #002</span>
          <span style={{ color:rust, fontWeight:'bold' }}>{d2?.date}</span>
        </div>
        <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(15px,1.8vw,19px)',
          lineHeight:1.15, marginBottom:5, color:darkInk }}>
          Monsoon Acoustic<br />Sessions
        </div>
        <div style={{ ...F.elite, fontSize:8, color:rust, textTransform:'uppercase',
          letterSpacing:'.05em', marginBottom:6 }}>{d2?.location}</div>
        <p style={{ ...F.caveat, fontSize:13.5, lineHeight:1.42, color:'#3a2416', margin:0 }}>
          {d2?.content}
        </p>
      </div>
      <div style={{ position:'relative', width:100, alignSelf:'flex-end' }}>
        <Tape style={{ position:'absolute', top:-9, left:24, width:34, height:13, transform:'rotate(-3deg)' }} />
        <Polaroid src={d2?.image} alt={d2?.title} caption="TARAMATI 21.12.24" />
      </div>
      <div className="dts-torn" style={{ maxWidth:155, transform:'rotate(-1deg)' }}>
        <p style={{ ...F.caveat, fontSize:13, color:'#3a2416', margin:0 }}>
          300 people. No phones.<br />Just violin ragas.
        </p>
      </div>
    </div>
  );

  if (page === 3) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-between',
      height:'100%', position:'relative', overflow:'hidden' }}>
      <Coffee style={{ width:68, height:68, top:8, left:6, opacity:.43 }} />
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', ...F.elite, fontSize:9,
          letterSpacing:'.1em', textTransform:'uppercase', color:inkSoft, marginBottom:5 }}>
          <span>Entry #003</span>
          <span style={{ color:rust, fontWeight:'bold' }}>{d3?.date}</span>
        </div>
        <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(15px,1.8vw,19px)',
          lineHeight:1.15, marginBottom:5, color:darkInk }}>
          Behind the<br />Microphones
        </div>
        <div style={{ ...F.elite, fontSize:8, color:rust, textTransform:'uppercase',
          letterSpacing:'.05em', marginBottom:6 }}>{d3?.location} · 03:00 AM</div>
        <p style={{ ...F.caveat, fontSize:13.5, lineHeight:1.42, color:'#3a2416', margin:0 }}>
          {d3?.content}
        </p>
      </div>
      <div style={{ position:'relative', width:110, alignSelf:'center' }}>
        <Tape style={{ position:'absolute', top:-9, left:26, width:36, height:13, transform:'rotate(-4deg)' }} />
        <Polaroid src={d3?.image} alt={d3?.title} caption="OLD CITY HAVELI 05.01.25" />
      </div>
      <div className="dts-torn" style={{ maxWidth:158, transform:'rotate(-1.2deg)' }}>
        <p style={{ ...F.caveat, fontSize:13, color:'#3a2416', margin:0 }}>
          "The rain almost ruined the set.<br />Then it became the set."
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', textAlign:'center', gap:10 }}>
      <StampRing top="END OF VOLUME I" bottom="MORE SOON ★" size={82} />
      <p style={{ ...F.caveat, fontSize:16, color:'#3a2416', maxWidth:180, lineHeight:1.35 }}>
        "Every archive has another chapter waiting to be written."
      </p>
      <Label>Tangy Sessions · Hyderabad Archive</Label>
      <svg style={{ width:95, marginTop:4, opacity:.65 }}><use href="#dts-wave" /></svg>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   RIGHT SPREAD CONTENT
───────────────────────────────────────────────────────────────────────────── */
const RightSpread1 = () => (
  <div className="dts-page" style={{ display:'flex', flexDirection:'column',
    justifyContent:'space-between', height:'100%', position:'relative' }}>
    <svg style={{ position:'absolute', top:2, right:8, width:28 }}><use href="#dts-flower" /></svg>
    <div>
      <SectionHead>Sound Check Notes</SectionHead>
      <div style={{ ...F.mono, fontSize:9.5, lineHeight:1.85, color:'#3a2416', marginTop:4 }}>
        <b>Mic:</b> Ribbon R44<br />
        <b>Preamp:</b> Tube U47<br />
        <b>Reel:</b> Studer A80<br />
        <b>Speed:</b> 15 IPS
      </div>
      <div style={{ ...F.elite, fontSize:10, letterSpacing:'.1em', color:rust,
        border:`2px solid ${rust}`, padding:'3px 8px', transform:'rotate(-4deg)',
        opacity:.85, display:'inline-block', marginTop:8 }}>Unreleased</div>
    </div>
    <div className="dts-torn" style={{ transform:'rotate(2deg)' }}>
      <SectionHead style={{ fontSize:8.5, marginBottom:4 }}>Setlist</SectionHead>
      <ol style={{ ...F.caveat, fontSize:13, color:'#3a2416', margin:0, paddingLeft:14, lineHeight:1.5 }}>
        <li>Stepwell Echoes</li>
        <li>Mast Qalandar (Acoustic Raga)</li>
        <li>Sufi Drone Improvisation</li>
        <li>Midnight Jam w/ Tanpura</li>
      </ol>
    </div>
    <div className="dts-ticket" style={{ maxWidth:150 }}>
      <b style={{ ...F.bebas, fontSize:13, letterSpacing:'.05em' }}>ARTIST PASS</b><br />
      Backstage Access · 14/10/24
    </div>
    <p style={{ ...F.caveat, fontStyle:'italic', fontSize:13.5, lineHeight:1.4, color:'#3a2416', margin:0 }}>
      "The stepwell echoes before the crowd arrives."
      <span style={{ display:'block', ...F.elite, fontSize:8.5, textAlign:'right', color:inkSoft, marginTop:3 }}>— Tangy Archive</span>
    </p>
    <div style={{ textAlign:'center', ...F.elite, fontSize:9, letterSpacing:'.18em',
      textTransform:'uppercase', color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, opacity:.85 }}>
      Bansilalpet Stepwell · 2024
    </div>
  </div>
);

const RightSpread2 = () => (
  <div className="dts-page" style={{ display:'flex', flexDirection:'column',
    justifyContent:'space-between', height:'100%', position:'relative' }}>
    <svg style={{ position:'absolute', top:2, right:8, width:28 }}><use href="#dts-flower" /></svg>
    <div>
      <SectionHead>Notes</SectionHead>
      <p style={{ ...F.caveat, fontStyle:'italic', fontSize:14, lineHeight:1.4, color:'#3a2416', margin:0 }}>
        "Taramati was built so voice travels 2 miles without amplifiers."
      </p>
    </div>
    <div className="dts-ticket" style={{ maxWidth:150 }}>
      <b style={{ ...F.bebas, fontSize:12 }}>ARTIST PASS</b><br />
      Backstage Access · 21/12/24
    </div>
    <SoundLog
      lines={['MIC: SHURE SM7B | PREAMP: NEVE 1073','REEL: NAGRA IV-S | TAPE: TDK SA90']}
      status="LIVE ARCHIVE"
    />
    <div style={{ position:'relative', width:88, alignSelf:'flex-end' }}>
      <Tape style={{ position:'absolute', top:-8, left:18, width:32, height:13 }} />
      <Polaroid src="/media/gallery/tangy4.jpg" alt="Violin Solo" caption="Violin Setup" />
    </div>
    <div style={{ textAlign:'center', ...F.elite, fontSize:9, letterSpacing:'.18em',
      textTransform:'uppercase', color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, opacity:.85 }}>
      Monsoon Sessions · 2024
    </div>
  </div>
);

const RightSpread3 = () => (
  <div className="dts-page lined" style={{ display:'flex', flexDirection:'column',
    justifyContent:'space-between', height:'100%', position:'relative' }}>
    <svg style={{ position:'absolute', top:-8, left:52, width:15, color:'#b9b9b9' }}><use href="#dts-clip" /></svg>
    <div>
      <SectionHead>Archive Notes</SectionHead>
      <p style={{ ...F.caveat, fontStyle:'italic', fontSize:14, lineHeight:1.4, color:'#3a2416', margin:0 }}>
        "No plan. No setlist. Just the night deciding what to play."
      </p>
    </div>
    <SoundLog
      lines={['MIC: RIBBON R44 | PREAMP: TUBE U47','REEL: STUDER A80 | TAPE: AMPEX 456']}
      status="UNRELEASED"
    />
    <div style={{ position:'relative', width:88, alignSelf:'flex-end' }}>
      <Polaroid src="/media/gallery/tangy2.jpg" alt="Setup" caption="Late night setup" />
    </div>
    <svg style={{ width:88, opacity:.65 }}><use href="#dts-wave" /></svg>
    <div style={{ textAlign:'center', ...F.elite, fontSize:9, letterSpacing:'.18em',
      textTransform:'uppercase', color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, opacity:.85 }}>
      Old City Haveli · Jan 2025
    </div>
  </div>
);

const RightFinal = () => (
  <div className="dts-page" style={{ display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', textAlign:'center',
    gap:14, height:'100%', padding:20 }}>
    <div style={{ ...F.elite, fontSize:9.5, letterSpacing:'.28em', textTransform:'uppercase',
      color:inkSoft, opacity:.85 }}>
      TANGY SESSIONS // FIELD DIARY
    </div>
    <div style={{ ...F.bebas, fontSize:'clamp(28px,4vw,44px)', color:darkInk,
      lineHeight:1.05, letterSpacing:'.02em' }}>
      The Story Doesn't<br />End Here
    </div>
    <p style={{ ...F.caveat, fontSize:15.5, color:'#3a2416', maxWidth:220, lineHeight:1.35 }}>
      Every memory in this journal is just a glimpse of what happens live.
    </p>
    <a href="/blogs" style={{ ...F.elite, fontSize:11, letterSpacing:'.22em', textTransform:'uppercase',
      color:darkInk, background:gold, border:`2px solid ${darkInk}`,
      padding:'11px 24px', textDecoration:'none', boxShadow:`4px 4px 0 ${darkInk}`,
      display:'inline-block', marginTop:4, transition:'transform 0.15s ease' }}>
      Read the Complete Tangy Diary →
    </a>
    <div style={{ ...F.elite, fontSize:9, color:inkSoft, opacity:.75, marginTop:4 }}>
      ↓ Scroll once more to continue homepage
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT — STRICT SCROLL-DRIVEN STATE MACHINE
───────────────────────────────────────────────────────────────────────────── */
const TOTAL_PAGES = 4; // States: -1 (Closed), 0 (Open), 1 (Sp1), 2 (Sp2), 3 (Sp3), 4 (Final/ReadMore)

export const TangyDiary = () => {
  const containerRef = useRef(null);
  const bookRef      = useRef(null);
  
  const [state, setState]             = useState(-1); // -1 = closed cover
  const [displayPage, setDisplayPage] = useState(-1);
  const [isPinned, setIsPinned]       = useState(false);

  const stateRef        = useRef(-1);
  const isPinnedRef     = useRef(false);
  const isAnimatingRef  = useRef(false);
  const lastScrollTime  = useRef(0);
  const touchStartY     = useRef(null);

  /* Inject Fonts & CSS */
  useEffect(() => {
    if (!document.getElementById('dts-fonts')) {
      const l = document.createElement('link');
      l.id = 'dts-fonts'; l.rel = 'stylesheet'; l.href = FONT_URL;
      document.head.appendChild(l);
    }
    if (!document.getElementById('dts-styles')) {
      const s = document.createElement('style');
      s.id = 'dts-styles'; s.textContent = DIARY_CSS;
      document.head.appendChild(s);
    }
  }, []);

  /* Audio Effect */
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const sz = ctx.sampleRate * 0.28;
      const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / sz);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 1900; flt.Q.value = 0.65;
      const gain = ctx.createGain(); gain.gain.value = 0.09;
      src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch (_) { /* silent */ }
  }, []);

  /* Flip Helper */
  const flipEl = useCallback((el, forward) => new Promise(resolve => {
    const cls = forward ? 'dts-anim-fwd' : 'dts-anim-bwd';
    el.classList.add(cls);
    const done = () => { el.removeEventListener('animationend', done); el.classList.remove(cls); resolve(); };
    el.addEventListener('animationend', done);
  }), []);

  const getLeaves = useCallback(() => {
    if (!bookRef.current) return [];
    return Array.from(bookRef.current.querySelectorAll('.dts-leaf'))
      .map(el => ({ el, idx: parseInt(el.dataset.idx, 10) }))
      .sort((a,b) => a.idx - b.idx);
  }, []);

  const updateLeftPane = useCallback((newPage) => {
    const pane = bookRef.current?.querySelector('.dts-left-pane');
    if (!pane) { setDisplayPage(newPage); return; }
    pane.classList.add('fading');
    setTimeout(() => {
      setDisplayPage(newPage);
      pane.classList.remove('fading');
    }, 180);
  }, []);

  /* Transition State Machine Step */
  const transitionToState = useCallback(async (targetState) => {
    if (isAnimatingRef.current) return;
    const current = stateRef.current;
    if (targetState === current) return;

    isAnimatingRef.current = true;
    const cover  = bookRef.current?.querySelector('.dts-cover');
    const leaves = getLeaves();

    if (targetState > current) {
      // Step forward
      playSound();
      if (current === -1) {
        // Open cover
        if (cover) {
          await new Promise(resolve => {
            cover.classList.add('dts-anim-cover-open');
            const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-cover-open'); resolve(); };
            cover.addEventListener('animationend', done);
          });
          cover.classList.add('flipped');
        }
        updateLeftPane(0);
      } else {
        const leafIndex = current;
        const leaf = leaves[leafIndex];
        if (leaf) {
          await flipEl(leaf.el, true);
          leaf.el.classList.add('flipped');
          updateLeftPane(leafIndex + 1);
        }
      }
    } else {
      // Step backward
      playSound();
      if (targetState === -1) {
        // Close cover
        if (cover) {
          cover.classList.remove('flipped');
          await new Promise(resolve => {
            cover.classList.add('dts-anim-cover-close');
            const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-cover-close'); resolve(); };
            cover.addEventListener('animationend', done);
          });
        }
        updateLeftPane(-1);
      } else {
        const leafIndex = targetState;
        const leaf = leaves[leafIndex];
        if (leaf) {
          leaf.el.classList.remove('flipped');
          await flipEl(leaf.el, false);
          updateLeftPane(leafIndex);
        }
      }
    }

    stateRef.current = targetState;
    setState(targetState);
    isAnimatingRef.current = false;
  }, [getLeaves, flipEl, playSound, updateLeftPane]);

  /* Z-Index Update */
  useEffect(() => {
    const leaves = getLeaves();
    const n = leaves.length;
    leaves.forEach(({ el, idx }) => {
      el.style.zIndex = el.classList.contains('flipped') ? (n + idx + 5) : (n - idx + 5);
    });
  }, [state, getLeaves]);

  /* Unpin helper */
  const unpinSection = useCallback((direction) => {
    isPinnedRef.current = false;
    setIsPinned(false);
    
    // Smooth scroll page past the section
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const scrollAmount = direction === 'down' ? rect.height + 20 : -(rect.height + 20);
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  /* Process Step Trigger */
  const handleStepDelta = useCallback((delta) => {
    const now = Date.now();
    if (isAnimatingRef.current || now - lastScrollTime.current < 750) return;
    
    if (delta > 0) {
      // Scroll Down
      if (stateRef.current < TOTAL_PAGES) {
        lastScrollTime.current = now;
        transitionToState(stateRef.current + 1);
      } else if (stateRef.current === TOTAL_PAGES) {
        // Scroll past final page -> Unpin Down
        lastScrollTime.current = now;
        unpinSection('down');
      }
    } else if (delta < 0) {
      // Scroll Up
      if (stateRef.current > -1) {
        lastScrollTime.current = now;
        transitionToState(stateRef.current - 1);
      } else if (stateRef.current === -1) {
        // Scroll up past closed cover -> Unpin Up
        lastScrollTime.current = now;
        unpinSection('up');
      }
    }
  }, [transitionToState, unpinSection]);

  /* Window Scroll & Intersection Listener to lock section */
  useEffect(() => {
    const onWindowScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const inFocus = rect.top <= 80 && rect.bottom >= window.innerHeight - 80;

      if (inFocus && !isPinnedRef.current) {
        // Lock inside viewport!
        isPinnedRef.current = true;
        setIsPinned(true);
        // Align viewport exactly to container top
        const containerTop = window.scrollY + rect.top;
        window.scrollTo({ top: containerTop, behavior: 'instant' });
      }
    };

    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, []);

  /* Event Capturing Listener when Pinned */
  useEffect(() => {
    if (!isPinned) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleStepDelta(e.deltaY);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (touchStartY.current === null) return;
      e.preventDefault();
      e.stopPropagation();
      const deltaY = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(deltaY) > 35) {
        handleStepDelta(deltaY);
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const onKeyDown = (e) => {
      if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        e.preventDefault();
        handleStepDelta(100);
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        e.preventDefault();
        handleStepDelta(-100);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPinned, handleStepDelta]);

  const entries = diaryEntries;
  const dots    = Array.from({ length: TOTAL_PAGES + 1 });

  return (
    <section ref={containerRef} id="diary" className="dts-container">
      <div dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />

      {/* Top Bar */}
      <div className="dts-topbar">
        <div>
          <div style={{ ...F.elite, fontSize:10, letterSpacing:'.26em', textTransform:'uppercase', color:gold, opacity:.85 }}>
            TANGY SESSIONS // FIELD DIARY ARCHIVE
          </div>
          <p style={{ ...F.serif, fontStyle:'italic', fontSize:11, color:'rgba(244,234,201,.82)', margin:'2px 0 0' }}>
            "Some stories deserve more than a caption."
          </p>
        </div>
        <a href="/blogs" style={{ ...F.elite, fontSize:10, letterSpacing:'.2em', textTransform:'uppercase',
          color:darkInk, background:gold, border:`2px solid ${darkInk}`, padding:'6px 14px',
          textDecoration:'none', boxShadow:`3px 3px 0 ${darkInk}`, display:'inline-block', whiteSpace:'nowrap' }}>
          TANGY DIARY → READ MORE
        </a>
      </div>

      {/* Stage */}
      <div id="dts-stage">
        <div className="dts-shadow" />

        <div id="dts-book" ref={bookRef}>
          {/* Base */}
          <div className="dts-base" />

          {/* Right edge stack */}
          <div className="dts-edge" />

          {/* Left Static Pane */}
          <div className="dts-left-pane">
            <LeftContent page={displayPage} entries={entries} />
          </div>

          {/* Leather Cover (State -1) */}
          <div className="dts-cover" style={{ zIndex: 60 }}>
            <div className="dts-face dts-face-front">
              <div className="dts-leather">
                <div style={{ position:'absolute', top:5, left:5, width:20, height:20,
                  borderTop:'2px solid rgba(255,255,255,.14)', borderLeft:'2px solid rgba(255,255,255,.14)' }} />
                <div style={{ position:'absolute', bottom:5, right:5, width:20, height:20,
                  borderBottom:'2px solid rgba(255,255,255,.14)', borderRight:'2px solid rgba(255,255,255,.14)' }} />
                <div style={{ ...F.bebas, fontSize:'clamp(40px,5.5vw,62px)', letterSpacing:'.02em',
                  WebkitTextStroke:`1.5px ${darkInk}`, textShadow:`3px 3px 0 ${darkInk}`, lineHeight:1 }}>TANGY</div>
                <div style={{ background:darkInk, padding:'4px 16px', ...F.bebas,
                  letterSpacing:'.3em', fontSize:16, marginTop:6, transform:'rotate(-1deg)' }}>SESSIONS</div>
                <div style={{ marginTop:14, ...F.serif, fontStyle:'italic', fontSize:13, opacity:.88 }}>
                  Hyderabad · Field Diary · Since 2016
                </div>
                <svg viewBox="0 0 120 120" style={{ width:100, marginTop:18, opacity:.9, color:cream }}>
                  <defs>
                    <path id="dts-cv-t" d="M14,60 a46,46 0 1,1 92,0" />
                    <path id="dts-cv-b" d="M106,60 a46,46 0 1,1 -92,0" />
                  </defs>
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <text fontSize="9" letterSpacing="2" fill="currentColor"><textPath href="#dts-cv-t" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath></text>
                  <text fontSize="8" letterSpacing="2.2" fill="currentColor"><textPath href="#dts-cv-b" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath></text>
                </svg>
              </div>
            </div>
            <div className="dts-face dts-face-back">
              <div className="dts-flyleaf">
                <Coffee style={{ width:85, height:85, bottom:10, right:10 }} />
                <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(16px,2vw,22px)', color:darkInk }}>Field Diary</div>
                <Label>Vol. I · 2016 — 2025</Label>
                <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" />
                <div className="dts-torn" style={{ maxWidth:180, transform:'rotate(-1deg)', marginTop:10 }}>
                  <p style={{ ...F.caveat, fontSize:14, color:'#3a2416', margin:0, lineHeight:1.3 }}>
                    Property of the Archive.<br />Handle with care.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaf Stack */}
          {/* Leaf 0 (State 1) */}
          <div className="dts-leaf" data-idx="0" style={{ zIndex: 40 }}>
            <div className="dts-leaf-edge" />
            <div className="dts-face dts-face-front"><RightSpread1 /></div>
            <div className="dts-face dts-face-back">
              <div className="dts-page" style={{ display:'flex', alignItems:'center', justify: 'center' }}>
                <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4 }}>← turned page</div>
              </div>
            </div>
          </div>

          {/* Leaf 1 (State 2) */}
          <div className="dts-leaf" data-idx="1" style={{ zIndex: 30 }}>
            <div className="dts-leaf-edge" />
            <div className="dts-face dts-face-front"><RightSpread2 /></div>
            <div className="dts-face dts-face-back">
              <div className="dts-page" style={{ display:'flex', alignItems:'center', justify: 'center' }}>
                <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4 }}>← turned page</div>
              </div>
            </div>
          </div>

          {/* Leaf 2 (State 3) */}
          <div className="dts-leaf" data-idx="2" style={{ zIndex: 20 }}>
            <div className="dts-leaf-edge" />
            <div className="dts-face dts-face-front"><RightSpread3 /></div>
            <div className="dts-face dts-face-back">
              <div className="dts-page" style={{ display:'flex', alignItems:'center', justify: 'center' }}>
                <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4 }}>← turned page</div>
              </div>
            </div>
          </div>

          {/* Leaf 3 (State 4) */}
          <div className="dts-leaf" data-idx="3" style={{ zIndex: 10 }}>
            <div className="dts-leaf-edge" />
            <div className="dts-face dts-face-front"><RightFinal /></div>
            <div className="dts-face dts-face-back">
              <div className="dts-page" style={{ display:'flex', alignItems:'center', justify: 'center' }}>
                <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4 }}>← turned page</div>
              </div>
            </div>
          </div>

          {/* Spine */}
          <div className="dts-spine" />
        </div>
      </div>

      {/* Progress Dots */}
      <div className="dts-dots">
        {dots.map((_, i) => (
          <div key={i} className={`dts-dot${state + 1 >= i ? ' active' : ''}`} />
        ))}
      </div>

      {/* Counter */}
      {state >= 0 && (
        <div style={{ position:'absolute', bottom:40, right:20, ...F.elite, fontSize:9,
          letterSpacing:'.15em', color:'rgba(200,162,74,.75)' }}>
          {state + 1} / {TOTAL_PAGES + 1}
        </div>
      )}

      {/* Hint */}
      <div className={`dts-hint${state < TOTAL_PAGES ? ' show' : ''}`}>
        {state < 0 ? 'Scroll down to open diary ↓' : 'Scroll to turn the page ↓'}
      </div>
    </section>
  );
};
