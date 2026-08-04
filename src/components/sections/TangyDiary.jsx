import { useEffect, useRef, useState, useCallback } from 'react';
import { diaryEntries } from '../../data/mockData';

/*
  ╔══════════════════════════════════════════════════════════════════╗
  ║  TANGY DIARY — Fixed-layout scroll-driven page-flip              ║
  ║                                                                  ║
  ║  Layout contract:                                                ║
  ║  ┌────────────────────────────┬─────────────────────────────┐   ║
  ║  │  .dts-left-pane            │  .dts-right-stack           │   ║
  ║  │  (abs, left:0, w:50%)      │  (abs, left:50%, w:50%)     │   ║
  ║  │  React-state driven        │  Stacked leaves that flip    │   ║
  ║  │  static content            │  each 920ms animation        │   ║
  ║  └────────────────────────────┴─────────────────────────────┘   ║
  ║  The cover is full-width and uses transform-origin: 50% 50%     ║
  ╚══════════════════════════════════════════════════════════════════╝
*/

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap';

const SVG_DEFS = `<svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true"><defs>
  <symbol id="dts-clip" viewBox="0 0 40 90"><path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#b9b9b9" stroke-width="4" stroke-linecap="round"/></symbol>
  <symbol id="dts-wave" viewBox="0 0 120 30"><path d="M0,15 Q7,2 14,15 T28,15 T42,15 T56,15 T70,15 T84,15 T98,15 T112,15 T120,15" fill="none" stroke="#3a2416" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="dts-flower" viewBox="0 0 80 100"><g fill="none" stroke="#7a5236" stroke-width="1.3"><line x1="40" y1="95" x2="40" y2="45"/><path d="M40,45 Q30,60 25,80"/><path d="M40,55 Q50,68 55,84"/><g fill="#a33828" opacity="0.55" stroke="#7a5236"><ellipse cx="40" cy="20" rx="9" ry="16"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/></g><circle cx="40" cy="20" r="5" fill="#C8A24A" stroke="none"/></g></symbol>
</defs></svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   CSS (injected once into <head>)
───────────────────────────────────────────────────────────────────────────── */
const DIARY_CSS = `
/* ─ Outer scroll container & sticky pane ─ */
#dts-outer { position: relative; }
#dts-sticky {
  position: sticky; top: 0; left: 0;
  width: 100%; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 0%,  rgba(90,58,42,.5), transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(123,30,30,.22), transparent 55%),
    linear-gradient(155deg, #1c130c 0%, #120c07 55%, #0c0805 100%);
}
#dts-sticky::before {
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.45;
  background:
    repeating-linear-gradient(92deg,rgba(0,0,0,.12) 0 2px,transparent 2px 40px),
    repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 80px);
}

/* ─ Book stage ─ */
#dts-stage {
  position: relative;
  perspective: 2200px;
  perspective-origin: 50% 46%;
  z-index: 10;
}
#dts-book {
  position: relative;
  width:  min(860px, 88vw);
  height: min(560px, 68vh);
  transform-style: preserve-3d;
}

