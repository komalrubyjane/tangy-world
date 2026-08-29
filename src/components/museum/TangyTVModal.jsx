import TVPlayer from '../tv/TVPlayer.jsx';

// The secondary nav's TV item used to be decorative only — clicking it did
// nothing because no player existed in this project. This modal wires it up
// to the same retro CRT video player already built and shipping in the
// sibling "tangy" project (~/tangy/src/components/RetroTV), ported into
// src/components/tv/ with only the video-glob path adjusted for this
// project's public/media/ convention.
export const TangyTVModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/85" />

      <div className="relative w-full max-w-md z-10">
        <button
          onClick={onClose}
          aria-label="Close Tangy TV"
          className="absolute -top-10 right-0 font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
        >
          ✕ CLOSE
        </button>
        <TVPlayer />
      </div>
    </div>
  );
};
