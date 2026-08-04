import { useEffect, useRef, useState, useCallback } from 'react';
import { diaryEntries } from '../../data/mockData';

/*
  ╔══════════════════════════════════════════════════════════════╗
  ║  TANGY DIARY — Sticky Scroll-Hijack Page-Flip Diary         ║
  ║                                                              ║
  ║  Architecture:                                               ║
  ║  • Outer wrapper = (N+2) × 100vh tall → consumes scroll     ║
  ║  • Inner sticky pane = 100vh fixed in viewport               ║
  ║  • Scroll offset → page index → CSS 3D flip animation        ║
  ║  • Scroll locked to diary until final page; then releases    ║
  ╚══════════════════════════════════════════════════════════════╝
*/

/* ── Google Fonts (Caveat, Special Elite, Old Standard TT, Bebas Neue) ── */
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Kalam:wght@400;700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&display=swap';

/* ── SVG symbols injected once ── */
const SVG_DEFS = `<svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true"><defs>
  <symbol id="dts-clip" viewBox="0 0 40 90"><path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#b9b9b9" stroke-width="4" stroke-linecap="round"/></symbol>
  <symbol id="dts-mic" viewBox="0 0 60 110"><g fill="none" stroke="#3a2416" stroke-width="2.2" stroke-linecap="round"><rect x="20" y="6" width="20" height="40" rx="10"/><path d="M12,40 a18,18 0 0 0 36,0"/><line x1="30" y1="58" x2="30" y2="82"/><line x1="14" y1="82" x2="46" y2="82"/><line x1="24" y1="14" x2="36" y2="14"/><line x1="24" y1="22" x2="36" y2="22"/><line x1="24" y1="30" x2="36" y2="30"/></g></symbol>
  <symbol id="dts-wave" viewBox="0 0 120 30"><path d="M0,15 Q7,2 14,15 T28,15 T42,15 T56,15 T70,15 T84,15 T98,15 T112,15 T120,15" fill="none" stroke="#3a2416" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="dts-flower" viewBox="0 0 80 100"><g fill="none" stroke="#7a5236" stroke-width="1.3"><line x1="40" y1="95" x2="40" y2="45"/><path d="M40,45 Q30,60 25,80"/><path d="M40,55 Q50,68 55,84"/><g fill="#a33828" opacity="0.55" stroke="#7a5236"><ellipse cx="40" cy="20" rx="9" ry="16"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/><ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/></g><circle cx="40" cy="20" r="5" fill="#C8A24A" stroke="none"/></g></symbol>
  <symbol id="dts-heart" viewBox="0 0 24 22"><path d="M12,20 C2,13 1,6 6,3 C9,1 12,3 12,6 C12,3 15,1 18,3 C23,6 22,13 12,20 Z" fill="none" stroke="#A33828" stroke-width="1.4"/></symbol>
</defs></svg>`;

