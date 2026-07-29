import { createContext, useContext, useState, useEffect } from 'react';
import { audioManager } from './AudioManager';

const AudioContext = createContext(null);

export const AudioProvider = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('tangySoundMuted') === 'true';
  });

  useEffect(() => {
    // Initial audio initialization & autoplay attempt
    const initAudio = () => {
      try {
        audioManager.init();
        if (!isMuted) {
          audioManager.setMuted(false);
        } else {
          audioManager.setMuted(true);
        }
      } catch (e) {
        // Suppress initial autoplay policy errors until user gesture
      }
    };

    initAudio();

    // Fallback listener for first user interaction (browser autoplay policy)
    const handleFirstInteraction = () => {
      if (audioManager.ctx && audioManager.ctx.state === 'suspended') {
        audioManager.ctx.resume().catch(() => {});
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
    try {
      if (name === 'micDrop') audioManager.playMicDrop();
      if (name === 'pageTurn') audioManager.playPageTurn();
      if (name === 'ticketClick') audioManager.playTicketClick();
    } catch (e) {
      // Ignore SFX errors if AudioContext suspended
    }
  };

  const setFilterCutoff = (freq) => {
    if (!isMuted) {
      try { audioManager.setFilterCutoff(freq); } catch (e) {}
    }
  };

  const crossfadeSection = (sectionName) => {
    if (!isMuted) {
      try { audioManager.crossfadeSection(sectionName); } catch (e) {}
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
