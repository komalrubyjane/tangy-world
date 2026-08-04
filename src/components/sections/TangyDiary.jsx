import { useEffect, useRef, useState } from 'react';
import { diaryEntries } from '../../data/mockData';

/* ─────────────────────────────────────────────────────────────
   TANGY DIARY — Scroll-driven physical page-flip diary
   Uses the exact flip engine from the reference HTML, populated
   with our existing diary content.
───────────────────────────────────────────────────────────── */

/* Shared SVG symbol IDs are injected once into the DOM */
const SVG_DEFS = `
<svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">
<defs>
  <symbol id="ts-clip" viewBox="0 0 40 90"><path d="M20,4 a9,9 0 0 1 9,9 v52 a9,9 0 0 1 -18,0 v-46 a4.5,4.5 0 0 1 9,0 v38" fill="none" stroke="#b9b9b9" stroke-width="4" stroke-linecap="round"/></symbol>
  <symbol id="ts-mic" viewBox="0 0 60 110"><g fill="none" stroke="#3a2416" stroke-width="2.2" stroke-linecap="round">
    <rect x="20" y="6" width="20" height="40" rx="10"/>
    <path d="M12,40 a18,18 0 0 0 36,0"/>
    <line x1="30" y1="58" x2="30" y2="82"/>
    <line x1="14" y1="82" x2="46" y2="82"/>
    <line x1="24" y1="14" x2="36" y2="14"/><line x1="24" y1="22" x2="36" y2="22"/><line x1="24" y1="30" x2="36" y2="30"/>
  </g></symbol>
  <symbol id="ts-wave" viewBox="0 0 120 30"><path d="M0,15 Q7,2 14,15 T28,15 T42,15 T56,15 T70,15 T84,15 T98,15 T112,15 T120,15" fill="none" stroke="#3a2416" stroke-width="1.6" stroke-linecap="round"/></symbol>
  <symbol id="ts-flower" viewBox="0 0 80 100"><g fill="none" stroke="#7a5236" stroke-width="1.3">
    <line x1="40" y1="95" x2="40" y2="45"/>
    <path d="M40,45 Q30,60 25,80"/><path d="M40,55 Q50,68 55,84"/>
    <g fill="#a33828" opacity="0.55" stroke="#7a5236">
      <ellipse cx="40" cy="20" rx="9" ry="16"/>
      <ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(45 40 20)"/>
      <ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(90 40 20)"/>
      <ellipse cx="40" cy="20" rx="9" ry="16" transform="rotate(135 40 20)"/>
    </g>
    <circle cx="40" cy="20" r="5" fill="#C8A24A" stroke="none"/>
  </g></symbol>
  <symbol id="ts-heart" viewBox="0 0 24 22"><path d="M12,20 C2,13 1,6 6,3 C9,1 12,3 12,6 C12,3 15,1 18,3 C23,6 22,13 12,20 Z" fill="none" stroke="#A33828" stroke-width="1.4"/></symbol>
</defs>
</svg>`;

