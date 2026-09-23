// Modular SVG & CSS Decorative Texture & Print Archive Utilities for Tangy World

// 1–6. Full-area background patterns (notebook grid, music staff, blueprint
// grid, warped checker, gingham, sound-wave) — RETIRED. Each section used to
// layer one of these behind its content on top of a textile photo and grain;
// the system is now one solid background family + optional static grain.
// Kept as no-ops so existing imports across pages stay valid.
export const NotebookGridPattern = () => null;
export const MusicManuscriptPattern = () => null;
export const BlueprintGridPattern = () => null;
export const WarpedCheckerPattern = () => null;
export const GinghamRibbonPattern = () => null;
export const SoundWaveGraphic = () => null;
export const BotanicalRoseStem = () => null;
export const BotanicalRoseInk = () => null;

// 7. Vintage Cassette Tape & Reel Label Graphic
export const CassetteTapeGraphic = ({ className = "" }) => (
  <div className={`pointer-events-none z-10 bg-[#11100C] text-[#E7D5A4] p-3 border-2 border-[#E7D5A4] shadow-xl rotate-[-4deg] ${className}`}>
    <div className="flex justify-between font-mono text-[8px] border-b border-[#E7D5A4]/40 pb-1 mb-2 font-bold uppercase">
      <span>TANGY AUDIO REEL</span>
      <span>60 MIN</span>
    </div>
    <div className="flex items-center justify-around bg-[#E7D5A4] text-[#11100C] p-2 border border-[#11100C]">
      <div className="w-6 h-6 rounded-full border-2 border-[#11100C] border-dashed animate-spin" />
      <span className="font-mono text-[7px] font-bold tracking-widest uppercase">SIDE A</span>
      <div className="w-6 h-6 rounded-full border-2 border-[#11100C] border-dashed animate-spin" />
    </div>
  </div>
);

// Fallback export for FloralCutoutAccent so legacy imports output Cassette Tape / Reel label
export const FloralCutoutAccent = ({ className = "" }) => (
  <CassetteTapeGraphic className={className} />
);

// 8. Torn Newspaper Fragment Graphic
export const TornNewspaperScrap = ({ className = "" }) => (
  <div className={`pointer-events-none z-10 bg-[#E7D5A4] p-3 border border-[#11100C]/40 shadow-md rotate-[-3deg] ${className}`}>
    <div className="font-mono text-[7px] text-[#11100C]/70 leading-tight uppercase tracking-tighter">
      <div>HYDERABAD DAILY PRESS // ISSUE 1974</div>
      <div className="border-b border-[#11100C]/30 my-1" />
      <p className="font-serif italic normal-case text-[9px] text-[#11100C] leading-snug">
        "Secret concerts held under full moon arches..."
      </p>
    </div>
  </div>
);

// 9. SVG Deckle / Torn Paper Edge Overlay
export const TornPaperEdgeTop = ({ fill = "#F5E9C9", className = "" }) => (
  <div className={`absolute top-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none ${className}`}>
    <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="w-full h-4 md:h-6" fill={fill}>
      <path d="M0,0 L0,18 Q40,5 80,16 Q120,28 160,12 Q200,4 240,19 Q280,26 320,10 Q360,2 400,18 Q440,24 480,8 Q520,3 560,22 Q600,29 640,11 Q680,4 720,17 Q760,25 800,9 Q840,3 880,21 Q920,28 960,12 Q1000,4 1040,18 Q1080,24 1120,10 Q1160,5 1200,20 L1200,0 Z" />
    </svg>
  </div>
);

// 10. Tactile Masking Tape Strip
export const TapeStrip = ({ className = "", style = {} }) => (
  <div 
    className={`absolute z-30 pointer-events-none bg-[rgba(231,213,164,0.85)] border border-black/25 shadow-xs ${className}`}
    style={{
      backdropFilter: 'blur(1px)',
      boxShadow: 'inset 0 0 4px rgba(0,0,0,0.15)',
      ...style
    }}
  />
);

// 11. Coffee ring stain — retired (pure decoration, used a blend mode). No-op.
export const CoffeeStain = () => null;

// 12. Paper Clip Graphic Accent
export const PaperClip = ({ className = "" }) => (
  <div className={`absolute z-30 pointer-events-none w-3.5 h-10 border-2 border-slate-700 rounded-full shadow-sm ${className}`} />
);

// 13. Red PushPin Graphic Accent
export const PushPin = ({ className = "" }) => (
  <div className={`absolute z-30 pointer-events-none flex flex-col items-center ${className}`}>
    <div className="w-4 h-4 rounded-full bg-[#C2272A] border-2 border-[#11100C] shadow-md flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-[#F5E9C9] opacity-80" />
    </div>
    <div className="w-0.5 h-2.5 bg-[#11100C]" />
  </div>
);

// 14. Pressed Dried Flower Illustration with Stem & Tape
export const PressedFlower = ({ className = "" }) => (
  <div className={`pointer-events-none z-20 flex flex-col items-center ${className}`}>
    <svg width="48" height="80" viewBox="0 0 48 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
      <path d="M 24 75 Q 22 45, 24 15" stroke="#685438" strokeWidth="2" strokeLinecap="round" />
      <path d="M 24 45 Q 15 35, 10 38" stroke="#52422B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 24 55 Q 33 48, 38 52" stroke="#52422B" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="12" r="5" fill="#B38F46" />
      <circle cx="18" cy="18" r="4" fill="#8C6E30" />
      <circle cx="30" cy="18" r="4" fill="#A48239" />
      <circle cx="10" cy="38" r="3" fill="#6B5424" />
      <circle cx="38" cy="52" r="3" fill="#6B5424" />
    </svg>
    <div className="w-10 h-3 bg-[rgba(231,213,164,0.85)] border border-black/20 shadow-xs -mt-10 rotate-[-4deg]" />
  </div>
);

// 15. Tangy Sessions Performer Pass Ticket Stub
export const PerformerPassStub = ({ date = "21/09/75", className = "" }) => (
  <div className={`pointer-events-none z-20 bg-[#D3B480] text-[#3D2517] p-2.5 border border-[#3D2517] shadow-md font-mono text-[8px] font-bold flex flex-col gap-1 uppercase rotate-[-2deg] ${className}`}>
    <div className="border-b border-[#3D2517]/40 pb-1 flex justify-between tracking-widest">
      <span>TANGY SESSIONS</span>
      <span>1974</span>
    </div>
    <div className="text-[9px] font-black tracking-wider text-[#7C2D18]">PERFORMER PASS</div>
    <div className="text-[7.5px] opacity-80">BACKSTAGE ACCESS</div>
    <div className="border-t border-[#3D2517]/40 pt-1 text-[7px] flex justify-between">
      <span>DATE: {date}</span>
      <span>VALID ✦</span>
    </div>
  </div>
);