/* ── Styles injected into <head> once ── */
const DIARY_CSS = `
/* ── WRAPPER & STICKY PANE ── */
#dts-outer { position: relative; }
#dts-sticky {
  position: sticky; top: 0; left: 0; width: 100%; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 0%,  rgba(90,58,42,.5), transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(123,30,30,.22), transparent 55%),
    linear-gradient(155deg, #1c130c 0%, #120c07 55%, #0c0805 100%);
}
#dts-sticky::before {
  content:""; position:absolute; inset:0; pointer-events:none; opacity:.5;
  background: repeating-linear-gradient(92deg,rgba(0,0,0,.12) 0 2px,transparent 2px 40px),
              repeating-linear-gradient(92deg,rgba(255,255,255,.03) 0 1px,transparent 1px 90px);
}

/* ── BOOK STAGE ── */
#dts-stage {
  position: relative;
  perspective: 2400px;
  perspective-origin: 50% 44%;
  z-index: 10;
}
#dts-book {
  position: relative;
  width: min(860px, 88vw);
  height: min(560px, 68vh);
  transform-style: preserve-3d;
}
/* dark base so no void shows through */
.dts-book-base {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #4a2a1c, #5A3A2A 8%, #5A3A2A 92%, #3d2216);
  border-radius: 6px; z-index: 0;
  box-shadow: inset 0 0 40px rgba(0,0,0,.45),
              0 60px 80px rgba(0,0,0,.75),
              0 20px 40px rgba(0,0,0,.6);
}
/* spine shadow in the center */
.dts-spine {
  position: absolute; left: 50%; top: 0; bottom: 0; width: 28px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(0,0,0,.55) 45%, rgba(0,0,0,.55) 55%, transparent);
  z-index: 70; pointer-events: none;
}
/* page stack edge (right side) */
.dts-page-stack {
  position: absolute; right: -8px; top: 4%; height: 92%;
  width: 8px;
  background: repeating-linear-gradient(0deg, #d8c48f 0 2px, #c2a86e 2px 4px);
  border-radius: 0 3px 3px 0;
  box-shadow: 3px 0 6px rgba(0,0,0,.3);
  z-index: 2;
}
/* elliptical shadow beneath the book */
.dts-shadow {
  position: absolute; left: 50%; bottom: -36px; width: 84%; height: 56px;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(0,0,0,.6), transparent 72%);
  filter: blur(8px); z-index: 1;
}

/* ── LEAVES (PAGES) ── */
.dts-leaf {
  position: absolute; top: 0; left: 50%; width: 50%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: 0% 50%;          /* spine = left edge of right half */
  z-index: 10;
  transition: none;                   /* driven by JS class */
}
/* The cover leaf starts shifted so it wraps both halves */
.dts-leaf.cover { left: 0; width: 100%; transform-origin: 50% 50%; }
.dts-leaf.cover.flipped { transform: none; }

.dts-face {
  position: absolute; inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 2px;
  overflow: hidden;
}
.dts-face-front { transform: rotateY(0deg); }
.dts-face-back  { transform: rotateY(180deg); }

/* page surface */
.dts-page {
  position: relative; width: 100%; height: 100%;
  padding: 16px 14px;
  background:
    radial-gradient(ellipse at 22% 0%, rgba(255,255,255,.24), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
  box-shadow: inset 0 0 50px rgba(90,58,42,.28), inset 0 0 3px rgba(0,0,0,.32);
  overflow: hidden;
}
.dts-page.lined {
  background-image:
    repeating-linear-gradient(180deg, transparent 0 26px, rgba(90,58,42,.14) 26px 27px),
    radial-gradient(ellipse at 22% 0%, rgba(255,255,255,.24), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
}
/* inner left-page half (fixed side) */
.dts-left-half {
  position: absolute; top: 0; left: 0; width: 50%; height: 100%;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(255,255,255,.18), transparent 44%),
    linear-gradient(180deg, #EFE5C0, #E2D09B 65%, #D8C895);
  overflow: hidden;
  padding: 16px 12px 16px 16px;
  border-right: 1px solid rgba(30,26,23,.12);
}
/* right-page (the one that flips) is the leaf itself */

/* leather cover */
.dts-cover-skin {
  width: 100%; height: 100%;
  background: linear-gradient(165deg, #6b3f2b, #5A3A2A 38%, #4a2a1c 80%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; color: #F4EAC9; position: relative;
  box-shadow: inset 0 0 60px rgba(0,0,0,.45);
}

/* ── FLIP ANIMATIONS ── */
@keyframes dts-fwd {
  0%   { transform: rotateY(0deg);    box-shadow:  12px 0 30px rgba(0,0,0,.35), 0 20px 40px rgba(0,0,0,.25); }
  40%  { transform: rotateY(-90deg);  box-shadow:   0   0 60px rgba(0,0,0,.55); }
  100% { transform: rotateY(-180deg); box-shadow: -12px 0 30px rgba(0,0,0,.30), 0 20px 40px rgba(0,0,0,.25); }
}
@keyframes dts-bwd {
  0%   { transform: rotateY(-180deg); box-shadow: -12px 0 30px rgba(0,0,0,.30); }
  40%  { transform: rotateY(-90deg);  box-shadow:   0   0 60px rgba(0,0,0,.55); }
  100% { transform: rotateY(0deg);    box-shadow:  12px 0 30px rgba(0,0,0,.35); }
}
.dts-anim-fwd  { animation: dts-fwd  920ms cubic-bezier(0.645,0.045,0.355,1) forwards; }
.dts-anim-bwd  { animation: dts-bwd  920ms cubic-bezier(0.645,0.045,0.355,1) forwards; }

/* flipped = past the spine */
.dts-leaf.flipped { transform: rotateY(-180deg); }

/* ── SCRAPBOOK ATOMS ── */
.dts-coffee {
  position: absolute; border-radius: 50%; pointer-events: none; mix-blend-mode: multiply; opacity: .68;
  background:
    radial-gradient(circle, transparent 52%, rgba(90,58,42,.30) 56%, rgba(90,58,42,.12) 62%, transparent 66%),
    radial-gradient(circle, transparent 36%, rgba(90,58,42,.16) 40%, transparent 46%);
}
.dts-tape {
  position: absolute;
  background:
    repeating-linear-gradient(115deg, rgba(255,255,255,.14) 0 2px, transparent 2px 6px),
    linear-gradient(180deg, rgba(200,162,74,.85), rgba(168,132,54,.85));
  box-shadow: 0 3px 5px rgba(0,0,0,.28); opacity: .9; z-index: 4;
}
.dts-torn {
  background: #e6d5a8;
  clip-path: polygon(0% 3%,6% 0%,13% 4%,21% 1%,29% 5%,38% 0%,47% 4%,56% 1%,65% 5%,74% 0%,83% 4%,92% 1%,100% 3%,100% 96%,93% 100%,85% 95%,76% 100%,67% 96%,58% 100%,49% 95%,40% 100%,31% 96%,22% 100%,13% 95%,6% 99%,0% 96%);
  padding: 9px 11px 13px; box-shadow: 0 6px 12px rgba(18,13,9,.28);
}
.dts-ticket {
  background: linear-gradient(155deg, #b8895f, #8a5f3a);
  color: #F4EAC9; padding: 8px 12px; border-radius: 2px;
  font-family: 'Special Elite', monospace; font-size: 8.5px; line-height: 1.55;
  box-shadow: 0 8px 16px rgba(18,13,9,.35); position: relative;
}
.dts-ticket::before,.dts-ticket::after {
  content:""; position:absolute; top:50%; width:10px; height:10px;
  background:#e6d5a8; border-radius:50%; transform:translateY(-50%);
}
.dts-ticket::before{left:-5px;}.dts-ticket::after{right:-5px;}

/* ── PROGRESS DOTS ── */
.dts-dots {
  position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 7px; z-index: 20;
}
.dts-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(200,162,74,.35); border: 1px solid rgba(200,162,74,.55);
  transition: background .3s, transform .3s;
}
.dts-dot.active { background: #C8A24A; transform: scale(1.3); }

/* ── SCROLL HINT ── */
.dts-hint {
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  font-family: 'Special Elite', monospace; font-size: 10px; letter-spacing: .24em;
  text-transform: uppercase; color: #C8A24A; opacity: 0;
  transition: opacity .6s ease; pointer-events: none; white-space: nowrap; z-index: 30;
}
.dts-hint.show { opacity: .8; animation: dts-pulse 2.2s ease-in-out infinite; }
@keyframes dts-pulse { 0%,100%{opacity:.4;} 50%{opacity:.9;} }

/* ── DUST ── */
.dts-dust {
  position: absolute; border-radius: 50%; mix-blend-mode: screen; pointer-events: none;
  background: radial-gradient(circle, rgba(243,231,201,.9), transparent);
  opacity: 0; animation: dts-float linear infinite;
}
.dts-dust.show { opacity: var(--dop, .5); }
@keyframes dts-float {
  0%  { transform:translate(0,0); opacity:0; }
  10% { opacity:var(--dop,.5); }
  90% { opacity:var(--dop,.5); }
  100%{ transform:translate(var(--ddx,15px),var(--ddy,-130px)); opacity:0; }
}

/* ── TOP BAR ── */
.dts-topbar {
  position: absolute; top: 14px; left: 14px; right: 14px;
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 8px; z-index: 30; pointer-events: auto;
}

/* ── PAGE NUMBER ── */
.dts-pagenum {
  position: absolute; bottom: 8px; right: 12px;
  font-family: 'Special Elite', monospace; font-size: 9px; color: rgba(90,58,42,.6);
  letter-spacing: .12em;
}

/* ── FINAL CTA ── */
.dts-final-cta {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; text-align: center; gap: 14px; padding: 20px;
  background:
    radial-gradient(ellipse at 22% 0%, rgba(255,255,255,.24), transparent 44%),
    linear-gradient(180deg, #F4EAC9, #E7D5A4 65%, #DDCB97);
}

@media (max-width: 680px) {
  #dts-book { height: min(460px, 62vh); }
  .dts-page { padding: 10px 9px; }
  .dts-left-half { padding: 10px 8px 10px 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .dts-leaf, .dts-anim-fwd, .dts-anim-bwd { animation: none !important; transition: none !important; }
}
`;