/* ── inline style block for flip animations & diary chrome ── */
const DIARY_STYLES = `
.ts-diary-section{
  position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(90,58,42,0.45), transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(123,30,30,0.2), transparent 55%),
    linear-gradient(155deg,#1c130c 0%,#120c07 55%,#0c0805 100%);
  overflow:hidden;
}
.ts-diary-section::before{
  content:"";position:absolute;inset:0;opacity:0.5;pointer-events:none;
  background:repeating-linear-gradient(92deg,rgba(0,0,0,.12) 0 2px,transparent 2px 40px),
             repeating-linear-gradient(92deg,rgba(255,255,255,.03) 0 1px,transparent 1px 90px);
}
.ts-book-stage{
  position:relative;transform:scale(0.93);transition:transform 1.3s ease-out;
  perspective:2200px;perspective-origin:50% 42%;
}
.ts-diary-section.ts-active .ts-book-stage{transform:scale(1);}
.ts-book-shadow{
  position:absolute;left:50%;bottom:-30px;width:80%;height:60px;transform:translateX(-50%);
  background:radial-gradient(ellipse,rgba(0,0,0,0.55),transparent 72%);filter:blur(6px);z-index:1;
}
.ts-book{
  position:relative;
  width:min(880px,90vw);height:min(580px,70vh);
  transform-style:preserve-3d;
}
.ts-spine-shadow{
  position:absolute;left:50%;top:0;bottom:0;width:26px;transform:translateX(-50%);
  background:linear-gradient(90deg,transparent,rgba(0,0,0,0.5) 45%,rgba(0,0,0,0.5) 55%,transparent);
  z-index:60;pointer-events:none;
}
.ts-book-back{
  position:absolute;inset:0;
  background:linear-gradient(180deg,#4a2a1c,#5A3A2A 8%,#5A3A2A 92%,#3d2216);
  border-radius:8px;z-index:0;box-shadow:inset 0 0 40px rgba(0,0,0,0.4);
}
.ts-leaf{
  position:absolute;top:0;left:50%;width:48%;height:100%;
  transform-style:preserve-3d;transform-origin:0% 50%;
  transform:rotateY(0deg);z-index:10;
}
.ts-leaf.ts-flipped{transform:rotateY(-180deg);}
.ts-leaf.ts-cover-leaf{left:26%;}
.ts-leaf.ts-cover-leaf.ts-flipped{left:50%;}
.ts-leaf-edge{
  position:absolute;top:2%;right:-5px;width:6px;height:96%;
  background:repeating-linear-gradient(0deg,#d8c48f 0 2px,#c2a86e 2px 4px);
  box-shadow:2px 0 5px rgba(0,0,0,0.25);border-radius:0 2px 2px 0;
}
.ts-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:2px;overflow:hidden;}
.ts-face-front{transform:rotateY(0deg);}
.ts-face-back{transform:rotateY(180deg);}
.ts-page{
  position:relative;width:100%;height:100%;padding:18px 16px;
  background:radial-gradient(ellipse at 25% 0%,rgba(255,255,255,.22),transparent 45%),
             linear-gradient(180deg,#F3E7C9,#e6d5a8 65%,#ddc999);
  box-shadow:inset 0 0 46px rgba(90,58,42,.32),inset 0 0 3px rgba(0,0,0,.35);
}
.ts-page.lined{
  background-image:
    repeating-linear-gradient(180deg,transparent 0 26px,rgba(90,58,42,.15) 26px 27px),
    radial-gradient(ellipse at 25% 0%,rgba(255,255,255,.22),transparent 45%),
    linear-gradient(180deg,#F3E7C9,#e6d5a8 65%,#ddc999);
}
.ts-cover-face{
  display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  background:linear-gradient(165deg,#6b3f2b,#5A3A2A 40%,#4a2a1c);
  color:#F3E7C9;position:relative;height:100%;
}
/* scrapbook atoms */
.ts-coffee{
  position:absolute;border-radius:50%;pointer-events:none;mix-blend-mode:multiply;opacity:.7;
  background:radial-gradient(circle,transparent 54%,rgba(90,58,42,.32) 57%,rgba(90,58,42,.14) 62%,transparent 66%),
             radial-gradient(circle,transparent 38%,rgba(90,58,42,.18) 41%,transparent 46%);
}
.ts-tape{
  position:absolute;width:52px;height:20px;
  background:repeating-linear-gradient(115deg,rgba(255,255,255,.14) 0 2px,transparent 2px 6px),
             linear-gradient(180deg,rgba(200,162,74,.85),rgba(168,132,54,.85));
  box-shadow:0 3px 5px rgba(0,0,0,.28);opacity:.9;z-index:4;
}
.ts-torn{
  background:#e6d5a8;box-shadow:0 6px 12px rgba(18,13,9,.3);
  clip-path:polygon(0% 3%,6% 0%,13% 4%,21% 1%,29% 5%,38% 0%,47% 4%,56% 1%,65% 5%,74% 0%,83% 4%,92% 1%,100% 3%,100% 96%,93% 100%,85% 95%,76% 100%,67% 96%,58% 100%,49% 95%,40% 100%,31% 96%,22% 100%,13% 95%,6% 99%,0% 96%);
  padding:10px 12px 14px;
}
.ts-handnote{font-family:'Caveat',cursive;font-weight:600;font-size:15px;line-height:1.32;color:#3a2416;}
.ts-label{
  display:inline-block;font-family:'Special Elite',monospace;font-size:9px;letter-spacing:.07em;text-transform:uppercase;
  color:#6b4a34;background:#e6d5a8;border:1px dashed #C8A24A;padding:4px 7px;
}
.ts-stamp{
  display:inline-block;font-family:'Special Elite',monospace;font-size:10px;letter-spacing:.1em;color:#A33828;
  border:2px solid #A33828;padding:3px 8px;transform:rotate(-4deg);opacity:.8;mix-blend-mode:multiply;
}
.ts-polaroid{background:#fbf7ee;padding:6px 6px 20px;position:relative;box-shadow:0 9px 16px rgba(18,13,9,.4);}
.ts-ticket{
  background:linear-gradient(155deg,#b8895f,#8a5f3a);color:#F3E7C9;padding:8px 10px;border-radius:2px;
  font-family:'Special Elite',monospace;font-size:8.5px;line-height:1.5;box-shadow:0 8px 14px rgba(18,13,9,.35);position:relative;
}
.ts-ticket::before,.ts-ticket::after{content:"";position:absolute;top:50%;width:10px;height:10px;background:#e6d5a8;border-radius:50%;transform:translateY(-50%);}
.ts-ticket::before{left:-5px;}.ts-ticket::after{right:-5px;}
.ts-story{font-family:'Caveat',cursive;font-weight:600;font-size:15px;line-height:1.42;color:#3a2416;}
.ts-quote{font-family:'Caveat',cursive;font-weight:600;font-style:italic;font-size:14px;line-height:1.4;color:#3a2416;}
.ts-foot{text-align:center;font-family:'Special Elite',monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#6b4a34;border-top:1px solid #C8A24A;padding-top:6px;margin-top:10px;opacity:.85;}
.ts-eyebrow{display:flex;justify-content:space-between;font-family:'Special Elite',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#6b4a34;margin-bottom:6px;}
.ts-eyebrow .ts-date{color:#A33828;font-weight:bold;}
.ts-entry-title{font-family:'Old Standard TT',serif;font-style:italic;font-size:clamp(16px,2.2vw,22px);line-height:1.1;margin:0 0 5px;}
.ts-section-head{font-family:'Special Elite',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:#1E1A17;border-bottom:1px solid #6b4a34;display:inline-block;padding-bottom:2px;margin-bottom:7px;}
/* scroll hint */
.ts-scroll-hint{
  position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:20;
  font-family:'Special Elite',monospace;font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:#C8A24A;
  opacity:0;transition:opacity .6s ease;pointer-events:none;white-space:nowrap;
}
.ts-diary-section.ts-active .ts-scroll-hint{opacity:.75;animation:tsHintPulse 2.4s ease-in-out infinite;}
@keyframes tsHintPulse{0%,100%{opacity:.4;}50%{opacity:.85;}}
/* dust */
.ts-dust{
  position:absolute;width:3px;height:3px;border-radius:50%;
  background:radial-gradient(circle,rgba(243,231,201,.9),rgba(243,231,201,0));
  opacity:0;mix-blend-mode:screen;animation:tsFloatDust linear infinite;
}
.ts-diary-section.ts-active .ts-dust{opacity:var(--ts-dust-op,.6);}
@keyframes tsFloatDust{
  0%{transform:translate(0,0);opacity:0;}
  10%{opacity:var(--ts-dust-op,.6);}
  90%{opacity:var(--ts-dust-op,.6);}
  100%{transform:translate(var(--ts-dx,20px),var(--ts-dy,-140px));opacity:0;}
}
/* flip keyframes */
@keyframes tsFwd{
  0%{transform:rotateY(0deg);}
  50%{transform:rotateY(-90deg);}
  100%{transform:rotateY(-180deg);}
}
@keyframes tsBwd{
  0%{transform:rotateY(-180deg);}
  50%{transform:rotateY(-90deg);}
  100%{transform:rotateY(0deg);}
}
@keyframes tsCoverOpen{
  0%{left:26%;transform:rotateY(0deg);}
  50%{left:38%;transform:rotateY(-90deg);}
  100%{left:50%;transform:rotateY(-180deg);}
}
@keyframes tsCoverClose{
  0%{left:50%;transform:rotateY(-180deg);}
  50%{left:38%;transform:rotateY(-90deg);}
  100%{left:26%;transform:rotateY(0deg);}
}
.ts-anim-fwd{animation:tsFwd 1000ms cubic-bezier(0.645,0.045,0.355,1) forwards;}
.ts-anim-bwd{animation:tsBwd 1000ms cubic-bezier(0.645,0.045,0.355,1) forwards;}
.ts-anim-cover-open{animation:tsCoverOpen 1100ms cubic-bezier(0.645,0.045,0.355,1) forwards;}
.ts-anim-cover-close{animation:tsCoverClose 1100ms cubic-bezier(0.645,0.045,0.355,1) forwards;}
/* top bar CTA strip */
.ts-top-bar{
  position:absolute;top:16px;left:16px;right:16px;z-index:30;
  display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;
  pointer-events:auto;
}
@media(max-width:700px){
  .ts-book-stage{transform:scale(0.72);}
  .ts-diary-section.ts-active .ts-book-stage{transform:scale(0.78);}
}
@media(prefers-reduced-motion:reduce){
  .ts-book-stage,.ts-leaf,.ts-dust{animation:none!important;transition:none!important;}
}
`;

