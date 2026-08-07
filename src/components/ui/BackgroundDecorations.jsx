// Modular SVG & CSS Decorative Texture & Print Archive Utilities for Tangy World

// 1. Notebook / Graph Grid Pattern (Faint 24px Grid)
export const NotebookGridPattern = ({ opacity = 0.08, className = "" }) => (
  <div className={`absolute inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="notebook-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#11100C" strokeWidth="0.75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#notebook-grid)" />
    </svg>
  </div>
);

// 2. Music Manuscript 5-Line Staff Pattern
export const MusicManuscriptPattern = ({ opacity = 0.06, color = "#E7D5A4", className = "" }) => (
  <div className={`absolute inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="music-staff" width="100" height="72" patternUnits="userSpaceOnUse">
          <line x1="0" y1="12" x2="100" y2="12" stroke={color} strokeWidth="1" />
          <line x1="0" y1="20" x2="100" y2="20" stroke={color} strokeWidth="1" />
          <line x1="0" y1="28" x2="100" y2="28" stroke={color} strokeWidth="1" />
          <line x1="0" y1="36" x2="100" y2="36" stroke={color} strokeWidth="1" />
          <line x1="0" y1="44" x2="100" y2="44" stroke={color} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#music-staff)" />
    </svg>
  </div>
);

// 3. Backstage Blueprint Grid Pattern
export const BlueprintGridPattern = ({ opacity = 0.08, className = "" }) => (
  <div className={`absolute inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="blueprint-small" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#E7D5A4" strokeWidth="0.5" />
        </pattern>
        <pattern id="blueprint-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="url(#blueprint-small)" />
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E7D5A4" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
    </svg>
  </div>
);

// 4. Warped Retro Checkerboard Ribbon Pattern Accent (8% Opacity)
export const WarpedCheckerPattern = ({ opacity = 0.08, className = "" }) => (
  <div className={`absolute inset-0 pointer-events-none z-0 mix-blend-overlay ${className}`} style={{ opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="checker-pattern" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
          <rect width="20" height="20" fill="#11100C" />
          <rect x="20" width="20" height="20" fill="#E7D5A4" />
          <rect y="20" width="20" height="20" fill="#E7D5A4" />
          <rect x="20" y="20" width="20" height="20" fill="#11100C" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#checker-pattern)" />
    </svg>
  </div>
);

// 5. Red-and-White Gingham Fabric Ribbon Pattern
export const GinghamRibbonPattern = ({ opacity = 0.85, className = "" }) => (
  <div className={`pointer-events-none z-10 ${className}`} style={{ opacity }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="gingham-check" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#F5E9C9" />
          <rect width="8" height="16" fill="#C2272A" fillOpacity="0.45" />
          <rect y="0" width="16" height="8" fill="#C2272A" fillOpacity="0.45" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gingham-check)" />
    </svg>
  </div>
);

// 6. Sound Wave Frequency Graphic (Replaces Botanical Stems with Sonic Frequency Waves)
export const SoundWaveGraphic = ({ color = "#E7D5A4", opacity = 0.25, className = "" }) => (
  <svg 
    viewBox="0 0 240 360" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`pointer-events-none z-0 ${className}`}
    style={{ opacity }}
  >
    <g stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="20" y1="180" x2="20" y2="200" />
      <line x1="35" y1="160" x2="35" y2="220" />
      <line x1="50" y1="120" x2="50" y2="260" />
      <line x1="65" y1="80" x2="65" y2="290" />
      <line x1="80" y1="40" x2="80" y2="330" />
      <line x1="95" y1="10" x2="95" y2="350" strokeWidth="3" />
      <line x1="110" y1="50" x2="110" y2="320" />
      <line x1="125" y1="90" x2="125" y2="280" />
      <line x1="140" y1="130" x2="140" y2="240" />
      <line x1="155" y1="150" x2="155" y2="220" />
      <line x1="170" y1="110" x2="170" y2="270" />
      <line x1="185" y1="70" x2="185" y2="300" />
      <line x1="200" y1="120" x2="200" y2="250" />
      <line x1="215" y1="160" x2="215" y2="210" />
    </g>
  </svg>
);

// Fallback compatibility aliases for any legacy references
export const BotanicalRoseStem = ({ className = "" }) => (
  <SoundWaveGraphic color="#B94717" opacity={0.35} className={className} />
);

export const BotanicalRoseInk = ({ color = "#E7D5A4", opacity = 0.12, className = "" }) => (
  <SoundWaveGraphic color={color} opacity={opacity} className={className} />
);

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

// 11. Vintage Coffee Ring Stain Accent
export const CoffeeStain = ({ className = "", style = {} }) => (
  <div 
    className={`absolute rounded-full border-[12px] border-[#5A2B15]/20 opacity-30 pointer-events-none mix-blend-multiply ${className}`}
    style={style}
  />
);

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
