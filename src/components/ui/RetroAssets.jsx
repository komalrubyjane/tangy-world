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

// 2. PatternBackground — RETIRED as a background system (visual feedback,
// 23 Sep 2026: "the fabric background adds visual noise"). Sections now pick
// one solid background family (.bg-family-* in globals.css) with at most the
// static .tangy-grain texture. Kept as a no-op so existing call sites across
// portals and subpages don't need to change; don't add new ones.
export const PatternBackground = () => null;

// 3. RangoliDecoration — RETIRED. These were large, slowly spinning photo
// medallions in section corners: decoration with no meaning, plus a
// continuous animation. No-op so existing call sites stay valid.
export const RangoliDecoration = () => null;

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

// 7. RetroGrain — the single texture in the design system: a static,
// low-opacity paper grain with NO blend mode. Legacy props (index, src,
// opacity, blend) are accepted and ignored so every caller gets the same
// restrained treatment instead of each stacking its own overlay strength.
export const RetroGrain = ({ className = '' }) => (
  <div className={`tangy-grain ${className}`} aria-hidden="true" />
);