/* Dark leather base behind everything */
.dts-base {
  position: absolute; inset: 0; border-radius: 6px; z-index: 0;
  background: linear-gradient(180deg, #4a2a1c, #5A3A2A 8%, #5A3A2A 92%, #3d2216);
  box-shadow:
    inset 0 0 40px rgba(0,0,0,.5),
    0 55px 70px rgba(0,0,0,.8),
    0 18px 35px rgba(0,0,0,.6);
}

/* ─ THE LEFT STATIC PAGE PANE ─
   This is NOT a flipping element. It lives at left:0, width:50% always.
   Its content is swapped via React state.  */
.dts-left-pane {
  position: absolute;
  top: 0; left: 0;
  width: 50%; height: 100%;
  z-index: 5;
  overflow: hidden;
  border-radius: 2px 0 0 2px;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(255,255,255,.18), transparent 44%),
    linear-gradient(180deg, #EFE5C0, #E2D09B 65%, #D8C895);
  box-shadow: inset -2px 0 8px rgba(0,0,0,.18);
  padding: 18px 14px 18px 18px;
  /* fade transition between spreads */
  transition: opacity 0.25s ease;
}
.dts-left-pane.fading { opacity: 0; }

/* ─ THE RIGHT-SIDE LEAF STACK ─
   Each leaf sits at left:50%, width:50%.
   transform-origin: 0% 50% = the spine (left edge of right half).
   When rotateY(-180deg) the leaf swings to the left half of the book.  */
.dts-leaf {
  position: absolute;
  top: 0; left: 50%; width: 50%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: 0% 50%;
  z-index: 10;
}
.dts-leaf.flipped { transform: rotateY(-180deg); }

/* Cover is special: spans full width, rotates around its center (the spine) */
.dts-cover {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  z-index: 50;
  border-radius: 6px;
  overflow: hidden;
}
.dts-cover.flipped { transform: rotateY(-180deg); }

/* Page faces */
.dts-face {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
.dts-face-front { transform: rotateY(0deg); }
.dts-face-back  { transform: rotateY(180deg); }

/* Page surface (right-side pages) */
.dts-page {
  position: relative; width: 100%; height: 100%; overflow: hidden;
  padding: 18px 16px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.22), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
  box-shadow: inset 0 0 50px rgba(90,58,42,.28), inset 0 0 3px rgba(0,0,0,.3);
}
.dts-page.lined {
  background-image:
    repeating-linear-gradient(180deg, transparent 0 26px, rgba(90,58,42,.14) 26px 27px),
    radial-gradient(ellipse at 20% 0%, rgba(255,255,255,.22), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
}

/* Leather outside cover */
.dts-leather {
  width: 100%; height: 100%;
  background: linear-gradient(165deg, #6b3f2b, #5A3A2A 40%, #4a2a1c 85%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #F4EAC9; position: relative;
  box-shadow: inset 0 0 60px rgba(0,0,0,.5);
}
.dts-leather::before {
  content:""; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(170deg,rgba(255,255,255,.04) 0 1px,transparent 1px 8px);
}

/* Inside-cover flyleaf (back of cover) */
.dts-flyleaf {
  width: 100%; height: 100%;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(255,255,255,.18), transparent 44%),
    linear-gradient(180deg, #EFE5C0, #E2D09B 65%, #D8C895);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; gap: 10px; padding: 20px;
}

/* ─ Page edge stack (right side of book) ─ */
.dts-edge {
  position: absolute; right: -7px; top: 3%; height: 94%; width: 7px;
  background: repeating-linear-gradient(0deg, #d8c48f 0 2px, #c2a86e 2px 4px);
  border-radius: 0 3px 3px 0;
  box-shadow: 3px 0 7px rgba(0,0,0,.32);
  z-index: 3;
}
/* Edge on each leaf (right side) */
.dts-leaf-edge {
  position: absolute; top: 2%; right: -5px; width: 5px; height: 96%;
  background: repeating-linear-gradient(0deg, #d8c48f 0 2px, #c2a86e 2px 4px);
  border-radius: 0 2px 2px 0;
  box-shadow: 2px 0 5px rgba(0,0,0,.28);
  z-index: 4;
  backface-visibility: hidden;
}

/* ─ Spine shadow ─ */
.dts-spine {
  position: absolute; left: calc(50% - 14px); top: 0; bottom: 0; width: 28px;
  background: linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.52) 45%, rgba(0,0,0,.52) 55%, rgba(0,0,0,.06));
  z-index: 80; pointer-events: none;
}

/* ─ Shadow beneath the book ─ */
.dts-shadow {
  position: absolute; left: 50%; bottom: -34px; width: 82%; height: 52px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(0,0,0,.62), transparent 70%);
  filter: blur(9px); z-index: 1;
}

/* ─ Page flip animations ─ */
@keyframes dts-flip-fwd {
  0%   { transform: rotateY(0deg);
         box-shadow:  10px 2px 22px rgba(0,0,0,.38), 0 18px 35px rgba(0,0,0,.22); }
  35%  { transform: rotateY(-90deg);
         box-shadow:   0  0  55px rgba(0,0,0,.55); }
  100% { transform: rotateY(-180deg);
         box-shadow: -10px 2px 22px rgba(0,0,0,.32), 0 18px 35px rgba(0,0,0,.2); }
}
@keyframes dts-flip-bwd {
  0%   { transform: rotateY(-180deg);
         box-shadow: -10px 2px 22px rgba(0,0,0,.32); }
  35%  { transform: rotateY(-90deg);
         box-shadow:   0  0  55px rgba(0,0,0,.55); }
  100% { transform: rotateY(0deg);
         box-shadow:  10px 2px 22px rgba(0,0,0,.38); }
}
.dts-anim-fwd { animation: dts-flip-fwd 920ms cubic-bezier(0.645,0.045,0.355,1) forwards; }
.dts-anim-bwd { animation: dts-flip-bwd 920ms cubic-bezier(0.645,0.045,0.355,1) forwards; }

/* Cover flip (full-width, rotates around center) */
@keyframes dts-cover-open {
  0%   { transform: rotateY(0deg); }
  35%  { transform: rotateY(-90deg); }
  100% { transform: rotateY(-180deg); }
}
@keyframes dts-cover-close {
  0%   { transform: rotateY(-180deg); }
  35%  { transform: rotateY(-90deg); }
  100% { transform: rotateY(0deg); }
}
.dts-anim-cover-open  { animation: dts-cover-open  1050ms cubic-bezier(0.645,0.045,0.355,1) forwards; }
.dts-anim-cover-close { animation: dts-cover-close 1050ms cubic-bezier(0.645,0.045,0.355,1) forwards; }

/* ─ Scrapbook atoms ─ */
.dts-coffee {
  position:absolute; border-radius:50%; pointer-events:none; mix-blend-mode:multiply; opacity:.65;
  background:
    radial-gradient(circle, transparent 52%, rgba(90,58,42,.30) 55%, rgba(90,58,42,.12) 62%, transparent 66%),
    radial-gradient(circle, transparent 36%, rgba(90,58,42,.16) 40%, transparent 46%);
}
.dts-tape {
  position:absolute;
  background:
    repeating-linear-gradient(115deg,rgba(255,255,255,.14) 0 2px,transparent 2px 6px),
    linear-gradient(180deg,rgba(200,162,74,.85),rgba(168,132,54,.85));
  box-shadow:0 3px 5px rgba(0,0,0,.28); opacity:.9; z-index:4;
}
.dts-torn {
  background:#e6d5a8;
  clip-path:polygon(0% 3%,6% 0%,13% 4%,21% 1%,29% 5%,38% 0%,47% 4%,56% 1%,65% 5%,74% 0%,83% 4%,92% 1%,100% 3%,100% 96%,93% 100%,85% 95%,76% 100%,67% 96%,58% 100%,49% 95%,40% 100%,31% 96%,22% 100%,13% 95%,6% 99%,0% 96%);
  padding:8px 11px 13px; box-shadow:0 5px 11px rgba(18,13,9,.25);
}
.dts-ticket {
  background:linear-gradient(155deg,#b8895f,#8a5f3a);
  color:#F4EAC9; padding:7px 12px; border-radius:2px;
  font-family:'Special Elite',monospace; font-size:8.5px; line-height:1.5;
  box-shadow:0 8px 14px rgba(18,13,9,.32); position:relative;
}
.dts-ticket::before,.dts-ticket::after{
  content:""; position:absolute; top:50%; width:10px; height:10px;
  background:#e6d5a8; border-radius:50%; transform:translateY(-50%);
}
.dts-ticket::before{left:-5px;}.dts-ticket::after{right:-5px;}

/* ─ Progress dots ─ */
.dts-dots {
  position:absolute; bottom:16px; left:50%; transform:translateX(-50%);
  display:flex; gap:7px; z-index:20;
}
.dts-dot {
  width:7px; height:7px; border-radius:50%;
  background:rgba(200,162,74,.3); border:1px solid rgba(200,162,74,.5);
  transition:background .3s, transform .3s;
}
.dts-dot.active { background:#C8A24A; transform:scale(1.35); }

/* ─ Scroll hint ─ */
.dts-hint {
  position:absolute; bottom:38px; left:50%; transform:translateX(-50%);
  font-family:'Special Elite',monospace; font-size:10px; letter-spacing:.24em;
  text-transform:uppercase; color:#C8A24A; opacity:0;
  transition:opacity .6s ease; pointer-events:none; white-space:nowrap; z-index:30;
}
.dts-hint.show { opacity:.8; animation:dts-pulse 2.2s ease-in-out infinite; }
@keyframes dts-pulse { 0%,100%{opacity:.35;} 50%{opacity:.9;} }

/* ─ Ambient dust ─ */
.dts-dust {
  position:absolute; border-radius:50%; mix-blend-mode:screen; pointer-events:none;
  background:radial-gradient(circle,rgba(243,231,201,.9),transparent);
  opacity:0; animation:dts-float linear infinite;
}
.dts-dust.active { opacity:var(--dop,.45); }
@keyframes dts-float {
  0%{transform:translate(0,0);opacity:0;}
  12%{opacity:var(--dop,.45);}
  88%{opacity:var(--dop,.45);}
  100%{transform:translate(var(--ddx,12px),var(--ddy,-120px));opacity:0;}
}

/* ─ Top bar ─ */
.dts-topbar {
  position:absolute; top:14px; left:14px; right:14px;
  display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center;
  gap:8px; z-index:30;
}

/* ─ Responsive ─ */
@media (max-width:700px) {
  #dts-book { height:min(440px,60vh); }
  .dts-page,.dts-left-pane { padding:10px 9px; }
}
@media (prefers-reduced-motion:reduce){
  .dts-leaf,.dts-cover,.dts-anim-fwd,.dts-anim-bwd,
  .dts-anim-cover-open,.dts-anim-cover-close { animation:none!important; transition:none!important; }
}
`;

/* ─── Color & font tokens ─── */
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

/* ─── Atom components ─── */
const Coffee = ({ style }) => <div className="dts-coffee" style={style} />;
const Tape   = ({ style }) => <div className="dts-tape" style={style} />;

const Polaroid = ({ src, alt, caption, style }) => (
  <figure style={{ background:'#fbf7ee', padding:'5px 5px 18px', position:'relative',
    boxShadow:'0 10px 18px rgba(18,13,9,.42)', margin:0, flexShrink:0, ...style }}>
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
  <div style={{ background:'#e6d5a8', padding:'6px 8px', border:`1px solid ${darkInk}`,
    ...F.mono, fontSize:8.5, color:darkInk, display:'flex', flexDirection:'column', gap:2 }}>
    <div style={{ fontWeight:700, color:rust, borderBottom:'1px solid rgba(30,26,23,.3)',
      paddingBottom:2, textTransform:'uppercase', marginBottom:2 }}>Sound Check Log</div>
    {lines.map((l,i) => <div key={i}>{l}</div>)}
    <span style={{ border:`1px solid ${rust}`, color:rust, fontWeight:700,
      padding:'1px 5px', alignSelf:'flex-start', marginTop:3 }}>{status}</span>
  </div>
);

/* ══════════════════════════════════════════════════════════
   LEFT PAGE CONTENT (static pane — changes with React state)
   Each spread has its own Left content
══════════════════════════════════════════════════════════ */

const LeftContent = ({ page, entries }) => {
  const [d1, d2, d3] = entries;

  /* SPREAD -1: closed cover (left side shows nothing visible — covered by cover) */
  if (page === -1) return null;

  /* SPREAD 0: cover just opened → flyleaf / inside-front-cover */
  if (page === 0) return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', textAlign:'center', gap:10, position:'relative' }}>
      <Coffee style={{ width:80, height:80, bottom:10, right:10 }} />
      <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(15px,1.8vw,20px)',
        color:darkInk, lineHeight:1.1 }}>Field Diary</div>
      <Label>Vol. I · 2016 — 2025</Label>
      <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" />
      <div className="dts-torn" style={{ maxWidth:175, transform:'rotate(-1.5deg)', marginTop:10 }}>
        <p style={{ ...F.caveat, fontSize:14, color:'#3a2416', margin:0, lineHeight:1.3 }}>
          Property of the Archive.<br />Handle with care.
        </p>
      </div>
      <div style={{ ...F.elite, fontSize:9, letterSpacing:'.12em', textTransform:'uppercase',
        color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, marginTop:4, opacity:.8 }}>
        Memories, not merely recorded
      </div>
    </div>
  );

  /* SPREAD 1: Entry #001 */
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

  /* SPREAD 2: Entry #002 */
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

  /* SPREAD 3: Entry #003 */
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

  /* SPREAD 4: Final left page */
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', textAlign:'center', gap:10 }}>
      <StampRing top="END OF VOLUME" bottom="MORE SOON ★" />
      <p style={{ ...F.caveat, fontSize:15, color:'#3a2416', maxWidth:170, lineHeight:1.3 }}>
        To be continued…
      </p>
      <Label>Tangy Sessions · Hyderabad Archive</Label>
      <svg style={{ width:90, marginTop:6, opacity:.65 }}><use href="#dts-wave" /></svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   RIGHT PAGE CONTENT (inside each flipping leaf's front face)
══════════════════════════════════════════════════════════ */

/* Leaf 1 front: right page of Spread 1 */
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
        opacity:.8, display:'inline-block', marginTop:8 }}>Unreleased</div>
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
    <div className="dts-ticket" style={{ maxWidth:148 }}>
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

/* Leaf 2 front: right page of Spread 2 */
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
    <div className="dts-ticket" style={{ maxWidth:148 }}>
      <b style={{ ...F.bebas, fontSize:12 }}>ARTIST PASS</b><br />
      Backstage Access · 21/12/24
    </div>
    <SoundLog
      lines={['MIC: SHURE SM7B | PREAMP: NEVE 1073','REEL: NAGRA IV-S | TAPE: TDK SA90']}
      status="LIVE ARCHIVE"
    />
    <div style={{ position:'relative', width:85, alignSelf:'flex-end' }}>
      <Tape style={{ position:'absolute', top:-8, left:18, width:32, height:13 }} />
      <Polaroid src="/media/gallery/tangy4.jpg" alt="Violin Solo" caption="Violin Setup" />
    </div>
    <div style={{ textAlign:'center', ...F.elite, fontSize:9, letterSpacing:'.18em',
      textTransform:'uppercase', color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, opacity:.85 }}>
      Monsoon Sessions · 2024
    </div>
  </div>
);

/* Leaf 3 front: right page of Spread 3 */
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
    <div style={{ position:'relative', width:85, alignSelf:'flex-end' }}>
      <Polaroid src="/media/gallery/tangy2.jpg" alt="Setup" caption="Late night setup" />
    </div>
    <svg style={{ width:88, opacity:.65 }}><use href="#dts-wave" /></svg>
    <div style={{ textAlign:'center', ...F.elite, fontSize:9, letterSpacing:'.18em',
      textTransform:'uppercase', color:inkSoft, borderTop:`1px solid ${gold}`, paddingTop:6, opacity:.85 }}>
      Old City Haveli · Jan 2025
    </div>
  </div>
);

/* Leaf 4 front: the final CTA spread (right page) */
const RightFinal = () => (
  <div className="dts-page" style={{ display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', textAlign:'center',
    gap:14, height:'100%', padding:20 }}>
    <div style={{ ...F.elite, fontSize:9, letterSpacing:'.28em', textTransform:'uppercase',
      color:inkSoft, opacity:.8 }}>
      TANGY SESSIONS // FIELD DIARY
    </div>
    <div style={{ ...F.bebas, fontSize:'clamp(26px,3.8vw,42px)', color:darkInk,
      lineHeight:1.05, letterSpacing:'.02em' }}>
      Continue<br />the Story
    </div>
    <p style={{ ...F.caveat, fontSize:15, color:'#3a2416', maxWidth:205, lineHeight:1.35 }}>
      "Every archive has another chapter waiting to be written."
    </p>
    <a href="/blogs" style={{ ...F.elite, fontSize:11, letterSpacing:'.2em', textTransform:'uppercase',
      color:darkInk, background:gold, border:`2px solid ${darkInk}`,
      padding:'10px 22px', textDecoration:'none', boxShadow:`4px 4px 0 ${darkInk}`,
      display:'inline-block', marginTop:4 }}>
      Read More →
    </a>
    <div style={{ ...F.elite, fontSize:9, color:inkSoft, opacity:.7 }}>↓ Scroll to continue</div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const NUM_TURNS = 4; // 0=cover opens, 1-3=spreads, 4=final

export const TangyDiary = () => {
  const outerRef = useRef(null);
  const bookRef  = useRef(null);
  const dustRef  = useRef(null);
  const pageRef  = useRef(-1);
  const animRef  = useRef(false);

  const [currentPage, setCurrentPage] = useState(-1);
  const [displayPage, setDisplayPage] = useState(-1); // for left pane (slightly delayed)

  /* Inject fonts + CSS once */
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

  /* Spawn dust */
  useEffect(() => {
    const layer = dustRef.current; if (!layer) return;
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('div');
      d.className = 'dts-dust';
      const sz = 2 + Math.random() * 2.5;
      Object.assign(d.style, { width:sz+'px', height:sz+'px',
        left:(Math.random()*100)+'%', top:(55+Math.random()*40)+'%' });
      d.style.setProperty('--ddx',(Math.random()*36-18)+'px');
      d.style.setProperty('--ddy',(-(90+Math.random()*120))+'px');
      d.style.setProperty('--dop',(0.3+Math.random()*0.4).toFixed(2));
      d.style.animationDuration = (8+Math.random()*8)+'s';
      d.style.animationDelay   = (Math.random()*6)+'s';
      layer.appendChild(d);
    }
  }, []);

  /* Page turn sound */
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const sz = ctx.sampleRate * 0.28;
      const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) data[i] = (Math.random()*2-1)*(1-i/sz);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=1900; flt.Q.value=0.65;
      const gain = ctx.createGain(); gain.gain.value = 0.09;
      src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch (_) { /* silent */ }
  }, []);

  /* Flip a leaf element, return promise */
  const flipEl = useCallback((el, forward) => new Promise(resolve => {
    const cls = forward ? 'dts-anim-fwd' : 'dts-anim-bwd';
    el.classList.add(cls);
    const done = () => { el.removeEventListener('animationend', done); el.classList.remove(cls); resolve(); };
    el.addEventListener('animationend', done);
  }), []);

  /* Get leaves sorted by data-idx */
  const getLeaves = useCallback(() => {
    if (!bookRef.current) return [];
    return Array.from(bookRef.current.querySelectorAll('.dts-leaf'))
      .map(el => ({ el, idx: parseInt(el.dataset.idx, 10) }))
      .sort((a,b) => a.idx - b.idx);
  }, []);

  /* Update left pane with a quick crossfade */
  const updateLeftPane = useCallback((newPage) => {
    const pane = bookRef.current?.querySelector('.dts-left-pane');
    if (!pane) { setDisplayPage(newPage); return; }
    pane.classList.add('fading');
    setTimeout(() => {
      setDisplayPage(newPage);
      pane.classList.remove('fading');
    }, 180);
  }, []);

  /* Sync to target page index */
  const syncToPage = useCallback(async (target) => {
    if (animRef.current) return;
    const prev = pageRef.current;
    if (target === prev) return;
    animRef.current = true;

    const cover  = bookRef.current?.querySelector('.dts-cover');
    const leaves = getLeaves();

    if (target > prev) {
      for (let i = prev; i < target; i++) {
        playSound();
        if (i === -1) {
          // Open cover
          if (!cover) break;
          await new Promise(resolve => {
            cover.classList.add('dts-anim-cover-open');
            const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-cover-open'); resolve(); };
            cover.addEventListener('animationend', done);
          });
          cover.classList.add('flipped');
          updateLeftPane(0);
        } else {
          const leaf = leaves[i];
          if (leaf) {
            await flipEl(leaf.el, true);
            leaf.el.classList.add('flipped');
            updateLeftPane(i + 1);
          }
        }
      }
    } else {
      for (let i = prev; i > target; i--) {
        playSound();
        if (i === 0) {
          // Close cover
          if (!cover) break;
          cover.classList.remove('flipped');
          await new Promise(resolve => {
            cover.classList.add('dts-anim-cover-close');
            const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-cover-close'); resolve(); };
            cover.addEventListener('animationend', done);
          });
          updateLeftPane(-1);
        } else {
          const leaf = leaves[i - 1];
          if (leaf) {
            leaf.el.classList.remove('flipped');
            await flipEl(leaf.el, false);
            updateLeftPane(i - 1);
          }
        }
      }
    }
    pageRef.current = target;
    setCurrentPage(target);
    animRef.current = false;
  }, [getLeaves, flipEl, playSound, updateLeftPane]);

  /* Z-index: unflipped leaves descend from front, flipped ascend from back */
  useEffect(() => {
    const leaves = getLeaves();
    const n = leaves.length;
    leaves.forEach(({ el, idx }) => {
      el.style.zIndex = el.classList.contains('flipped')
        ? (n + idx + 5)
        : (n - idx + 5);
    });
  }, [currentPage, getLeaves]);

  /* Dust toggle */
  useEffect(() => {
    const on = currentPage >= 0 && currentPage < NUM_TURNS;
    dustRef.current?.querySelectorAll('.dts-dust').forEach(d => d.classList.toggle('active', on));
  }, [currentPage]);

  /* Scroll driver */
  useEffect(() => {
    const PX = window.innerHeight;
    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;
      const rect = outer.getBoundingClientRect();
      const scrolled = -rect.top;
      // Not yet reached — keep at -1 silently
      if (scrolled < 0) return;
      // Past the section entirely — keep at NUM_TURNS silently
      if (scrolled > outer.offsetHeight) return;
      const raw = Math.floor((scrolled - PX * 0.5) / PX);
      const target = Math.max(-1, Math.min(NUM_TURNS, raw));
      if (target !== pageRef.current && !animRef.current) syncToPage(target);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [syncToPage]);

  const entries = diaryEntries;
  const dots    = Array.from({ length: NUM_TURNS + 1 });

  return (
    <div ref={outerRef} id="dts-outer" style={{ height:`${(NUM_TURNS + 2.5) * 100}vh` }}>
      <div dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />

      {/* ── STICKY PANE ── */}
      <div id="dts-sticky">
        <div ref={dustRef} style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5 }} />

        {/* Top bar */}
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

        {/* Book stage */}
        <div id="dts-stage">
          <div className="dts-shadow" />

          <div id="dts-book" ref={bookRef}>

            {/* ① Dark leather base */}
            <div className="dts-base" />

            {/* ② Page stack edge on right */}
            <div className="dts-edge" />

            {/* ③ STATIC LEFT PAGE PANE — position: absolute, left:0, width:50% */}
            <div className="dts-left-pane">
              <LeftContent page={displayPage} entries={entries} />
            </div>

            {/* ④ COVER — full width, rotates from center (spine) */}
            <div className="dts-cover" style={{ zIndex: 60 }}>
              {/* Front: outside leather */}
              <div className="dts-face dts-face-front">
                <div className="dts-leather">
                  <div style={{ position:'absolute', top:4, left:4, width:18, height:18,
                    borderTop:'2px solid rgba(255,255,255,.12)', borderLeft:'2px solid rgba(255,255,255,.12)' }} />
                  <div style={{ position:'absolute', bottom:4, right:4, width:18, height:18,
                    borderBottom:'2px solid rgba(255,255,255,.12)', borderRight:'2px solid rgba(255,255,255,.12)' }} />
                  <div style={{ ...F.bebas, fontSize:'clamp(38px,5.5vw,60px)', letterSpacing:'.02em',
                    WebkitTextStroke:`1.5px ${darkInk}`, textShadow:`3px 3px 0 ${darkInk}`, lineHeight:1 }}>TANGY</div>
                  <div style={{ background:darkInk, padding:'4px 14px', ...F.bebas,
                    letterSpacing:'.3em', fontSize:16, marginTop:5, transform:'rotate(-1deg)' }}>SESSIONS</div>
                  <div style={{ marginTop:14, ...F.serif, fontStyle:'italic', fontSize:13, opacity:.85 }}>
                    Hyderabad · Field Diary · Since 2016
                  </div>
                  {/* Circular seal */}
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
              {/* Back: inside front cover (flyleaf) */}
              <div className="dts-face dts-face-back">
                <div className="dts-flyleaf">
                  <Coffee style={{ width:80, height:80, bottom:10, right:10 }} />
                  <div style={{ ...F.serif, fontStyle:'italic', fontSize:'clamp(16px,2vw,22px)', color:darkInk }}>Field Diary</div>
                  <Label>Vol. I · 2016 — 2025</Label>
                  <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" />
                  <div className="dts-torn" style={{ maxWidth:175, transform:'rotate(-1deg)', marginTop:10 }}>
                    <p style={{ ...F.caveat, fontSize:14, color:'#3a2416', margin:0, lineHeight:1.3 }}>
                      Property of the Archive.<br />Handle with care.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ⑤ LEAF STACK — each leaf is left:50%, width:50% (right half only) */}

            {/* Leaf 0 → right page of Spread 1 */}
            <div className="dts-leaf" data-idx="0" style={{ zIndex: 40 }}>
              <div className="dts-leaf-edge" />
              <div className="dts-face dts-face-front"><RightSpread1 /></div>
              {/* Back is empty (left pane handles the static left content) */}
              <div className="dts-face dts-face-back">
                <div className="dts-page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4, textAlign:'center' }}>← turned page</div>
                </div>
              </div>
            </div>

            {/* Leaf 1 → right page of Spread 2 */}
            <div className="dts-leaf" data-idx="1" style={{ zIndex: 30 }}>
              <div className="dts-leaf-edge" />
              <div className="dts-face dts-face-front"><RightSpread2 /></div>
              <div className="dts-face dts-face-back">
                <div className="dts-page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4, textAlign:'center' }}>← turned page</div>
                </div>
              </div>
            </div>

            {/* Leaf 2 → right page of Spread 3 */}
            <div className="dts-leaf" data-idx="2" style={{ zIndex: 20 }}>
              <div className="dts-leaf-edge" />
              <div className="dts-face dts-face-front"><RightSpread3 /></div>
              <div className="dts-face dts-face-back">
                <div className="dts-page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4, textAlign:'center' }}>← turned page</div>
                </div>
              </div>
            </div>

            {/* Leaf 3 → final CTA page */}
            <div className="dts-leaf" data-idx="3" style={{ zIndex: 10 }}>
              <div className="dts-leaf-edge" />
              <div className="dts-face dts-face-front"><RightFinal /></div>
              <div className="dts-face dts-face-back">
                <div className="dts-page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ ...F.caveat, fontSize:14, color:'#3a2416', opacity:.4 }}>← turned page</div>
                </div>
              </div>
            </div>

            {/* ⑥ Spine shadow (always on top visually) */}
            <div className="dts-spine" />

          </div>{/* /book */}
        </div>{/* /stage */}

        {/* Progress dots */}
        <div className="dts-dots">
          {dots.map((_, i) => (
            <div key={i} className={`dts-dot${currentPage >= i ? ' active' : ''}`} />
          ))}
        </div>

        {/* Page counter */}
        {currentPage >= 0 && (
          <div style={{ position:'absolute', bottom:40, right:20, ...F.elite, fontSize:9,
            letterSpacing:'.15em', color:'rgba(200,162,74,.65)' }}>
            {currentPage + 1} / {NUM_TURNS + 1}
          </div>
        )}

        {/* Scroll hint */}
        <div className={`dts-hint${currentPage < NUM_TURNS ? ' show' : ''}`}>
          {currentPage < 0 ? 'Scroll to open the diary ↓' : 'Scroll to turn the page ↓'}
        </div>

      </div>{/* /sticky */}
    </div>
  );
};
