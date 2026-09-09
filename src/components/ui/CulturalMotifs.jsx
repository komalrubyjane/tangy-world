// Original Tangy-specific graphics inspired by Indian textile/print culture —
// Bandhani tie-dye dot fields, Rangoli radial geometry, lotus stamp motifs,
// woven textile border trims, and sketchy hand-drawn annotation marks.
// Everything here is hand-authored SVG/CSS, not traced from any reference image.

// 1. Bandhani-inspired dot field — deliberately irregular dot sizes/offsets
// within the repeating tile so it reads as hand-tied fabric, not a grid.
export const BandhaniDotField = ({
  color = '#ECDCAF',
  opacity = 0.08,
  size = 46,
  className = '',
}) => (
  <div className={`absolute inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }} aria-hidden="true">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="bandhani-dots" width={size} height={size} patternUnits="userSpaceOnUse" patternTransform="rotate(6)">
          <circle cx={size * 0.22} cy={size * 0.24} r={size * 0.05} fill={color} />
          <circle cx={size * 0.62} cy={size * 0.18} r={size * 0.035} fill={color} />
          <circle cx={size * 0.82} cy={size * 0.52} r={size * 0.06} fill={color} />
          <circle cx={size * 0.4} cy={size * 0.56} r={size * 0.04} fill={color} />
          <circle cx={size * 0.14} cy={size * 0.78} r={size * 0.045} fill={color} />
          <circle cx={size * 0.7} cy={size * 0.86} r={size * 0.035} fill={color} />
          <circle cx={size * 0.94} cy={size * 0.92} r={size * 0.05} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bandhani-dots)" />
    </svg>
  </div>
);

// 2. Rangoli medallion — original 8-fold symmetric radial geometry (petals,
// dots, concentric rings). `drawClassName` tags the outer stroke path so a
// parent GSAP timeline can animate strokeDashoffset for a "drawn on" reveal;
// left undrawn (fully visible) by default.
export const RangoliMedallion = ({ color = '#D19A24', className = '', drawClassName = '' }) => {
  const petals = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g stroke={color} fill="none" strokeWidth="1.2" opacity="0.9">
        <circle cx="100" cy="100" r="88" className={drawClassName} strokeDasharray="553" />
        <circle cx="100" cy="100" r="66" opacity="0.6" />
        <circle cx="100" cy="100" r="8" fill={color} stroke="none" />
      </g>
      {petals.map((_, i) => (
        <g key={i} transform={`rotate(${i * 45} 100 100)`}>
          <path
            d="M100 100 C 112 70, 112 40, 100 18 C 88 40, 88 70, 100 100 Z"
            fill="none"
            stroke={color}
            strokeWidth="1.1"
            opacity="0.75"
          />
          <circle cx="100" cy="32" r="3" fill={color} opacity="0.85" />
        </g>
      ))}
    </svg>
  );
};

// 3. Lotus motif — simplified original line-art lotus, sized for use as a
// small corner stamp / section marker rather than a hero illustration.
export const LotusMotif = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M32 46 C 20 40, 16 28, 20 16 C 26 24, 30 32, 32 46 Z" />
      <path d="M32 46 C 44 40, 48 28, 44 16 C 38 24, 34 32, 32 46 Z" />
      <path d="M32 46 C 26 34, 26 22, 32 10 C 38 22, 38 34, 32 46 Z" opacity="0.85" />
      <path d="M14 48 C 22 52, 42 52, 50 48" opacity="0.7" />
    </g>
  </svg>
);

// 4. Textile border strip — a woven-trim diamond repeat, thin full-width
// divider standing in for a plain rule/border.
export const TextileBorderStrip = ({
  colorA = '#D19A24',
  colorB = '#11100C',
  height = 12,
  className = '',
}) => (
  <div className={`w-full overflow-hidden pointer-events-none select-none ${className}`} style={{ height }} aria-hidden="true">
    <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="textile-diamond" width="22" height={height} patternUnits="userSpaceOnUse">
          <rect width="22" height={height} fill={colorB} />
          <path d={`M11 1 L20 ${height / 2} L11 ${height - 1} L2 ${height / 2} Z`} fill={colorA} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#textile-diamond)" />
    </svg>
  </div>
);

// 5. Sketchy hand-drawn accents — wobbly, slightly-doubled strokes rather
// than perfect geometry, for sparing editorial annotation use.
export const HandDrawnCircle = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <path
      d="M50 8 C 74 6, 92 24, 91 49 C 90 75, 71 93, 48 92 C 24 91, 7 72, 9 48 C 11 25, 27 9, 50 8 Z"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M49 12 C 71 11, 87 28, 87 49"
      fill="none"
      stroke={color}
      strokeWidth="1"
      opacity="0.5"
      strokeLinecap="round"
    />
  </svg>
);

export const HandDrawnArrow = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 120 60" className={className} aria-hidden="true">
    <path
      d="M4 40 C 30 44, 60 20, 92 22"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path d="M76 12 C 84 16, 90 19, 94 22 C 89 26, 84 31, 79 38" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HandDrawnUnderline = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 200 20" preserveAspectRatio="none" className={className} aria-hidden="true">
    <path
      d="M3 12 C 40 6, 90 16, 130 9 C 155 5, 178 12, 197 8"
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// 6. Registration mark — the print-shop crosshair (circle + cross) used to check
// colour-plate alignment. A pure graphic mark; never placed over a photograph.
export const RegistrationMark = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <circle cx="20" cy="20" r="8" fill="none" stroke={color} strokeWidth="1.4" />
    <line x1="20" y1="0" x2="20" y2="40" stroke={color} strokeWidth="1.2" />
    <line x1="0" y1="20" x2="40" y2="20" stroke={color} strokeWidth="1.2" />
  </svg>
);

// 7. Paper label — a small taped/stapled rectangular tag for archival metadata
// ("EST. 2016", "ISSUE 001", "SIDE A"...). Distinct from ArchiveStamp's inked
// stamp look — this one reads as a printed sticker with a folded top edge.
export const PaperLabel = ({ text, rotation = '-2deg', color = '#E9DECB', textColor = '#241A12', className = '' }) => (
  <div
    style={{ transform: `rotate(${rotation})`, backgroundColor: color, color: textColor }}
    className={`relative inline-block font-mono text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest shadow-md pointer-events-none select-none border border-black/20 ${className}`}
  >
    <span className="absolute -top-[3px] left-[18%] w-[30%] h-[7px] bg-black/10 -rotate-2" aria-hidden="true" />
    {text}
  </div>
);

// 8. Halftone texture — a pure dot-screen background/panel pattern (screen-print
// newsprint look). A graphic in its own right, never layered on top of a photo.
export const HalftoneTexture = ({ color = '#11100C', opacity = 0.5, dotSize = 4, className = '' }) => (
  <div
    className={`absolute inset-0 pointer-events-none ${className}`}
    style={{
      backgroundImage: `radial-gradient(circle, ${color} 30%, transparent 32%)`,
      backgroundSize: `${dotSize}px ${dotSize}px`,
      opacity,
    }}
    aria-hidden="true"
  />
);

// 9. Film grain — formalises the site's noise.png texture as a reusable, subtle
// atmospheric layer (never targeted at a specific photo).
export const FilmGrain = ({ opacity = 0.1, blend = 'overlay', className = '' }) => (
  <div
    className={`absolute inset-0 pointer-events-none bg-[url('/noise.png')] ${className}`}
    style={{ opacity, mixBlendMode: blend }}
    aria-hidden="true"
  />
);

// 10. Retro poster frame — an inset border with four registration marks at the
// corners, turning any container into a "printed sheet." Pure chrome around
// whatever's inside; never wraps or masks the content itself.
export const RetroPosterFrame = ({ color = '#ECDCAF', inset = 14, className = '' }) => (
  <div className={`absolute pointer-events-none ${className}`} style={{ inset, border: `1.5px solid ${color}`, opacity: 0.35 }} aria-hidden="true">
    <RegistrationMark color={color} className="absolute -top-[10px] -left-[10px] w-5 h-5 opacity-100" />
    <RegistrationMark color={color} className="absolute -top-[10px] -right-[10px] w-5 h-5 opacity-100" />
    <RegistrationMark color={color} className="absolute -bottom-[10px] -left-[10px] w-5 h-5 opacity-100" />
    <RegistrationMark color={color} className="absolute -bottom-[10px] -right-[10px] w-5 h-5 opacity-100" />
  </div>
);

// Aliases matching the exact names requested for the retro design system, so
// either name can be imported interchangeably.
export const BandhaniPattern = BandhaniDotField;
export const RangoliMotif = RangoliMedallion;
export const LotusStamp = LotusMotif;
