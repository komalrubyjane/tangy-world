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

// 11. Archive number — the oversized outline numeral (transparent fill, stroked
// outline) used as a poster-feature background mark. Purely typographic —
// never placed as a filled block over a photograph.
export const ArchiveNumber = ({ children, color = '#ECDCAF', size = 'clamp(70px,12vw,180px)', strokeWidth = '2px', className = '' }) => (
  <span
    className={`font-display font-black leading-none text-transparent pointer-events-none select-none ${className}`}
    style={{ fontSize: size, WebkitTextStroke: `${strokeWidth} ${color}` }}
    aria-hidden="true"
  >
    {children}
  </span>
);

// 12. Risograph offset — wraps a heading/graphic and prints one or two colour-
// shifted duplicate copies behind it at a slight offset, the misregistered-
// ink-pass look. Only ever wraps typography/graphics, never a photograph.
export const RisographOffset = ({ children, colors = ['#D91E18'], offsets = [[6, -4]], opacity = 0.35, className = '' }) => (
  <span className={`relative inline-block ${className}`}>
    {colors.map((color, i) => {
      const [x, y] = offsets[i] || offsets[0];
      return (
        <span
          key={i}
          className="absolute inset-0 -z-10 mix-blend-screen pointer-events-none select-none"
          style={{ color, opacity, transform: `translate(${x}px, ${y}px)` }}
          aria-hidden="true"
        >
          {children}
        </span>
      );
    })}
    {children}
  </span>
);

// 13. Vintage film frame — a sprocket-hole border for wrapping a photo without
// ever touching the photo's own pixels; the holes sit outside/beside it.
export const VintageFilmFrame = ({ color = '#11100C', holeColor = '#ECDCAF', className = '' }) => {
  const holes = Array.from({ length: 8 });
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <div className="absolute inset-0 border-y-[10px]" style={{ borderColor: color }} />
      {['left-[2px]', 'right-[2px]'].map((side) => (
        <div key={side} className={`absolute ${side} top-0 bottom-0 w-[6px] flex flex-col justify-between py-1`}>
          {holes.map((_, i) => (
            <span key={i} className="block w-[6px] h-[4px] rounded-[1px]" style={{ backgroundColor: holeColor }} />
          ))}
        </div>
      ))}
    </div>
  );
};

// 14. Colour block — a diagonal clip-path spot-colour panel, formalising the
// asymmetric colour-blocking used across the Music sections.
export const ColorBlock = ({ color = '#D1A437', angle = 12, origin = 'bottom-left', className = '' }) => {
  const clipPaths = {
    'bottom-left': `polygon(0 100%, 0 ${angle}%, 100% 100%)`,
    'bottom-right': `polygon(100% 100%, 100% ${angle}%, 0 100%)`,
    'top-left': `polygon(0 0, 100% 0, 0 ${100 - angle}%)`,
    'top-right': `polygon(100% 0, 100% ${100 - angle}%, 0 0)`,
  };
  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{ backgroundColor: color, clipPath: clipPaths[origin] || clipPaths['bottom-left'] }}
      aria-hidden="true"
    />
  );
};

// 15. Dotted border — a simple repeating-dot rule, distinct from the diamond-
// weave TextileBorderStrip; for lighter/smaller edge treatments.
export const DottedBorder = ({ color = '#D19A24', height = 6, gap = 10, className = '' }) => (
  <div
    className={`w-full pointer-events-none ${className}`}
    style={{
      height,
      backgroundImage: `radial-gradient(circle, ${color} 35%, transparent 38%)`,
      backgroundSize: `${gap}px ${height}px`,
      backgroundRepeat: 'repeat-x',
    }}
    aria-hidden="true"
  />
);