/* ─── Atomic scrapbook components ─────────────────────── */

const Coffee = ({ style }) => (
  <div className="ts-coffee" style={{ ...style }} />
);

const Tape = ({ style }) => (
  <div className="ts-tape" style={{ ...style }} />
);

const PolaroidImg = ({ src, alt, caption, style }) => (
  <figure className="ts-polaroid" style={{ position: 'relative', ...style }}>
    <img
      src={src}
      alt={alt}
      style={{
        display: 'block',
        width: '100%',
        aspectRatio: '4/3',
        objectFit: 'cover',
        filter: 'grayscale(1) sepia(0.3) contrast(1.2)',
        border: '1px solid #1E1A17',
      }}
    />
    {caption && (
      <figcaption style={{
        position: 'absolute', left: 0, right: 0, bottom: 5,
        textAlign: 'center', fontFamily: "'Caveat',cursive", fontSize: 11, color: '#4a3016',
      }}>
        {caption}
      </figcaption>
    )}
  </figure>
);

const StampRing = ({ top, bottom, style }) => (
  <svg viewBox="0 0 120 120" style={{ width: 80, height: 80, color: '#A33828', mixBlendMode: 'multiply', ...style }}>
    <defs>
      <path id="ts-sr-top" d="M14,60 a46,46 0 1,1 92,0" />
      <path id="ts-sr-bot" d="M106,60 a46,46 0 1,1 -92,0" />
    </defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <text fontSize="9" letterSpacing="2" fill="currentColor">
      <textPath href="#ts-sr-top" startOffset="50%" textAnchor="middle">{top}</textPath>
    </text>
    <text fontSize="8.5" letterSpacing="2" fill="currentColor">
      <textPath href="#ts-sr-bot" startOffset="50%" textAnchor="middle">{bottom}</textPath>
    </text>
  </svg>
);

/* ─── Page Spread Content ──────────────────────────────── */

