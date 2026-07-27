import { createContext, useContext, useState, useEffect } from 'react';
import { audioManager } from './AudioManager';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('tangySoundMuted') === 'true';
  });

  useEffect(() => {
    // 1. Initial audio initialization & autoplay attempt
    const initAudio = () => {
      audioManager.init();
      if (!isMuted) {
        audioManager.setMuted(false);
      } else {
        audioManager.setMuted(true);
      }
    };

    // Attempt autoplay immediately
    initAudio();

    // 2. Fallback listener for first user interaction (browser autoplay policy)
    const handleFirstInteraction = () => {
      if (audioManager.ctx && audioManager.ctx.state === 'suspended') {
        audioManager.ctx.resume();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isMuted]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('tangySoundMuted', nextMuted ? 'true' : 'false');
    audioManager.setMuted(nextMuted);
  };

  const playSFX = (name) => {
    if (isMuted) return;
    if (name === 'micDrop') audioManager.playMicDrop();
    if (name === 'pageTurn') audioManager.playPageTurn();
    if (name === 'ticketClick') audioManager.playTicketClick();
  };

  const setFilterCutoff = (freq) => {
    if (!isMuted) {
      audioManager.setFilterCutoff(freq);
    }
  };

  const crossfadeSection = (sectionName) => {
    if (!isMuted) {
      audioManager.crossfadeSection(sectionName);
    }
  };

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

export const useAudio = () => useContext(AudioContext);
