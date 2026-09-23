// Reusable components that display the REAL supplied reference images (see
// src/data/retroAssets.js) as physical print pieces — paper fragments, taped
// poster scraps, circular medallions, stamps — around existing content.
//
// HARD RULE: nothing here ever applies a colour-altering filter (grayscale,
// sepia, hue-rotate, contrast, brightness, mix-blend-mode tinting) to one of
// these real images. Every <img> below renders unfiltered. Framing (borders,
// rotation, shadow, tape, torn edges) is achieved with surrounding markup, not
// by processing the image itself. Texture *overlays* (RetroGrain) are a
// separate decorative layer next to/behind content, never on top of a photo.

import { pickAsset } from '../../data/retroAssets';

// 1. RetroImage — the base building block: a real image framed as a printed
// paper piece (border, hard offset shadow, slight rotation). Every other
// component here is a styled variant of this.
export const RetroImage = ({
  category,
  index = 0,
  src,
  alt = '',
  rotate = -2,
  frame = 'paper', // 'paper' | 'circle' | 'none'
  tape = false,
  shadow = true,
  className = '',
  imgClassName = '',
}) => {
  const resolvedSrc = src || pickAsset(category, index);
  if (!resolvedSrc) return null;

  const frameClasses = {
    paper: 'p-2 bg-[#F5E9C9] border-2 border-[#11100C]',
    circle: 'p-0 rounded-full overflow-hidden border-2 border-[#11100C]',
    none: '',
  };

  return (
    <div
      className={`relative inline-block ${frameClasses[frame] || ''} ${shadow ? 'shadow-[6px_6px_0px_rgba(17,16,12,0.55)]' : ''} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-[rgba(231,213,164,0.8)] border border-black/25 pointer-events-none"
          style={{ transform: 'rotate(-3deg)' }}
          aria-hidden="true"
        />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`block w-full h-full object-cover ${frame === 'circle' ? 'rounded-full' : ''} ${imgClassName}`}
      />
    </div>
  );
};

// 2. PatternBackground — a real textile/Bandhani/Rangoli photograph tiled or
// cropped as a section/card background layer, replacing a generated pattern.
//
// DEFAULT CONTRACT: full visual PRESENCE (opacity 1 — never a faint hint
// behind the section's solid accent color), but dimmed/muted in tone via a
// filter rather than transparency — a deliberate moody/aesthetic treatment,
// not the section-color wash this used to have. Callers using this as an
// actual section/page background photo should NOT pass a low `opacity` —
// leave it at the default. A caller may still pass an explicit low
// `opacity` when it is a genuinely small, localized decorative accent (a
// tiled strip, a per-card texture, an era-accent tint) rather than the
// section's background photo — those exceptions stay documented at their
// call site.
export const PatternBackground = ({
  category,
  index = 0,
  src,
  opacity = 1,
  size = 'cover', // 'cover' or a CSS background-size value (e.g. '220px')
  repeat = false,
  blend = 'normal',
  dim = true, // set false to opt a specific caller out of the dim treatment
  className = '',
}) => {
  const resolvedSrc = src || pickAsset(category, index);
  if (!resolvedSrc) return null;
  return (
    <>
      <div
        className={`absolute inset-0 pointer-events-none ${className}`}
        style={{
          backgroundImage: `url(${resolvedSrc})`,
          backgroundSize: size,
          backgroundRepeat: repeat ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
          opacity,
          mixBlendMode: blend,
          filter: dim ? 'brightness(0.62) saturate(0.82)' : 'none',
        }}
        aria-hidden="true"
      />
      {/* Very light readability tint directly over the photo — 1% black, per
          explicit request after the full-strength photo made overlaid text
          hard to read on some sections. Kept in the shared component so
          every background photo gets the same minimal treatment instead of
          per-section tweaks. */}
      <div className={`absolute inset-0 pointer-events-none bg-black/[0.01] ${className}`} aria-hidden="true" />
    </>
  );
};

// 3. RangoliDecoration — a real Rangoli/geometric photograph cropped into a
// circular medallion, optionally slowly rotating.
export const RangoliDecoration = ({ index = 0, src, spin = true, className = '' }) => {
  const resolvedSrc = src || pickAsset('rangoli', index);
  if (!resolvedSrc) return null;
  return (
    <div className={`rounded-full overflow-hidden pointer-events-none ${spin ? 'animate-[spin_140s_linear_infinite]' : ''} ${className}`} aria-hidden="true">
      <img src={resolvedSrc} alt="" className="w-full h-full object-cover" />
    </div>
  );
};

// 4. LotusStamp — a real lotus image cropped into a small circular stamp/seal,
// for corners, archive labels, tickets, footers.
export const LotusStamp = ({ index = 0, src, border = '#D19A24', bg = '#5A120D', className = '' }) => {
  const resolvedSrc = src || pickAsset('lotus', index);
  if (!resolvedSrc) return null;
  return (
    <div
      className={`rounded-full overflow-hidden shadow-md pointer-events-none select-none ${className}`}
      style={{ border: `2px solid ${border}`, backgroundColor: bg }}
      aria-hidden="true"
    >
      <img src={resolvedSrc} alt="" className="w-full h-full object-cover" />
    </div>
  );
};

// 5. PosterFragment — a real vintage-poster/risograph/halftone image presented
// as a pinned/taped physical scrap: rotated, hard shadow, torn/taped edge.
export const PosterFragment = ({
  category = 'posters',
  index = 0,
  src,
  alt = '',
  rotate = -3,
  tape = true,
  pin = false,
  caption,
  className = '',
}) => {
  const resolvedSrc = src || pickAsset(category, index);
  if (!resolvedSrc) return null;
  return (
    <div
      className={`relative bg-[#EEE4C8] p-1.5 pb-5 border-2 border-[#11100C] shadow-[8px_8px_0px_rgba(17,16,12,0.6)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {tape && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[rgba(231,213,164,0.85)] border border-black/25 pointer-events-none z-10"
          style={{ transform: 'rotate(-2deg)' }}
          aria-hidden="true"
        />
      )}
      {pin && (
        <span className="absolute -top-2 left-3 w-3 h-3 rounded-full bg-[#C2272A] border border-[#11100C] shadow pointer-events-none z-10" aria-hidden="true" />
      )}
      <div className="overflow-hidden border border-[#11100C]/40">
        <img src={resolvedSrc} alt={alt} loading="lazy" decoding="async" className="block w-full h-full object-cover" />
      </div>
      {caption && (
        <p className="absolute bottom-1 left-0 right-0 text-center font-mono text-[7.5px] font-bold uppercase tracking-widest text-[#11100C]/70">
          {caption}
        </p>
      )}
    </div>
  );
};

// 6. FilmCutout — a real cutout/halftone image framed tall and narrow, like a
// clipped film/photostrip fragment.
export const FilmCutout = ({ index = 0, src, rotate = 0, className = '' }) => {
  const resolvedSrc = src || pickAsset('cutout', index);
  if (!resolvedSrc) return null;
  return (
    <div
      className={`overflow-hidden border-2 border-[#11100C] shadow-[5px_5px_0px_rgba(17,16,12,0.5)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <img src={resolvedSrc} alt="" loading="lazy" decoding="async" className="block w-full h-full object-cover" />
    </div>
  );
};

// 7. RetroGrain — a real supplied paper/film-grain texture photograph layered
// as a subtle atmospheric overlay (never targeted at a specific photograph).
export const RetroGrain = ({ index = 0, src, opacity = 0.1, blend = 'overlay', className = '' }) => {
  const resolvedSrc = src || pickAsset('textures', index);
  if (!resolvedSrc) return null;
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ backgroundImage: `url(${resolvedSrc})`, backgroundSize: 'cover', opacity, mixBlendMode: blend }}
      aria-hidden="true"
    />
  );
};
