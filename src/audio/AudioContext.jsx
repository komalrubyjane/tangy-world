import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { audioManager } from './AudioManager';

const AudioContext = createContext(null);

// Real no-ops (audio is fully muted by design here — see the mount effect
// below) — defined once at module scope rather than freshly inside the
// component body, so every consumer's `useAudio().playSFX` is the SAME
// function reference forever, not a new one on every AudioProvider render.
// Several components elsewhere (CurtainOverlay, TangySpaceIntro) put
// `playSFX` directly in a useEffect dependency array; an unstable
// reference there would re-run — and restart — those effects on every
// unrelated re-render, which is exactly the kind of thing that can leave a
// fixed, full-screen overlay stuck instead of completing cleanly.
const playSFX = () => {};
const setFilterCutoff = () => {};
const crossfadeSection = () => {};

export const AudioProvider = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Completely mute audio manager on mount
    try {
      audioManager.setMuted(true);
      if (audioManager.ctx && audioManager.ctx.state === 'running') {
        audioManager.ctx.suspend();
      }
    } catch (e) {}
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(true);
    audioManager.setMuted(true);
  }, []);

  // Memoized so consumers don't re-render on every AudioProvider render for
  // an object that's identical in content — same reasoning as the stable
  // function references above.
  const value = useMemo(() => ({
    isAudioEnabled: !isMuted,
    isMuted,
    toggleMute,
    playSFX,
    setFilterCutoff,
    crossfadeSection,
  }), [isMuted, toggleMute]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

const AUDIO_FALLBACK = {
  isAudioEnabled: false,
  isMuted: true,
  toggleMute: () => {},
  playSFX: () => {},
  setFilterCutoff: () => {},
  crossfadeSection: () => {},
};

export const useAudio = () => useContext(AudioContext) ?? AUDIO_FALLBACK;