// 16. Retro flower — an original 6-petal Indian floral motif distinct from the
// lotus (rounder, more symmetric, botanical-print in character). Scales from
// tiny decoration to huge partially-cropped background graphic.
export const RetroFlower = ({ color = '#ECDCAF', className = '' }) => {
  const petals = Array.from({ length: 6 });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="none" stroke={color} strokeWidth="1.3">
        {petals.map((_, i) => (
          <ellipse key={i} cx="50" cy="26" rx="11" ry="22" transform={`rotate(${i * 60} 50 50)`} opacity="0.85" />
        ))}
        <circle cx="50" cy="50" r="7" fill={color} stroke="none" opacity="0.9" />
        <circle cx="50" cy="50" r="12" opacity="0.5" />
      </g>
    </svg>
  );
};

// 17. Floral cluster — three RetroFlowers at varying scale/rotation grouped
// into one loose botanical spray, for corner/edge decoration.
export const FloralCluster = ({ color = '#ECDCAF', className = '' }) => (
  <div className={`relative pointer-events-none ${className}`} aria-hidden="true">
    <RetroFlower color={color} className="absolute top-0 left-0 w-[60%] h-[60%] opacity-90" />
    <RetroFlower color={color} className="absolute bottom-0 right-0 w-[45%] h-[45%] opacity-70 rotate-[20deg]" />
    <RetroFlower color={color} className="absolute bottom-[10%] left-[20%] w-[35%] h-[35%] opacity-55 -rotate-[15deg]" />
  </div>
);

// 18. Floral medallion — a circular Rangoli-style ring with flowers set inside,
// a large decorative composition rather than a small stamp.
export const FloralMedallion = ({ color = '#D19A24', className = '' }) => (
  <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
    <g stroke={color} fill="none" strokeWidth="1.1" opacity="0.85">
      <circle cx="100" cy="100" r="94" />
      <circle cx="100" cy="100" r="76" opacity="0.5" />
    </g>
    {Array.from({ length: 8 }).map((_, i) => (
      <g key={i} transform={`rotate(${i * 45} 100 100)`}>
        <ellipse cx="100" cy="52" rx="14" ry="26" stroke={color} fill="none" strokeWidth="1.1" opacity="0.75" />
      </g>
    ))}
    <circle cx="100" cy="100" r="14" fill={color} opacity="0.9" />
    <circle cx="100" cy="100" r="20" stroke={color} fill="none" strokeWidth="1" opacity="0.6" />
  </svg>
);

// 19. Flower stamp — a small wax-seal-style circular badge with a flower inside,
// for corner ornaments where a lotus-in-a-circle feels too repetitive.
export const FlowerStamp = ({ bg = '#5A120D', color = '#ECDCAF', border = '#D19A24', className = '' }) => (
  <div
    className={`rounded-full flex items-center justify-center shadow-lg pointer-events-none select-none ${className}`}
    style={{ backgroundColor: bg, border: `2px solid ${border}` }}
    aria-hidden="true"
  >
    <RetroFlower color={color} className="w-[65%] h-[65%]" />
  </div>
);

// 20. Flower border — a repeating small-flower rule, an alternative to the
// diamond-weave TextileBorderStrip for a softer, botanical edge treatment.
export const FlowerBorder = ({ color = '#D19A24', bg = '#11100C', height = 20, orientation = 'horizontal', className = '' }) => (
  <div
    className={`${orientation === 'vertical' ? 'h-full' : 'w-full'} overflow-hidden pointer-events-none select-none ${className}`}
    style={orientation === 'vertical' ? { width: height, backgroundColor: bg } : { height, backgroundColor: bg }}
    aria-hidden="true"
  >
    <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="flower-border-repeat"
          width={orientation === 'vertical' ? height : height * 1.6}
          height={orientation === 'vertical' ? height * 1.6 : height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={height * 0.8} cy={height / 2} r={height * 0.1} fill={color} />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60 * Math.PI) / 180;
            const cx = height * 0.8 + Math.cos(angle) * height * 0.22;
            const cy = height / 2 + Math.sin(angle) * height * 0.22;
            return <ellipse key={i} cx={cx} cy={cy} rx={height * 0.09} ry={height * 0.16} fill="none" stroke={color} strokeWidth="0.8" transform={`rotate(${i * 60} ${cx} ${cy})`} />;
          })}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#flower-border-repeat)" />
    </svg>
  </div>
);

