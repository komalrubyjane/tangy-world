// playlist.js — Dynamic video discovery via Vite's import.meta.glob.
// Ported from the sibling "tangy" project's RetroTV component. All .mp4
// files inside /public/media/background-video/ are auto-discovered at
// build time (this project nests media under /media/, unlike the sibling
// project's /public/background-video/ — only the glob path differs).
const rawGlob = import.meta.glob('/public/media/background-video/*.mp4', {
  query: '?url',
  import: 'default',
  eager: true,
});

// Build structured entries
const allEntries = Object.entries(rawGlob).map(([path, url]) => ({
  filename: path.split('/').pop().replace(/\.mp4$/i, ''),
  url: String(url),
}));

export const FIRST_VIDEO = allEntries.find((v) => v.filename === 'first') || null;
export const MIDDLE_VIDEO = allEntries.find((v) => v.filename === 'middle') || null;

// Playlist = everything except the two special files
export const PLAYLIST = allEntries.filter(
  (v) => v.filename !== 'first' && v.filename !== 'middle'
);

// Fisher-Yates in-place shuffle returning new array
export function shufflePlaylist(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Human-readable title from raw filename
export function toTitle(filename) {
  if (!filename) return 'Tangy Sessions';
  return filename
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 40); // cap length
}
