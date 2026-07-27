import { useAudio } from '../../audio/AudioContext';

export const SoundControl = () => {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button 
      onClick={toggleMute}
      aria-label="Toggle Sound System"
      className="fixed bottom-6 right-6 z-[140] bg-[#E7D7AC] text-[#11100C] font-mono text-[10px] md:text-[11px] font-bold tracking-[0.15em] px-3.5 py-2 border-2 border-[#11100C] shadow-[4px_4px_0px_#11100C] hover:shadow-[6px_6px_0px_#11100C] hover:-translate-y-0.5 transition-all duration-200 uppercase flex items-center gap-2.5 cursor-pointer pointer-events-auto"
    >
      <span>SOUND</span>
      
      {!isMuted ? (
        <div className="flex items-end gap-[2px] h-3.5 items-center">
          {/* Animated Retro Equalizer Bars */}
          <span className="w-[3px] bg-[#B94717] h-3 animate-[pulse_0.6s_infinite]" />
          <span className="w-[3px] bg-[#C99A2E] h-2 animate-[pulse_0.8s_infinite]" />
          <span className="w-[3px] bg-[#5A120D] h-3.5 animate-[pulse_0.5s_infinite]" />
          <span className="text-[#B94717] ml-1 font-bold">● ON</span>
        </div>
      ) : (
        <span className="text-[#11100C]/60 font-bold">○ OFF</span>
      )}
    </button>
  );
};
