import { useAudio } from '../../audio/AudioContext';

export const AudioEntryModal = () => {
  const { hasChosenMode, enableAudio } = useAudio();

  if (hasChosenMode) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-tangy-black flex flex-col items-center justify-center p-6 text-center">
      {/* Background Texture & Warm Spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(231,217,181,0.18)_0%,rgba(9,8,6,0.98)_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none mix-blend-overlay" />

      {/* Hanging Microphone Silhouette */}
      <div className="w-1 h-20 bg-[#444] mb-2" />
      <div className="w-10 h-14 bg-[linear-gradient(135deg,#7a7a7a,#222)] rounded-t-full rounded-b-lg shadow-2xl mb-8 border border-[#555]" />

      <p className="font-mono text-tangy-gold text-[10px] md:text-xs tracking-[0.4em] uppercase mb-4 z-10">
        ANALOGUE SOUND ENGINE
      </p>

      <h2 className="display text-5xl md:text-7xl text-tangy-cream leading-tight mb-2 z-10">
        TANGY WORLD
      </h2>

      <p className="font-body italic text-tangy-paper/80 text-lg md:text-xl mb-12 z-10 max-w-md">
        "this world has a sound."
      </p>

      <div className="flex flex-col md:flex-row gap-6 z-10 w-full max-w-md">
        <button 
          onClick={() => enableAudio(true)}
          className="flex-1 bg-tangy-cream text-tangy-black py-4 px-6 font-mono text-[11px] font-bold tracking-[0.2em] hover:bg-tangy-gold transition-colors shadow-2xl"
        >
          [ ENTER WITH SOUND ]
        </button>

        <button 
          onClick={() => enableAudio(false)}
          className="flex-1 border border-tangy-paper/30 text-tangy-paper py-4 px-6 font-mono text-[11px] tracking-[0.2em] hover:text-tangy-cream hover:border-tangy-cream transition-colors"
        >
          ENTER SILENTLY
        </button>
      </div>
    </div>
  );
};
