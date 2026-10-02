import { useEffect, useState } from 'react';
import { resolveMedia } from './contentService';

// A session's own page background (events.page_background, 0034): 'cover'
// (the session's cover image), a dark colour '#RRGGBB', or an image link. The
// database only allows those shapes. Images sit under a dark wash so the
// page's cream text stays readable.
export const BACKGROUND_PRESETS = [
  ['#4A171D', 'Maroon (default)'], ['#1E2440', 'Indigo night'], ['#183126', 'Banyan green'], ['#12343B', 'Stepwell teal'],
  ['#3A1F3D', 'Plum'], ['#3D2A12', 'Ochre earth'], ['#1B1B1B', 'Charcoal'], ['#2B1A12', 'Teak'],
];

// Relative luminance (WCAG) — backgrounds must stay dark under cream text.
export function luminance(hex) {
  const c = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export const isDarkEnough = (hex) => /^#[0-9a-fA-F]{6}$/.test(hex) && luminance(hex) <= 0.12;
export const isBackgroundImage = (v) => /^(https:\/\/|\/media\/|\/storage\/content-media\/)[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$/.test(v || '');

// Style for a fixed backdrop layer behind the page (never the page itself —
// the cover is blurred). A colour fills it; an explicit image link is shown
// under a dark wash; the cover is blurred and darkened, so a
// session can use its own photo as its backdrop.
export function backgroundStyle(value, url, { blur = false } = {}) {
  if (/^#[0-9a-fA-F]{6}$/.test(value || '')) return { backgroundColor: value };
  if (!url) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(18, 9, 7, ${blur ? 0.72 : 0.84}), rgba(18, 9, 7, ${blur ? 0.9 : 0.93})), url("${url}")`,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    ...(blur ? { filter: 'blur(28px) saturate(1.2)', transform: 'scale(1.15)' } : {}),
  };
}

// The backdrop style for a session page. No value → none (the page shows the
// site's own textured background); 'cover' → its cover image, blurred;
// '#RRGGBB' → that colour; an image link → that image.
export function useSessionBackground(value, coverImage) {
  const [style, setStyle] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    const isColour = /^#[0-9a-fA-F]{6}$/.test(value || '');
    if (isColour) { setStyle(backgroundStyle(value)); return undefined; }
    if (!value) { setStyle(undefined); return undefined; }
    const auto = value === 'cover';
    const src = auto ? coverImage : isBackgroundImage(value) ? value : null;
    if (!src) { setStyle(undefined); return undefined; }
    resolveMedia([src]).then((resolve) => { if (!cancelled) setStyle(backgroundStyle(value, resolve(src), { blur: auto })); });
    return () => { cancelled = true; };
  }, [value, coverImage]);
  return style;
}