/* COVER (front face) */
const CoverFront = () => (
  <div className="ts-cover-face">
    <div style={{
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 'clamp(32px,5vw,52px)',
      letterSpacing: '0.02em',
      WebkitTextStroke: '1.5px #1E1A17',
      textShadow: '3px 3px 0 #1E1A17',
    }}>
      TANGY
    </div>
    <div style={{
      background: '#1E1A17', padding: '4px 14px',
      fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '0.3em', fontSize: 14,
      marginTop: 6, transform: 'rotate(-1deg)',
    }}>
      SESSIONS
    </div>
    <div style={{
      marginTop: 12, fontFamily: "'Kalam',cursive", fontSize: 12, opacity: 0.85,
    }}>
      Hyderabad · Field Diary · Since 2016
    </div>

    {/* Circular seal */}
    <svg viewBox="0 0 120 120" style={{ width: 100, marginTop: 18, opacity: 0.9, color: '#F3E7C9' }}>
      <defs>
        <path id="ts-ct1" d="M14,60 a46,46 0 1,1 92,0" />
        <path id="ts-ct2" d="M106,60 a46,46 0 1,1 -92,0" />
      </defs>
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text fontSize="9" letterSpacing="2" fill="currentColor">
        <textPath href="#ts-ct1" startOffset="50%" textAnchor="middle">TANGY SESSIONS</textPath>
      </text>
      <text fontSize="8" letterSpacing="2.2" fill="currentColor">
        <textPath href="#ts-ct2" startOffset="50%" textAnchor="middle">HYDERABAD ARCHIVE</textPath>
      </text>
    </svg>
  </div>
);

/* COVER (inside back flyleaf) */
const CoverBack = () => (
  <div className="ts-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
    <Coffee style={{ width: 100, height: 100, bottom: 12, right: 12 }} />
    <div className="ts-entry-title" style={{ fontSize: 22 }}>Field Diary</div>
    <div className="ts-label">Vol. I · 2016 — 2025</div>
    <StampRing top="TANGY SESSIONS" bottom="HYDERABAD ARCHIVE" style={{ marginTop: 16 }} />
    <div className="ts-torn" style={{ maxWidth: 190, transform: 'rotate(-1.5deg)', marginTop: 14 }}>
      <div className="ts-handnote">Property of the Archive.<br />Handle with care.</div>
    </div>
  </div>
);

/* SPREAD 1 — Why We Play Inside A Stepwell */
const Spread1Front = ({ entry }) => (
  <div className="ts-page" style={{ display: 'flex', gap: 10, height: '100%' }}>
    {/* LEFT HALF */}
    <div style={{ flex: 1, borderRight: '1px solid rgba(30,26,23,.2)', paddingRight: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <Coffee style={{ width: 70, height: 70, bottom: 16, left: 8, opacity: 0.45 }} />
      <div>
        <svg style={{ position: 'absolute', top: -8, right: 30, width: 16, color: '#b9b9b9' }}><use href="#ts-clip" /></svg>
        <div className="ts-eyebrow">
          <span>Entry #001</span>
          <span className="ts-date">{entry.date}</span>
        </div>
        <div className="ts-entry-title">Why We Play<br />Inside a Stepwell</div>
        <svg width="100" height="7" viewBox="0 0 100 7" style={{ marginBottom: 6 }}>
          <path d="M2,4 Q18,1 34,4 T66,4 T98,4" stroke="#A33828" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 8.5, color: '#6b4a34', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          OLD CITY HAVELI · {entry.location}
        </div>
        <p className="ts-story" style={{ maxWidth: 180, marginTop: 6, fontSize: 14 }}>
          {entry.content}
        </p>
      </div>
      {/* Polaroid */}
      <div style={{ position: 'relative', width: 110, alignSelf: 'center' }}>
        <Tape style={{ top: -9, left: 22, width: 38, height: 14, transform: 'rotate(-4deg)' }} />
        <PolaroidImg src={entry.image} alt={entry.title} caption="BANSILALPET 14.10.24" />
      </div>
      <div className="ts-label" style={{ marginTop: 6, fontSize: 8 }}>TS-2024-14-10-001</div>
    </div>

    {/* RIGHT HALF */}
    <div style={{ flex: 1, paddingLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <svg style={{ position: 'absolute', top: 2, right: 8, width: 32, color: 'inherit' }}><use href="#ts-flower" /></svg>
      <div>
        <div className="ts-section-head">Sound Check Notes</div>
        <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 9.5, lineHeight: 1.85, color: '#3a2416' }}>
          <b>Mic:</b> Ribbon R44<br />
          <b>Preamp:</b> Tube U47<br />
          <b>Reel:</b> Studer A80<br />
          <b>Speed:</b> 15 IPS
        </div>
        <div className="ts-stamp" style={{ marginTop: 8, display: 'inline-block' }}>Unreleased</div>
      </div>

      <div className="ts-torn" style={{ transform: 'rotate(2deg)', marginTop: 10 }}>
        <div className="ts-section-head" style={{ fontSize: 8.5, marginBottom: 4 }}>Setlist</div>
        <ol style={{ fontFamily: "'Caveat',cursive", fontWeight: 600, fontSize: 13, color: '#3a2416', margin: 0, paddingLeft: 14, lineHeight: 1.5 }}>
          <li>Stepwell Echoes</li>
          <li>Mast Qalandar (Acoustic Raga)</li>
          <li>Sufi Drone Improvisation</li>
          <li>Midnight Jam w/ Tanpura</li>
        </ol>
      </div>

      <div className="ts-ticket" style={{ maxWidth: 140, marginTop: 8 }}>
        <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12, letterSpacing: '.06em' }}>ARTIST PASS</b><br />
        Backstage Access<br />Date: 14/10/24
      </div>

      <p className="ts-quote" style={{ maxWidth: 165, marginTop: 10, fontSize: 13 }}>
        "The stepwell echoes before the crowd arrives."
        <span style={{ display: 'block', fontFamily: "'Special Elite',monospace", fontSize: 8.5, textAlign: 'right', color: '#6b4a34', marginTop: 2 }}>— Tangy Archive</span>
      </p>

      <div className="ts-foot">Bansilalpet Stepwell · 2024</div>
    </div>
  </div>
);