/* ─── Typography helpers ─────────────────────────────────── */
const F = {
  elite:  { fontFamily: "'Special Elite', monospace" },
  caveat: { fontFamily: "'Caveat', cursive", fontWeight: 600 },
  serif:  { fontFamily: "'Old Standard TT', serif" },
  bebas:  { fontFamily: "'Bebas Neue', sans-serif" },
  mono:   { fontFamily: "'Courier Prime', monospace" },
};
const cream = '#F4EAC9';
const darkInk = '#1E1A17';
const rust = '#A33828';
const gold = '#C8A24A';
const inkSoft = '#6b4a34';

/* ─── Scrapbook atoms ────────────────────────────────────── */
const Coffee = ({ style }) => <div className="dts-coffee" style={style} />;
const Tape   = ({ style }) => <div className="dts-tape"   style={style} />;

const Polaroid = ({ src, alt, caption, style }) => (
  <figure style={{
    background: '#fbf7ee', padding: '6px 6px 18px', position: 'relative',
    boxShadow: '0 10px 20px rgba(18,13,9,.4)', margin: 0, ...style,
  }}>
    <img src={src} alt={alt} style={{
      display: 'block', width: '100%', aspectRatio: '4/3', objectFit: 'cover',
      filter: 'grayscale(1) sepia(0.28) contrast(1.18)', border: `1px solid ${darkInk}`,
    }} />
    {caption && (
      <figcaption style={{
        position: 'absolute', bottom: 5, left: 0, right: 0,
        textAlign: 'center', ...F.caveat, fontSize: 10, color: '#4a3016',
      }}>{caption}</figcaption>
    )}
  </figure>
);

const StampRing = ({ top, bottom, size = 76, style = {} }) => (
  <svg viewBox="0 0 120 120" style={{ width: size, height: size, color: rust, mixBlendMode: 'multiply', ...style }}>
    <defs>
      <path id="dts-sr-t" d="M14,60 a46,46 0 1,1 92,0" />
      <path id="dts-sr-b" d="M106,60 a46,46 0 1,1 -92,0" />
    </defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <text fontSize="9" letterSpacing="2" fill="currentColor">
      <textPath href="#dts-sr-t" startOffset="50%" textAnchor="middle">{top}</textPath>
    </text>
    <text fontSize="8.5" letterSpacing="2" fill="currentColor">
      <textPath href="#dts-sr-b" startOffset="50%" textAnchor="middle">{bottom}</textPath>
    </text>
  </svg>
);

const SectionHead = ({ children, style }) => (
  <div style={{
    ...F.elite, fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase', color: darkInk,
    borderBottom: `1px solid ${inkSoft}`, display: 'inline-block', paddingBottom: 2, marginBottom: 7, ...style,
  }}>{children}</div>
);

const DateLabel = ({ entry, entry_no }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', ...F.elite, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: inkSoft, marginBottom: 6 }}>
    <span>Entry #{entry_no}</span>
    <span style={{ color: rust, fontWeight: 'bold' }}>{entry.date}</span>
  </div>
);

const EntryTitle = ({ children }) => (
  <div style={{ ...F.serif, fontStyle: 'italic', fontSize: 'clamp(15px,2vw,20px)', lineHeight: 1.1, marginBottom: 6, color: darkInk }}>
    {children}
  </div>
);

const Story = ({ children, style }) => (
  <p style={{ ...F.caveat, fontSize: 14, lineHeight: 1.42, color: '#3a2416', margin: 0, ...style }}>
    {children}
  </p>
);

