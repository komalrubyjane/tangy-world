import { createContext, useContext, useState, useEffect } from 'react';
import { audioManager } from './AudioManager';

const AudioContext = createContext(null);

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

  const toggleMute = () => {
    setIsMuted(true);
    audioManager.setMuted(true);
  };

  const playSFX = () => {};
  const setFilterCutoff = () => {};
  const crossfadeSection = () => {};

  return (
    <AudioContext.Provider value={{
      isAudioEnabled: !isMuted,
      isMuted,
      toggleMute,
      playSFX,
      setFilterCutoff,
      crossfadeSection
    }}>
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