const Spread1Back = () => (
  <div className="ts-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', position: 'relative' }}>
    <div className="ts-section-head">A Collection of Memories</div>
    <div className="ts-ticket" style={{ maxWidth: 190 }}>
      <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13 }}>STEPWELL SESSIONS</b><br />
      Bansilalpet · Aug 2024
    </div>
    <div className="ts-ticket" style={{ maxWidth: 190, transform: 'rotate(3deg)' }}>
      <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13 }}>TARAMATI BARADARI</b><br />
      Oct 2024 · Hyderabad
    </div>
    <div className="ts-ticket" style={{ maxWidth: 190, transform: 'rotate(-2.5deg)' }}>
      <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 13 }}>OLD CITY HAVELI</b><br />
      Jan 2025 · 03:00 AM
    </div>
    <div className="ts-handnote" style={{ marginTop: 8 }}>Every ticket tells a story.</div>
  </div>
);

/* SPREAD 2 — Monsoon Acoustic Sessions */
const Spread2Front = ({ entry }) => (
  <div className="ts-page" style={{ display: 'flex', gap: 10, height: '100%' }}>
    <div style={{ flex: 1, borderRight: '1px solid rgba(30,26,23,.2)', paddingRight: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <Coffee style={{ width: 65, height: 65, top: 10, right: 8, opacity: 0.4 }} />
      <div>
        <div className="ts-eyebrow">
          <span>Entry #002</span>
          <span className="ts-date">{entry.date}</span>
        </div>
        <div className="ts-entry-title">Monsoon Acoustic<br />Sessions</div>
        <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 8.5, color: '#6b4a34', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>
          {entry.location}
        </div>
        <p className="ts-story" style={{ maxWidth: 180, marginTop: 8, fontSize: 14 }}>
          {entry.content}
        </p>
      </div>

      {/* Mic icon + note */}
      <div style={{ position: 'relative', width: 60, alignSelf: 'flex-end', marginBottom: 8 }}>
        <Tape style={{ top: -8, left: 10, width: 32, height: 13 }} />
        <svg style={{ width: 60, color: '#3a2416', background: '#efe4c8', padding: 7, boxShadow: '0 7px 13px rgba(18,13,9,.28)' }}>
          <use href="#ts-mic" />
        </svg>
      </div>

      <div className="ts-torn" style={{ maxWidth: 160 }}>
        <div className="ts-handnote" style={{ fontSize: 13 }}>300 people.<br />No phones.<br />Just violin ragas.</div>
      </div>

      <div className="ts-label" style={{ fontSize: 8 }}>TS-2024-21-12-002</div>
    </div>

    <div style={{ flex: 1, paddingLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <svg style={{ position: 'absolute', top: 2, right: 8, width: 30 }}><use href="#ts-flower" /></svg>
      <div>
        <div className="ts-section-head">Notes</div>
        <p className="ts-quote" style={{ maxWidth: 160, fontSize: 14 }}>
          "Taramati was built so voice travels 2 miles without amplifiers."
        </p>
      </div>

      {/* Polaroid */}
      <div style={{ position: 'relative', width: 100 }}>
        <Tape style={{ top: -8, left: 24, width: 36, height: 14, transform: 'rotate(-3deg)' }} />
        <PolaroidImg src={entry.image} alt={entry.title} caption="TARAMATI 21.12.24" />
      </div>

      <div className="ts-ticket" style={{ maxWidth: 150 }}>
        <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12 }}>ARTIST PASS</b><br />
        Backstage Access<br />Date: 21/12/24
      </div>

      <div style={{ width: '100%', background: '#e6d5a8', padding: '7px 8px', border: '1px solid #1E1A17', fontFamily: "'Courier Prime',monospace", fontSize: 9, color: '#1E1A17', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontWeight: 700, color: '#A33828', borderBottom: '1px solid rgba(30,26,23,.3)', paddingBottom: 2, textTransform: 'uppercase' }}>Sound Check Log</div>
        <div>MIC: SHURE SM7B | PREAMP: NEVE 1073</div>
        <div>REEL: NAGRA IV-S | TAPE: TDK SA90</div>
        <span style={{ border: '1px solid #A33828', color: '#A33828', fontWeight: 700, padding: '1px 5px', alignSelf: 'flex-start', marginTop: 3, transform: 'rotate(2deg)' }}>LIVE ARCHIVE</span>
      </div>

      <div className="ts-foot">Monsoon Sessions · Hyderabad 2024</div>
    </div>
  </div>
);

const Spread2Back = () => (
  <div className="ts-page lined" style={{ position: 'relative' }}>
    <svg style={{ position: 'absolute', top: -8, left: 55, width: 16, color: '#b9b9b9' }}><use href="#ts-clip" /></svg>
    <div className="ts-section-head">Letters &amp; Quotes</div>
    <p className="ts-quote" style={{ fontSize: 18, marginTop: 10, maxWidth: 200 }}>
      "Music is the strongest form of magic."
    </p>
    <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 9, color: '#6b4a34', marginTop: 5 }}>
      — Tangy Sessions, field notes
    </div>
    <p className="ts-handnote" style={{ marginTop: 24, maxWidth: 195, fontSize: 14 }}>
      Dear diary — real people, real stories, real music. That's all this ever was.
    </p>
    <svg style={{ width: 20, position: 'absolute', bottom: 55, left: 20 }}><use href="#ts-heart" /></svg>
    <div className="ts-ticket" style={{ position: 'absolute', bottom: 14, right: 16, maxWidth: 120, transform: 'rotate(3deg)' }}>
      <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 10 }}>TARAMATI<br />BARADARI</b><br />21 DEC 2024
    </div>
  </div>
);