const Quote = ({ children, author }) => (
  <div>
    <p style={{ ...F.caveat, fontStyle: 'italic', fontSize: 14, lineHeight: 1.4, color: '#3a2416', margin: 0 }}>
      {children}
    </p>
    {author && <div style={{ ...F.elite, fontSize: 8.5, color: inkSoft, textAlign: 'right', marginTop: 3 }}>{author}</div>}
  </div>
);

const SoundLog = ({ lines, status }) => (
  <div style={{
    background: '#e6d5a8', padding: '7px 9px', border: `1px solid ${darkInk}`,
    ...F.mono, fontSize: 8.5, color: darkInk, display: 'flex', flexDirection: 'column', gap: 2,
  }}>
    <div style={{ fontWeight: 700, color: rust, borderBottom: '1px solid rgba(30,26,23,.3)', paddingBottom: 2, textTransform: 'uppercase' }}>Sound Check Log</div>
    {lines.map((l, i) => <div key={i}>{l}</div>)}
    <span style={{ border: `1px solid ${rust}`, color: rust, fontWeight: 700, padding: '1px 5px', alignSelf: 'flex-start', marginTop: 3 }}>{status}</span>
  </div>
);

/* ─── Left page halves (static content, revealed under flipping page) ─ */

const LeftHalf_Cover = () => (
  <div className="dts-left-half">
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
      <Coffee style={{ width: 90, height: 90, bottom: 10, right: 10 }} />
      <EntryTitle>Field Diary</EntryTitle>
      <div style={{ ...F.elite, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: inkSoft, background: '#e6d5a8', border: `1px dashed ${gold}`, padding: '4px 8px' }}>
        Vol. I · 2016 — 2025
      </div>
      <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" size={72} style={{ marginTop: 12 }} />
      <div className="dts-torn" style={{ maxWidth: 175, transform: 'rotate(-1.5deg)', marginTop: 10 }}>
        <p style={{ ...F.caveat, fontSize: 14, color: '#3a2416', margin: 0, lineHeight: 1.3 }}>
          Property of the Archive.<br />Handle with care.
        </p>
      </div>
      <div style={{ ...F.elite, fontSize: 9, letterSpacing: '.1em', textAlign: 'center', borderTop: `1px solid ${gold}`, paddingTop: 6, marginTop: 6, opacity: .8 }}>
        Memories, not recorded
      </div>
    </div>
  </div>
);

