// Wraps existing photography/artwork for the retro poster system WITHOUT ever altering
// the pixels of the source image — no grayscale/sepia/hue-rotate/duotone/blend-mode
// applied to the actual <img>. The retro identity comes entirely from what's placed
// around it (see CulturalMotifs.jsx for the patterns/motifs/frames that go beside it):
// paper labels, stamps, textile borders, registration marks, hand-drawn accents.
//
// This component intentionally does almost nothing to the image itself — it exists so
// every photo in the site goes through one place, making "images stay original colour"
// a property of the codebase rather than something to remember per call site.

export const PhotoTreatment = ({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  onError,
}) => (
  <div className={`relative overflow-hidden ${className}`}>
    <img src={src} alt={alt} onError={onError} className={`w-full h-full object-cover ${imgClassName}`} />
  </div>
);