/* SPREAD 3 — Behind the Microphones */
const Spread3Front = ({ entry }) => (
  <div className="ts-page" style={{ display: 'flex', gap: 10, height: '100%' }}>
    <div style={{ flex: 1, borderRight: '1px solid rgba(30,26,23,.2)', paddingRight: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <Coffee style={{ width: 75, height: 75, top: 10, left: 8, opacity: 0.45 }} />
      <div>
        <div className="ts-eyebrow">
          <span>Entry #003</span>
          <span className="ts-date">{entry.date}</span>
        </div>
        <div className="ts-entry-title">Behind the<br />Microphones</div>
        <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 8.5, color: '#6b4a34', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>
          {entry.location} · 03:00 AM
        </div>
        <p className="ts-story" style={{ maxWidth: 185, marginTop: 8, fontSize: 14 }}>
          {entry.content}
        </p>
      </div>

      <div style={{ position: 'relative', width: 130, alignSelf: 'center', marginBottom: 6 }}>
        <Tape style={{ top: -9, left: 32, width: 38, height: 14, transform: 'rotate(-4deg)' }} />
        <PolaroidImg src={entry.image} alt={entry.title} caption="OLD CITY HAVELI 05.01.25" />
      </div>

      <div className="ts-torn" style={{ maxWidth: 165, transform: 'rotate(-1deg)' }}>
        <div className="ts-handnote" style={{ fontSize: 13 }}>"The rain almost ruined the set. Then it became the set."</div>
      </div>

      <div className="ts-label" style={{ fontSize: 8 }}>TS-2025-05-01-003</div>
    </div>

    <div style={{ flex: 1, paddingLeft: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <svg style={{ position: 'absolute', top: 2, right: 8, width: 30 }}><use href="#ts-flower" /></svg>
      <div>
        <div className="ts-section-head">Handwritten Note</div>
        <p className="ts-quote" style={{ maxWidth: 165, fontSize: 14 }}>
          "No plan. No setlist. Just the night deciding what to play."
        </p>
      </div>

      <div className="ts-ticket" style={{ maxWidth: 150 }}>
        <b style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 12 }}>ARTIST PASS</b><br />
        After-Hours Access<br />Date: 05/01/25
      </div>

      <div style={{ width: '100%', background: '#e6d5a8', padding: '7px 8px', border: '1px solid #1E1A17', fontFamily: "'Courier Prime',monospace", fontSize: 9, color: '#1E1A17', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontWeight: 700, color: '#A33828', borderBottom: '1px solid rgba(30,26,23,.3)', paddingBottom: 2, textTransform: 'uppercase' }}>Sound Check Log</div>
        <div>MIC: RIBBON R44 | PREAMP: TUBE U47</div>
        <div>REEL: STUDER A80 | TAPE: AMPEX 456</div>
        <span style={{ border: '1px solid #A33828', color: '#A33828', fontWeight: 700, padding: '1px 5px', alignSelf: 'flex-start', marginTop: 3, transform: 'rotate(-2deg)' }}>UNRELEASED</span>
      </div>

      <svg style={{ width: 88, opacity: 0.7, marginTop: 4 }}><use href="#ts-wave" /></svg>
      <div className="ts-foot">Old City Haveli · Jan 2025</div>
    </div>
  </div>
);

/* FINAL PAGE — End of Volume */
const FinalPageFront = () => (
  <div className="ts-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
    <div className="ts-section-head">A Collection of Tickets</div>
    <div style={{ position: 'relative', height: 110, width: '100%' }}>
      <div className="ts-ticket" style={{ position: 'absolute', top: 0, left: 6, width: 100, transform: 'rotate(-6deg)' }}>
        STEPWELL<br />SESSIONS
      </div>
      <div className="ts-ticket" style={{ position: 'absolute', top: 16, left: 68, width: 100, transform: 'rotate(4deg)' }}>
        OLD CITY<br />HAVELI
      </div>
      <div className="ts-ticket" style={{ position: 'absolute', top: 44, left: 24, width: 100, transform: 'rotate(-2deg)' }}>
        TARAMATI<br />BARADARI
      </div>
    </div>
    <div className="ts-handnote" style={{ marginTop: 6 }}>Every ticket tells a story.</div>
    <a href="/blogs" style={{
      fontFamily: "'Special Elite',monospace", fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
      color: '#A33828', border: '1px solid #A33828', padding: '5px 12px', textDecoration: 'none', marginTop: 8,
    }}>
      TANGY DIARY → READ MORE
    </a>
  </div>
);

const FinalPageBack = () => (
  <div className="ts-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
    <StampRing top="END OF VOLUME" bottom="MORE SOON ★" />
    <div className="ts-handnote" style={{ marginTop: 12 }}>To be continued…</div>
    <div className="ts-label">Tangy Sessions · Hyderabad Archive</div>
  </div>
);

/* ─── Main Component ───────────────────────────────────── */

export const TangyDiary = () => {
  const sectionRef = useRef(null);
  const bookRef = useRef(null);
  const dustRef = useRef(null);
  const stateRef = useRef({
    currentSpread: 0,
    isAnimating: false,
    hasOpened: false,
    wheelAccum: 0,
    touchStartY: null,
    active: false,
  });
  const [isActive, setIsActive] = useState(false);

  // Insert fonts + styles once
  useEffect(() => {
    if (!document.getElementById('ts-diary-fonts')) {
      const link = document.createElement('link');
      link.id = 'ts-diary-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Kalam:wght@400;700&family=Special+Elite&family=Courier+Prime:wght@400;700&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Anton&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ts-diary-styles')) {
      const style = document.createElement('style');
      style.id = 'ts-diary-styles';
      style.textContent = DIARY_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  // Spawn dust particles
  useEffect(() => {
    const layer = dustRef.current;
    if (!layer) return;
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('div');
      d.className = 'ts-dust';
      const size = 2 + Math.random() * 2.5;
      Object.assign(d.style, {
        width: size + 'px', height: size + 'px',
        left: (Math.random() * 100) + '%',
        top: (60 + Math.random() * 35) + '%',
      });
      d.style.setProperty('--ts-dx', (Math.random() * 40 - 20) + 'px');
      d.style.setProperty('--ts-dy', (-(100 + Math.random() * 130)) + 'px');
      d.style.setProperty('--ts-dust-op', (0.3 + Math.random() * 0.4).toFixed(2));
      d.style.animationDuration = (7 + Math.random() * 8) + 's';
      d.style.animationDelay = (Math.random() * 6) + 's';
      layer.appendChild(d);
    }
  }, []);

  // IntersectionObserver to activate/deactivate section
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const active = entry.isIntersecting && entry.intersectionRatio > 0.45;
        stateRef.current.active = active;
        setIsActive(active);
        if (active && !stateRef.current.hasOpened) {
          setTimeout(openCover, 600);
        }
      });
    }, { threshold: [0, 0.45, 0.9] });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Get all leaves from the book
  const getLeaves = () => {
    const book = bookRef.current;
    if (!book) return [];
    return Array.from(book.querySelectorAll('.ts-leaf')).map(el => ({
      el,
      index: parseInt(el.dataset.index, 10),
    })).sort((a, b) => a.index - b.index);
  };

  const updateZ = () => {
    const leaves = getLeaves();
    const total = leaves.length;
    const { currentSpread } = stateRef.current;
    leaves.forEach(({ el, index }) => {
      el.style.zIndex = index < currentSpread ? (total + index) : (total - index);
    });
  };

  const playPageSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); }
      const src = ctx.createBufferSource(); src.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 0.7;
      const gain = ctx.createGain(); gain.gain.value = 0.1;
      src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  };

  const animateLeaf = (leaf, isCover, forward) => {
    return new Promise(resolve => {
      const cls = isCover
        ? (forward ? 'ts-anim-cover-open' : 'ts-anim-cover-close')
        : (forward ? 'ts-anim-fwd' : 'ts-anim-bwd');
      leaf.classList.add(cls);
      const onDone = () => {
        leaf.removeEventListener('animationend', onDone);
        leaf.classList.remove(cls);
        resolve();
      };
      leaf.addEventListener('animationend', onDone);
    });
  };

  const openCover = async () => {
    if (stateRef.current.hasOpened) return;
    stateRef.current.hasOpened = true;
    stateRef.current.isAnimating = true;
    const leaves = getLeaves();
    if (!leaves.length) return;
    const cover = leaves[0].el;
    await animateLeaf(cover, true, true);
    cover.classList.add('ts-flipped');
    cover.style.left = '50%';
    stateRef.current.currentSpread = 1;
    updateZ();
    stateRef.current.isAnimating = false;
  };

  const triggerForward = async () => {
    const s = stateRef.current;
    const leaves = getLeaves();
    if (s.isAnimating || s.currentSpread >= leaves.length) return;
    s.isAnimating = true;
    playPageSound();
    const { el, index } = leaves[s.currentSpread];
    const isCover = index === 0;
    await animateLeaf(el, isCover, true);
    el.classList.add('ts-flipped');
    if (isCover) el.style.left = '50%';
    s.currentSpread++;
    updateZ();
    s.isAnimating = false;
  };

  const triggerBackward = async () => {
    const s = stateRef.current;
    if (s.isAnimating || s.currentSpread <= 0) return;
    s.isAnimating = true;
    playPageSound();
    s.currentSpread--;
    const { el, index } = getLeaves()[s.currentSpread];
    const isCover = index === 0;
    el.classList.remove('ts-flipped');
    if (isCover) el.style.left = '26%';
    await animateLeaf(el, isCover, false);
    updateZ();
    s.isAnimating = false;
  };

  const shouldRelease = (goingDown) => {
    const s = stateRef.current;
    if (!s.active) return true;
    const leaves = getLeaves();
    if (s.currentSpread === 0 && !goingDown) return true;
    if (s.currentSpread >= leaves.length && goingDown) return true;
    return false;
  };

  // Wheel + touch events
  useEffect(() => {
    const THRESHOLD = 55;

    const onWheel = (e) => {
      if (!stateRef.current.active) return;
      const down = e.deltaY > 0;
      if (shouldRelease(down)) { stateRef.current.wheelAccum = 0; return; }
      e.preventDefault();
      if (stateRef.current.isAnimating) return;
      stateRef.current.wheelAccum += e.deltaY;
      if (stateRef.current.wheelAccum > THRESHOLD) { stateRef.current.wheelAccum = 0; triggerForward(); }
      else if (stateRef.current.wheelAccum < -THRESHOLD) { stateRef.current.wheelAccum = 0; triggerBackward(); }
    };

    const onTouchStart = (e) => { stateRef.current.touchStartY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (!stateRef.current.active || stateRef.current.touchStartY === null) return;
      const delta = stateRef.current.touchStartY - e.touches[0].clientY;
      const down = delta > 0;
      if (shouldRelease(down)) return;
      e.preventDefault();
      if (stateRef.current.isAnimating) return;
      if (Math.abs(delta) > 45) {
        if (delta > 0) triggerForward(); else triggerBackward();
        stateRef.current.touchStartY = e.touches[0].clientY;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const [d1, d2, d3] = diaryEntries;

  return (
    <section
      ref={sectionRef}
      id="diary"
      className={`ts-diary-section${isActive ? ' ts-active' : ''}`}
      style={{ minHeight: '100vh' }}
    >
      {/* SVG symbol defs */}
      <div dangerouslySetInnerHTML={{ __html: SVG_DEFS }} />

      {/* Dust layer */}
      <div ref={dustRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }} />

      {/* Top Bar: archive label + CTA */}
      <div className="ts-top-bar">
        <div>
          <div style={{ fontFamily: "'Special Elite',monospace", fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: '#C8A24A', opacity: 0.85 }}>
            TANGY SESSIONS // ANTIQUE VINTAGE DIARY ARCHIVE
          </div>
          <p style={{ fontFamily: "'Old Standard TT',serif", fontStyle: 'italic', fontSize: 11, color: 'rgba(243,231,201,.85)', margin: '2px 0 0' }}>
            "Some stories deserve more than a caption."
          </p>
        </div>
        <a
          href="/blogs"
          style={{
            fontFamily: "'Special Elite',monospace", fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
            color: '#1E1A17', background: '#C8A24A', border: '2px solid #1E1A17',
            padding: '6px 14px', textDecoration: 'none', boxShadow: '3px 3px 0 #1E1A17', whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          TANGY DIARY → READ MORE
        </a>
      </div>

      {/* Book Stage */}
      <div className="ts-book-stage" style={{ zIndex: 10 }}>
        <div className="ts-book-shadow" />

        <div className="ts-book" ref={bookRef}>
          <div className="ts-book-back" />
          <div className="ts-spine-shadow" />

          {/* ── LEAF 0: COVER ── */}
          <div className="ts-leaf ts-cover-leaf" data-index="0" style={{ left: '26%' }}>
            <div className="ts-leaf-edge" />
            <div className="ts-face ts-face-front"><CoverFront /></div>
            <div className="ts-face ts-face-back"><CoverBack /></div>
          </div>

          {/* ── LEAF 1: Spread 1 — Bansilalpet Stepwell ── */}
          <div className="ts-leaf" data-index="1">
            <div className="ts-leaf-edge" />
            <div className="ts-face ts-face-front">
              <Spread1Front entry={d1 || { title: '', date: '', location: '', image: '', content: '' }} />
            </div>
            <div className="ts-face ts-face-back"><Spread1Back /></div>
          </div>

          {/* ── LEAF 2: Spread 2 — Monsoon Acoustic Sessions ── */}
          <div className="ts-leaf" data-index="2">
            <div className="ts-leaf-edge" />
            <div className="ts-face ts-face-front">
              <Spread2Front entry={d2 || { title: '', date: '', location: '', image: '', content: '' }} />
            </div>
            <div className="ts-face ts-face-back"><Spread2Back /></div>
          </div>

          {/* ── LEAF 3: Spread 3 — Behind the Microphones ── */}
          <div className="ts-leaf" data-index="3">
            <div className="ts-leaf-edge" />
            <div className="ts-face ts-face-front">
              <Spread3Front entry={d3 || { title: '', date: '', location: '', image: '', content: '' }} />
            </div>
            <div className="ts-face ts-face-back">
              <div className="ts-page lined" style={{ position: 'relative' }}>
                <div className="ts-section-head">Archive Notes</div>
                <p className="ts-quote" style={{ marginTop: 10, maxWidth: 185, fontSize: 14 }}>
                  "Real people, real stories, real music. That's all this ever was."
                </p>
                <svg style={{ width: 88, position: 'absolute', bottom: 52, left: 16, opacity: 0.7 }}><use href="#ts-wave" /></svg>
                <div className="ts-foot">Tangy Sessions — Hyderabad</div>
              </div>
            </div>
          </div>

          {/* ── LEAF 4: Final Page ── */}
          <div className="ts-leaf" data-index="4">
            <div className="ts-leaf-edge" />
            <div className="ts-face ts-face-front"><FinalPageFront /></div>
            <div className="ts-face ts-face-back"><FinalPageBack /></div>
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div className="ts-scroll-hint" onClick={triggerForward}>
        Scroll to turn the page ↓
      </div>

    </section>
  );
};