const LeftHalf_Spread1 = ({ entry }) => (
  <div className="dts-left-half">
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
      <Coffee style={{ width: 64, height: 64, bottom: 16, left: 8, opacity: .45 }} />
      <div>
        <svg style={{ position: 'absolute', top: -8, right: 28, width: 15, color: '#b9b9b9' }}><use href="#dts-clip" /></svg>
        <DateLabel entry={entry} entry_no="001" />
        <EntryTitle>Why We Play Inside<br />a Stepwell</EntryTitle>
        <div style={{ ...F.elite, fontSize: 8, color: rust, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
          {entry.location}
        </div>
        <Story>{entry.content}</Story>
      </div>
      <div style={{ position: 'relative', width: 110, alignSelf: 'center' }}>
        <Tape style={{ position: 'absolute', top: -9, left: 20, width: 38, height: 14, transform: 'rotate(-4deg)' }} />
        <Polaroid src={entry.image} alt={entry.title} caption="BANSILALPET 14.10.24" />
      </div>
      <div style={{ ...F.elite, fontSize: 8, letterSpacing: '.07em', textTransform: 'uppercase', color: inkSoft, background: '#e6d5a8', border: `1px dashed ${gold}`, padding: '4px 7px', display: 'inline-block' }}>
        TS-2024-14-10-001
      </div>
    </div>
  </div>
);

const LeftHalf_Spread2 = ({ entry }) => (
  <div className="dts-left-half">
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
      <Coffee style={{ width: 60, height: 60, top: 10, left: 8, opacity: .4 }} />
      <div>
        <DateLabel entry={entry} entry_no="002" />
        <EntryTitle>Monsoon Acoustic<br />Sessions</EntryTitle>
        <div style={{ ...F.elite, fontSize: 8, color: rust, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
          {entry.location}
        </div>
        <Story>{entry.content}</Story>
      </div>
      <div style={{ position: 'relative', width: 100, alignSelf: 'flex-end' }}>
        <Tape style={{ position: 'absolute', top: -9, left: 24, width: 36, height: 14, transform: 'rotate(-3deg)' }} />
        <Polaroid src={entry.image} alt={entry.title} caption="TARAMATI 21.12.24" />
      </div>
      <div className="dts-torn" style={{ maxWidth: 155, transform: 'rotate(-1deg)' }}>
        <p style={{ ...F.caveat, fontSize: 13, color: '#3a2416', margin: 0 }}>300 people.<br />No phones.<br />Just violin ragas.</p>
      </div>
    </div>
  </div>
);

const LeftHalf_Spread3 = ({ entry }) => (
  <div className="dts-left-half">
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
      <Coffee style={{ width: 70, height: 70, top: 8, left: 6, opacity: .44 }} />
      <div>
        <DateLabel entry={entry} entry_no="003" />
        <EntryTitle>Behind the<br />Microphones</EntryTitle>
        <div style={{ ...F.elite, fontSize: 8, color: rust, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
          {entry.location} · 03:00 AM
        </div>
        <Story>{entry.content}</Story>
      </div>
      <div style={{ position: 'relative', width: 120, alignSelf: 'center' }}>
        <Tape style={{ position: 'absolute', top: -9, left: 28, width: 38, height: 14, transform: 'rotate(-4deg)' }} />
        <Polaroid src={entry.image} alt={entry.title} caption="OLD CITY HAVELI 05.01.25" />
      </div>
      <div className="dts-torn" style={{ maxWidth: 160, transform: 'rotate(-1.2deg)' }}>
        <p style={{ ...F.caveat, fontSize: 13, color: '#3a2416', margin: 0 }}>"The rain almost ruined the set.<br />Then it became the set."</p>
      </div>
    </div>
  </div>
);

const LeftHalf_Final = () => (
  <div className="dts-left-half">
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
      <StampRing top="END OF VOLUME" bottom="MORE SOON ★" size={72} />
      <p style={{ ...F.caveat, fontSize: 15, color: '#3a2416', maxWidth: 175, lineHeight: 1.3 }}>
        To be continued…
      </p>
      <div style={{ ...F.elite, fontSize: 9, letterSpacing: '.07em', textTransform: 'uppercase', color: inkSoft, background: '#e6d5a8', border: `1px dashed ${gold}`, padding: '4px 8px' }}>
        Tangy Sessions · Archive
      </div>
      <svg style={{ width: 100, marginTop: 6, opacity: .65 }}><use href="#dts-wave" /></svg>
    </div>
  </div>
);

/* ─── Right page halves (these are the leaves that physically flip) ─── */

const RightPage_Cover = () => (
  <div className="dts-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8 }}>
    <div style={{ ...F.elite, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: inkSoft, opacity: .75 }}>
      Turn to begin reading →
    </div>
    <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" size={80} />
    <div style={{ ...F.caveat, fontSize: 15, color: '#3a2416', maxWidth: 180, lineHeight: 1.35 }}>
      A private record of everything that happened between the music.
    </div>
    <div style={{ ...F.elite, fontSize: 8.5, color: inkSoft, background: '#e6d5a8', border: `1px dashed ${gold}`, padding: '4px 8px' }}>
      Vol. I · Hyderabad · Since 2016
    </div>
  </div>
);

const RightPage_Spread1 = () => (
  <div className="dts-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
    <svg style={{ position: 'absolute', top: 2, right: 8, width: 28 }}><use href="#dts-flower" /></svg>
    <div>
      <SectionHead>Sound Check Notes</SectionHead>
      <div style={{ ...F.mono, fontSize: 9.5, lineHeight: 1.85, color: '#3a2416', marginTop: 4 }}>
        <b>Mic:</b> Ribbon R44<br />
        <b>Preamp:</b> Tube U47<br />
        <b>Reel:</b> Studer A80<br />
        <b>Speed:</b> 15 IPS
      </div>
      <div style={{ ...F.elite, fontSize: 10, letterSpacing: '.1em', color: rust, border: `2px solid ${rust}`, padding: '3px 8px', transform: 'rotate(-4deg)', opacity: .8, display: 'inline-block', marginTop: 8 }}>
        Unreleased
      </div>
    </div>
    <div className="dts-torn" style={{ transform: 'rotate(2deg)' }}>
      <SectionHead style={{ fontSize: 8.5, marginBottom: 4 }}>Setlist</SectionHead>
      <ol style={{ ...F.caveat, fontSize: 13, color: '#3a2416', margin: 0, paddingLeft: 14, lineHeight: 1.5 }}>
        <li>Stepwell Echoes</li>
        <li>Mast Qalandar (Acoustic Raga)</li>
        <li>Sufi Drone Improvisation</li>
        <li>Midnight Jam w/ Tanpura</li>
      </ol>
    </div>
    <div className="dts-ticket" style={{ maxWidth: 145 }}>
      <b style={{ ...F.bebas, fontSize: 13, letterSpacing: '.06em' }}>ARTIST PASS</b><br />
      Backstage Access · 14/10/24
    </div>
    <Quote author="— Tangy Archive">
      "The stepwell echoes before the crowd arrives."
    </Quote>
    <div style={{ textAlign: 'center', ...F.elite, fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: inkSoft, borderTop: `1px solid ${gold}`, paddingTop: 6, opacity: .85 }}>
      Bansilalpet Stepwell · 2024
    </div>
  </div>
);

const RightPage_Spread2 = () => (
  <div className="dts-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
    <svg style={{ position: 'absolute', top: 2, right: 8, width: 28 }}><use href="#dts-flower" /></svg>
    <div>
      <SectionHead>Notes</SectionHead>
      <Quote>"Taramati was built so voice travels 2 miles without amplifiers."</Quote>
    </div>
    <div className="dts-ticket" style={{ maxWidth: 150 }}>
      <b style={{ ...F.bebas, fontSize: 12 }}>ARTIST PASS</b><br />
      Backstage Access · 21/12/24
    </div>
    <SoundLog
      lines={['MIC: SHURE SM7B | PREAMP: NEVE 1073', 'REEL: NAGRA IV-S | TAPE: TDK SA90']}
      status="LIVE ARCHIVE"
    />
    <div style={{ position: 'relative', width: 88, alignSelf: 'flex-end' }}>
      <Tape style={{ position: 'absolute', top: -8, left: 20, width: 34, height: 13 }} />
      <Polaroid src="/media/gallery/tangy4.jpg" alt="Violin Solo" caption="Violin Setup" />
    </div>
    <div style={{ textAlign: 'center', ...F.elite, fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: inkSoft, borderTop: `1px solid ${gold}`, paddingTop: 6, opacity: .85 }}>
      Monsoon Sessions · 2024
    </div>
  </div>
);

const RightPage_Spread3 = () => (
  <div className="dts-page lined" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
    <svg style={{ position: 'absolute', top: -8, left: 52, width: 15, color: '#b9b9b9' }}><use href="#dts-clip" /></svg>
    <div>
      <SectionHead>Archive Notes</SectionHead>
      <Quote>"No plan. No setlist. Just the night deciding what to play."</Quote>
    </div>
    <SoundLog
      lines={['MIC: RIBBON R44 | PREAMP: TUBE U47', 'REEL: STUDER A80 | TAPE: AMPEX 456']}
      status="UNRELEASED"
    />
    <div style={{ position: 'relative', width: 88, alignSelf: 'flex-end' }}>
      <Polaroid src="/media/gallery/tangy2.jpg" alt="Setup" caption="Late night" />
    </div>
    <svg style={{ width: 90, opacity: .65 }}><use href="#dts-wave" /></svg>
    <div style={{ textAlign: 'center', ...F.elite, fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: inkSoft, borderTop: `1px solid ${gold}`, paddingTop: 6, opacity: .85 }}>
      Old City Haveli · Jan 2025
    </div>
  </div>
);

const RightPage_Final = () => (
  <div className="dts-final-cta">
    <div style={{ ...F.elite, fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: inkSoft, opacity: .8 }}>
      TANGY SESSIONS // FIELD DIARY
    </div>
    <div style={{ ...F.bebas, fontSize: 'clamp(28px,4vw,42px)', color: darkInk, lineHeight: 1.05, letterSpacing: '.02em' }}>
      Continue<br />the Story
    </div>
    <p style={{ ...F.caveat, fontSize: 15, color: '#3a2416', maxWidth: 210, lineHeight: 1.35, textAlign: 'center' }}>
      "Every archive has another chapter waiting to be written."
    </p>
    <a
      href="/blogs"
      style={{
        ...F.elite, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase',
        color: darkInk, background: gold, border: `2px solid ${darkInk}`,
        padding: '10px 22px', textDecoration: 'none',
        boxShadow: `4px 4px 0 ${darkInk}`, display: 'inline-block', marginTop: 4,
      }}
    >
      Read More →
    </a>
    <div style={{ ...F.elite, fontSize: 9, color: inkSoft, opacity: .7 }}>↓ Scroll to continue</div>
  </div>
);

/* ─── COVER (spans full book width when closed) ──────────── */
const CoverLeaf = () => (
  <>
    {/* front = outside cover */}
    <div className="dts-face dts-face-front">
      <div className="dts-cover-skin">
        {/* leather texture lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(170deg, rgba(255,255,255,.04) 0 1px, transparent 1px 8px)', pointerEvents: 'none' }} />
        <div style={{ ...F.bebas, fontSize: 'clamp(38px,5.5vw,58px)', letterSpacing: '.02em', WebkitTextStroke: `1.5px ${darkInk}`, textShadow: `3px 3px 0 ${darkInk}`, lineHeight: 1 }}>TANGY</div>
        <div style={{ background: darkInk, padding: '4px 14px', ...F.bebas, letterSpacing: '.3em', fontSize: 15, marginTop: 4, transform: 'rotate(-1deg)' }}>SESSIONS</div>
        <div style={{ marginTop: 14, ...F.serif, fontStyle: 'italic', fontSize: 13, opacity: .85 }}>
          Hyderabad · Field Diary · Since 2016
        </div>
        {/* seal */}
        <svg viewBox="0 0 120 120" style={{ width: 100, marginTop: 18, opacity: .9, color: cream }}>
          <defs>
            <path id="dts-cov-t" d="M14,60 a46,46 0 1,1 92,0" />
            <path id="dts-cov-b" d="M106,60 a46,46 0 1,1 -92,0" />
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <text fontSize="9" letterSpacing="2" fill="currentColor"><textPath href="#dts-cov-t" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath></text>
          <text fontSize="8" letterSpacing="2.2" fill="currentColor"><textPath href="#dts-cov-b" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath></text>
        </svg>
        {/* worn corner marks */}
        <div style={{ position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderTop: '2px solid rgba(255,255,255,.12)', borderLeft: '2px solid rgba(255,255,255,.12)' }} />
        <div style={{ position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderBottom: '2px solid rgba(255,255,255,.12)', borderRight: '2px solid rgba(255,255,255,.12)' }} />
      </div>
    </div>
    {/* back = inside front cover (revealed when cover opens) */}
    <div className="dts-face dts-face-back">
      <LeftHalf_Cover />
    </div>
  </>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export const TangyDiary = () => {
  const outerRef  = useRef(null);  // the tall scroll container
  const stickyRef = useRef(null);  // the 100vh sticky pane
  const bookRef   = useRef(null);  // the book DOM node
  const dustRef   = useRef(null);

  // Number of "turns" = 4 (cover → spread1 → spread2 → spread3 → final)
  // Outer div height = (NUM_TURNS + 1.5) × 100vh to give smooth entry/exit buffer
  const NUM_TURNS = 4;
  const [currentPage, setCurrentPage] = useState(-1); // -1 = not entered yet
  const pageRef = useRef(-1);
  const animatingRef = useRef(false);

  /* ── Inject fonts & CSS once ── */
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

  /* ── Spawn dust particles ── */
  useEffect(() => {
    const layer = dustRef.current; if (!layer) return;
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('div');
      d.className = 'dts-dust';
      const sz = 2 + Math.random() * 2.5;
      Object.assign(d.style, { width: sz + 'px', height: sz + 'px', left: (Math.random() * 100) + '%', top: (55 + Math.random() * 40) + '%' });
      d.style.setProperty('--ddx', (Math.random() * 36 - 18) + 'px');
      d.style.setProperty('--ddy', (-(90 + Math.random() * 120)) + 'px');
      d.style.setProperty('--dop', (0.3 + Math.random() * 0.45).toFixed(2));
      d.style.animationDuration = (7 + Math.random() * 9) + 's';
      d.style.animationDelay   = (Math.random() * 6) + 's';
      layer.appendChild(d);
    }
  }, []);

  /* ── Audio: page-turn crinkle ── */
  const playPageSound = useCallback(() => {
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

  /* ── Get all regular leaves (not cover) sorted by index ── */
  const getLeaves = useCallback(() => {
    if (!bookRef.current) return [];
    return Array.from(bookRef.current.querySelectorAll('.dts-leaf:not(.cover)'))
      .map(el => ({ el, idx: parseInt(el.dataset.idx, 10) }))
      .sort((a, b) => a.idx - b.idx);
  }, []);

  /* ── Animate one leaf forward or backward ── */
  const flipLeaf = useCallback((el, forward) => {
    return new Promise(resolve => {
      const cls = forward ? 'dts-anim-fwd' : 'dts-anim-bwd';
      el.classList.add(cls);
      const done = () => {
        el.removeEventListener('animationend', done);
        el.classList.remove(cls);
        resolve();
      };
      el.addEventListener('animationend', done);
    });
  }, []);

  /* ── Open cover ── */
  const openCover = useCallback(async () => {
    const cover = bookRef.current?.querySelector('.dts-leaf.cover');
    if (!cover || cover.classList.contains('flipped')) return;
    playPageSound();
    animatingRef.current = true;
    await new Promise(resolve => {
      cover.classList.add('dts-anim-fwd');
      const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-fwd'); resolve(); };
      cover.addEventListener('animationend', done);
    });
    cover.classList.add('flipped');
    animatingRef.current = false;
  }, [playPageSound]);

  /* ── Close cover ── */
  const closeCover = useCallback(async () => {
    const cover = bookRef.current?.querySelector('.dts-leaf.cover');
    if (!cover || !cover.classList.contains('flipped')) return;
    playPageSound();
    animatingRef.current = true;
    await new Promise(resolve => {
      cover.classList.add('dts-anim-bwd');
      const done = () => { cover.removeEventListener('animationend', done); cover.classList.remove('dts-anim-bwd'); resolve(); };
      cover.addEventListener('animationend', done);
    });
    cover.classList.remove('flipped');
    animatingRef.current = false;
  }, [playPageSound]);

  /* ── Sync flipped state to target page ── */
  const syncToPage = useCallback(async (target) => {
    if (animatingRef.current) return;
    const prev = pageRef.current;
    if (target === prev) return;

    const leaves = getLeaves();
    animatingRef.current = true;

    if (target > prev) {
      /* Forward */
      for (let i = prev; i < target; i++) {
        if (i === -1) { await openCover(); }
        else if (leaves[i]) {
          playPageSound();
          await flipLeaf(leaves[i].el, true);
          leaves[i].el.classList.add('flipped');
        }
      }
    } else {
      /* Backward */
      for (let i = prev; i > target; i--) {
        if (i === 0) { await closeCover(); }
        else if (leaves[i - 1]) {
          playPageSound();
          leaves[i - 1].el.classList.remove('flipped');
          await flipLeaf(leaves[i - 1].el, false);
        }
      }
    }
    pageRef.current = target;
    setCurrentPage(target);
    animatingRef.current = false;
  }, [getLeaves, openCover, closeCover, flipLeaf, playPageSound]);

  /* ── Z-index management ── */
  useEffect(() => {
    const leaves = getLeaves();
    leaves.forEach(({ el, idx }) => {
      el.style.zIndex = idx <= currentPage - 1 ? (leaves.length + idx + 10) : (leaves.length - idx + 10);
    });
  }, [currentPage, getLeaves]);

  /* ── Scroll handler ── */
  useEffect(() => {
    const PX_PER_TURN = window.innerHeight; // each page flip costs 1 viewport of scroll

    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;
      const rect = outer.getBoundingClientRect();
      const sectionScrolled = -rect.top; // how many px into the section we've scrolled

      if (sectionScrolled < 0) {
        // Haven't reached the diary yet
        if (pageRef.current !== -1) syncToPage(-1);
        return;
      }

      const buffer = PX_PER_TURN * 0.5; // settle time before first turn
      const adjusted = sectionScrolled - buffer;
      const rawPage = Math.floor(adjusted / PX_PER_TURN);
      const target = Math.max(-1, Math.min(NUM_TURNS, rawPage));

      if (target !== pageRef.current) {
        syncToPage(target);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [syncToPage]);

  /* ── Activate dust when diary is in view ── */
  useEffect(() => {
    const inDiary = currentPage >= 0 && currentPage < NUM_TURNS;
    dustRef.current?.querySelectorAll('.dts-dust').forEach(d => {
      d.classList.toggle('show', inDiary);
    });
  }, [currentPage]);

  const [d1, d2, d3] = diaryEntries;
  const showHint = currentPage === NUM_TURNS;
  const dots = Array.from({ length: NUM_TURNS + 1 });  // 5 dots: cover + 4 spreads

  const outerHeight = `${(NUM_TURNS + 2.5) * 100}vh`;

  return (
    <div ref={outerRef} id="dts-outer" style={{ height: outerHeight }}>
      {/* SVG symbol definitions */}
      <div dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />

      {/* ── STICKY VIEWPORT PANE ── */}
      <div ref={stickyRef} id="dts-sticky">

        {/* Dust layer */}
        <div ref={dustRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }} />

        {/* ── Top Bar ── */}
        <div className="dts-topbar">
          <div>
            <div style={{ ...F.elite, fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: gold, opacity: .85 }}>
              TANGY SESSIONS // FIELD DIARY ARCHIVE
            </div>
            <p style={{ ...F.serif, fontStyle: 'italic', fontSize: 11, color: 'rgba(244,234,201,.82)', margin: '2px 0 0' }}>
              "Some stories deserve more than a caption."
            </p>
          </div>
          <a href="/blogs" style={{
            ...F.elite, fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
            color: darkInk, background: gold, border: `2px solid ${darkInk}`,
            padding: '6px 14px', textDecoration: 'none', boxShadow: `3px 3px 0 ${darkInk}`,
            display: 'inline-block', whiteSpace: 'nowrap',
          }}>
            TANGY DIARY → READ MORE
          </a>
        </div>

        {/* ── Book Stage ── */}
        <div id="dts-stage">
          <div className="dts-shadow" />

          <div id="dts-book" ref={bookRef}>
            {/* Dark base behind all pages */}
            <div className="dts-book-base" />
            {/* Page stack edge */}
            <div className="dts-page-stack" />
            {/* Spine shadow */}
            <div className="dts-spine" />

            {/* ══ LEAF 0: COVER (full width, splits into left/right when open) ══ */}
            <div className="dts-leaf cover" style={{ zIndex: 50 }}>
              {/* The cover's back face shows the LeftHalf_Cover content */}
              <CoverLeaf />
            </div>

            {/* ══ LEAF 1: Spread 1 right page ══ */}
            <div className="dts-leaf" data-idx="0" style={{ zIndex: 40 }}>
              <div className="dts-leaf-edge" style={{
                position: 'absolute', top: '2%', right: -5, width: 6, height: '96%',
                background: 'repeating-linear-gradient(0deg,#d8c48f 0 2px,#c2a86e 2px 4px)',
                boxShadow: '2px 0 5px rgba(0,0,0,.25)', borderRadius: '0 2px 2px 0',
              }} />
              {/* Left half is permanent (shows under when this leaf is flipped away) */}
              <LeftHalf_Spread1 entry={d1 || {}} />
              {/* Front = right page content */}
              <div className="dts-face dts-face-front">
                <RightPage_Cover />
              </div>
              {/* Back = right page content of NEXT spread (visible after this leaf flips) */}
              <div className="dts-face dts-face-back" style={{ left: '0%' }}>
                <RightPage_Spread1 />
              </div>
            </div>

            {/* ══ LEAF 2: Spread 2 right page ══ */}
            <div className="dts-leaf" data-idx="1" style={{ zIndex: 30 }}>
              <div className="dts-leaf-edge" style={{
                position: 'absolute', top: '2%', right: -5, width: 6, height: '96%',
                background: 'repeating-linear-gradient(0deg,#d8c48f 0 2px,#c2a86e 2px 4px)',
                boxShadow: '2px 0 5px rgba(0,0,0,.25)', borderRadius: '0 2px 2px 0',
              }} />
              <LeftHalf_Spread2 entry={d2 || {}} />
              <div className="dts-face dts-face-front">
                <RightPage_Spread2 />
              </div>
              <div className="dts-face dts-face-back">
                <RightPage_Spread2 />
              </div>
            </div>

            {/* ══ LEAF 3: Spread 3 right page ══ */}
            <div className="dts-leaf" data-idx="2" style={{ zIndex: 20 }}>
              <div className="dts-leaf-edge" style={{
                position: 'absolute', top: '2%', right: -5, width: 6, height: '96%',
                background: 'repeating-linear-gradient(0deg,#d8c48f 0 2px,#c2a86e 2px 4px)',
                boxShadow: '2px 0 5px rgba(0,0,0,.25)', borderRadius: '0 2px 2px 0',
              }} />
              <LeftHalf_Spread3 entry={d3 || {}} />
              <div className="dts-face dts-face-front">
                <RightPage_Spread3 />
              </div>
              <div className="dts-face dts-face-back">
                <RightPage_Spread3 />
              </div>
            </div>

            {/* ══ LEAF 4: Final page ══ */}
            <div className="dts-leaf" data-idx="3" style={{ zIndex: 10 }}>
              <div className="dts-leaf-edge" style={{
                position: 'absolute', top: '2%', right: -5, width: 6, height: '96%',
                background: 'repeating-linear-gradient(0deg,#d8c48f 0 2px,#c2a86e 2px 4px)',
                boxShadow: '2px 0 5px rgba(0,0,0,.25)', borderRadius: '0 2px 2px 0',
              }} />
              <LeftHalf_Final />
              <div className="dts-face dts-face-front">
                <RightPage_Final />
              </div>
              <div className="dts-face dts-face-back">
                <div className="dts-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <p style={{ ...F.caveat, fontSize: 15, color: '#3a2416' }}>Continue scrolling↓</p>
                </div>
              </div>
            </div>

          </div>{/* /book */}
        </div>{/* /stage */}

        {/* ── Progress dots ── */}
        <div className="dts-dots">
          {dots.map((_, i) => (
            <div key={i} className={`dts-dot${currentPage >= i ? ' active' : ''}`} />
          ))}
        </div>

        {/* ── Page counter ── */}
        {currentPage >= 0 && (
          <div style={{
            position: 'absolute', bottom: 40, right: 20, ...F.elite, fontSize: 9,
            letterSpacing: '.15em', color: 'rgba(200,162,74,.65)',
          }}>
            {currentPage + 1} / {NUM_TURNS + 1}
          </div>
        )}

        {/* ── Scroll hint ── */}
        <div className={`dts-hint${currentPage === -1 || (currentPage >= 0 && currentPage < NUM_TURNS) ? ' show' : ''}`}>
          {currentPage < 0 ? 'Scroll to open the diary ↓' : 'Scroll to turn the page ↓'}
        </div>

      </div>{/* /sticky */}
    </div>
  );
};
