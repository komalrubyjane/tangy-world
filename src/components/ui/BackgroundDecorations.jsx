// Modular SVG & CSS Decorative Texture Utilities for Tangy World Background System Redesign

// 1. Notebook / Graph Grid Pattern (Faint 12px Grid)
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
export const BlueprintGridPattern = ({ opacity = 0.07, className = "" }) => (
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

// 4. Subtle Warped Checkerboard Ribbon Pattern Accent (8% Opacity)
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

// 5. Vintage Botanical Ink Rose & Leaves Line Art SVG
export const BotanicalRoseInk = ({ color = "#E7D5A4", opacity = 0.12, className = "" }) => (
  <svg 
    viewBox="0 0 240 320" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`pointer-events-none z-0 ${className}`} 
    style={{ opacity }}
  >
    {/* Detailed Hand-Drawn Vintage Rose Outline */}
    <g stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Rose Petals Outer & Inner */}
      <path d="M 120 70 C 100 40, 140 20, 150 50 C 170 30, 190 70, 160 90 C 180 120, 140 140, 120 110 C 100 130, 70 100, 90 80 C 70 50, 100 30, 120 70 Z" />
      <path d="M 120 60 C 110 45, 135 35, 140 55 C 150 45, 160 65, 145 75 C 155 90, 135 100, 120 85 C 110 95, 95 80, 105 70 Z" />
      <path d="M 120 65 C 115 58, 128 52, 130 62 C 136 56, 142 68, 132 72 C 138 82, 125 88, 120 78 Z" fill={color} fillOpacity="0.15" />
      
      {/* Stem & Thorns */}
      <path d="M 120 110 Q 115 170, 125 240 T 115 310" strokeWidth="2.2" />
      <path d="M 122 140 L 134 132 L 123 150 Z" fill={color} />
      <path d="M 119 180 L 106 174 L 118 190 Z" fill={color} />
      <path d="M 124 220 L 138 214 L 125 232 Z" fill={color} />

      {/* Leaves with Veins */}
      <path d="M 122 155 Q 160 140, 185 165 Q 150 185, 122 155 Z" />
      <path d="M 122 155 Q 155 162, 185 165" />
      <path d="M 140 159 L 148 152" />
      <path d="M 155 161 L 165 153" />
      <path d="M 170 163 L 178 157" />

      <path d="M 119 195 Q 80 180, 55 205 Q 90 225, 119 195 Z" />
      <path d="M 119 195 Q 85 202, 55 205" />
      <path d="M 100 199 L 92 192" />
      <path d="M 85 201 L 75 193" />
      <path d="M 70 203 L 62 197" />
    </g>
  </svg>
);

// 6. SVG Deckle / Torn Paper Edge Overlay
export const TornPaperEdgeTop = ({ fill = "#F5E9C9", className = "" }) => (
  <div className={`absolute top-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none ${className}`}>
    <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="w-full h-4 md:h-6" fill={fill}>
      <path d="M0,0 L0,18 Q40,5 80,16 Q120,28 160,12 Q200,4 240,19 Q280,26 320,10 Q360,2 400,18 Q440,24 480,8 Q520,3 560,22 Q600,29 640,11 Q680,4 720,17 Q760,25 800,9 Q840,3 880,21 Q920,28 960,12 Q1000,4 1040,18 Q1080,24 1120,10 Q1160,5 1200,20 L1200,0 Z" />
    </svg>
  </div>
);

// 7. Tactile Masking Tape Strip
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

// 8. Vintage Coffee Ring Stain Accent
export const CoffeeStain = ({ className = "", style = {} }) => (
  <div 
    className={`absolute rounded-full border-[12px] border-[#5A2B15]/20 opacity-30 pointer-events-none mix-blend-multiply ${className}`}
    style={style}
  />
);

// 9. Paper Clip Graphic Accent
export const PaperClip = ({ className = "" }) => (
  <div className={`absolute z-30 pointer-events-none w-3.5 h-10 border-2 border-[#333] rounded-full shadow-sm ${className}`} />
);

// 10. Red PushPin Graphic Accent
export const PushPin = ({ className = "" }) => (
  <div className={`absolute z-30 pointer-events-none flex flex-col items-center ${className}`}>
    <div className="w-4 h-4 rounded-full bg-[#C2272A] border-2 border-[#11100C] shadow-md flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-[#F5E9C9] opacity-80" />
    </div>
    <div className="w-0.5 h-2.5 bg-[#11100C]" />
  </div>
);