// 21. Rangoli corner — a quarter-mandala ornament anchored to a corner (via the
// className's positioning), for framing sections/cards without a full medallion.
export const RangoliCorner = ({ color = '#D19A24', className = '' }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <g stroke={color} fill="none" strokeWidth="1.2" opacity="0.85">
      <path d="M0,100 A100,100 0 0,0 100,0" />
      <path d="M0,78 A78,78 0 0,0 78,0" opacity="0.6" />
      <path d="M0,54 A54,54 0 0,0 54,0" opacity="0.4" />
    </g>
    {[18, 45, 72].map((d, i) => (
      <circle key={i} cx={d} cy={100 - d} r="3" fill={color} opacity="0.8" />
    ))}
  </svg>
);

// 22. Ticket frame — a perforated/notched edge (dashed line + two half-circle
// notches) formalising the ticket-stub language used in Events, reusable
// anywhere a "physical ticket" edge is wanted.
export const TicketFrame = ({ color = '#11100C', bg = '#E7D5A4', position = 'right', offset = '16%', className = '' }) => {
  const isVertical = position === 'right' || position === 'left';
  return (
    <div className={`absolute pointer-events-none ${className}`} style={isVertical ? { [position]: offset, top: 0, bottom: 0 } : { [position]: offset, left: 0, right: 0 }} aria-hidden="true">
      <div className={isVertical ? 'relative h-full w-0 border-r-2 border-dashed' : 'relative w-full h-0 border-b-2 border-dashed'} style={{ borderColor: `${color}66` }}>
        <span className="absolute rounded-full" style={isVertical ? { top: -8, left: -8, width: 16, height: 16, backgroundColor: bg, border: `2px solid ${color}` } : { left: -8, top: -8, width: 16, height: 16, backgroundColor: bg, border: `2px solid ${color}` }} />
        <span className="absolute rounded-full" style={isVertical ? { bottom: -8, left: -8, width: 16, height: 16, backgroundColor: bg, border: `2px solid ${color}` } : { right: -8, top: -8, width: 16, height: 16, backgroundColor: bg, border: `2px solid ${color}` }} />
      </div>
    </div>
  );
};

// 23. Scribble — a loose, energetic freeform mark distinct from the cleaner
// HandDrawnCircle/Underline — for a rougher annotation moment.
export const Scribble = ({ color = '#ECDCAF', className = '' }) => (
  <svg viewBox="0 0 100 60" className={className} aria-hidden="true">
    <path
      d="M6 40 C 18 12, 30 50, 42 22 C 50 4, 58 46, 70 18 C 78 2, 86 34, 94 20"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// Aliases matching the exact names requested for the retro design system, so
// either name can be imported interchangeably.
export const BandhaniPattern = BandhaniDotField;
export const TextilePattern = TextileBorderStrip;
export const RangoliMotif = RangoliMedallion;
export const LotusStamp = LotusMotif;
export const ScribbleUnderline = HandDrawnUnderline;
export const RegistrationMarks = RegistrationMark;
export const EditorialLabel = PaperLabel;
export const ScreenPrintTexture = HalftoneTexture;
export const GeometricFrame = RetroPosterFrame;
export const RetroLotus = LotusMotif;
export const FilmStrip = VintageFilmFrame;
export const PosterBlock = ColorBlock;
export const Rangoli = RangoliMedallion;
export const BandhaniBorder = DottedBorder;
export const HalftoneFrame = VintageFilmFrame;
export const PrintShadow = ({ children, className = '', color = '#11100C', offset = 6 }) => (
  <div className={className} style={{ filter: `drop-shadow(${offset}px ${offset}px 0 ${color})` }}>{children}</div>
);
