// Registry of the real, supplied reference-image assets living in public/assets/.
// These are genuine photographs/illustrations (Indian textile, Bandhani, Rangoli,
// lotus botanical art, vintage posters, risograph, halftone, cutout collage,
// illustrations, print textures) — NOT CSS/SVG approximations. Components in
// RetroAssets.jsx consume these paths directly; nothing here alters their pixels.
//
// 14 originally-supplied files were excluded after an asset-by-asset audit found
// them to be identifiable copyrighted/trademarked third-party material (movie
// posters, band logos, branded design-studio work, stock-site watermarks, a
// signed illustrator's work, vulgar text) unsafe to publish on a real site. Only
// generic, unbranded reference material is registered below.

export const RETRO_ASSETS = {
  bandhani: [
    '/assets/bandhani/ban1.jpg',
    '/assets/bandhani/ban2.jpg',
    '/assets/bandhani/ban3.jpg',
  ],
  textile: [
    '/assets/textile/textile1.jpg',
    '/assets/textile/textile2.jpg',
    '/assets/textile/textile3.jpg',
  ],
  rangoli: [
    '/assets/rangoli/geo2.jpg',
    '/assets/rangoli/geo3.jpg',
    '/assets/rangoli/geo4.jpg',
  ],
  lotus: [
    '/assets/lotus/lot1.png',
    '/assets/lotus/lot2.jpg',
    '/assets/lotus/lot3.png',
    '/assets/lotus/lot4.png',
  ],
  posters: [
    '/assets/posters/pos1.jpg',
    '/assets/posters/pos3.jpg',
  ],
  risograph: [
    '/assets/risograph/rad1.jpg',
  ],
  halftone: [
    '/assets/halftone/haf2.jpg',
  ],
  cutout: [
    '/assets/cutout/cut1.jpg',
    '/assets/cutout/cut3.jpg',
    '/assets/cutout/cut4.jpg',
  ],
  illustrations: [
    '/assets/illustrations/ill1.png',
    '/assets/illustrations/ill2.png',
  ],
  textures: [
    '/assets/textures/ftex3.jpg',
    '/assets/textures/ftex4.jpg',
  ],
};

// Deterministic picker so the same (section, slot) always resolves to the same
// asset on every render, while different call sites naturally rotate through
// the category's pool instead of all defaulting to index 0.
export const pickAsset = (category, index = 0) => {
  const pool = RETRO_ASSETS[category];
  if (!pool || pool.length === 0) return null;
  return pool[index % pool.length];
};
