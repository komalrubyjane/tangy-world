import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const GlobalMicrophoneJourney = () => {
  const { isAudioEnabled, isMuted } = useAudio();
  const cableRef = useRef(null);
  const micHeadRef = useRef(null);
  const animationFrameRef = useRef(null);

  const currentY = useRef(140);
  const targetY = useRef(140);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      
      const docHeight = Math.max(
        document.body.scrollHeight - vh,
        1
      );
      const scrollProgress = Math.min(1, Math.max(0, scrollY / docHeight));

      const minMicY = 110;
      const maxMicY = Math.min(vh * 0.46, 380);
      targetY.current = minMicY + (scrollProgress * (maxMicY - minMicY));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    const renderLoop = () => {
      currentY.current += (targetY.current - currentY.current) * 0.08;
      const yVal = currentY.current;

      if (cableRef.current) {
        cableRef.current.style.height = `${yVal}px`;
      }

      if (micHeadRef.current) {
        micHeadRef.current.style.transform = `translate3d(-50%, ${yVal}px, 0px)`;
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[85] overflow-hidden">
      {/* 1. STRAIGHT VERTICAL CABLE (2.5px thick, dark charcoal, top: 0) */}
      <div 
        ref={cableRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[2.5px] bg-[#191410] opacity-85 shadow-[0_0_3px_rgba(0,0,0,0.6)] z-[85] will-change-[height]"
      />

      {/* 2. SUSPENDED MICROPHONE HEAD (Attached to bottom of cable) */}
      <div 
        ref={micHeadRef}
        className="absolute top-0 left-1/2 w-14 h-28 md:w-16 md:h-32 z-[86] flex flex-col items-center will-change-transform"
      >
        <div className="relative w-full h-full flex flex-col items-center">
          <img 
            src="/media/vintage-mic2.png" 
            alt="Tangy Vintage Suspended Microphone" 
            className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] contrast-125"
          />

          {/* Audio Micro-Pulse Glow when Sound is ON */}
          {isAudioEnabled && !isMuted && (
            <div className="absolute inset-0 bg-[#C99A2E]/15 rounded-full blur-xs animate-pulse pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
};
