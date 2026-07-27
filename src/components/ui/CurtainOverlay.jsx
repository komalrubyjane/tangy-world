import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useAudio } from '../../audio/AudioContext';

export const CurtainOverlay = ({ onComplete }) => {
  const overlayRef = useRef(null);
  const leftCurtainRef = useRef(null);
  const rightCurtainRef = useRef(null);
  const centerLightRef = useRef(null);
  const { playSFX } = useAudio();
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // 1. Temporarily Lock Page Scroll During Curtain Opening (~2.2s)
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    });

    // 0.0s - 0.4s: Curtains hold closed
    tl.to(centerLightRef.current, {
      opacity: 0.9,
      width: '12px',
      duration: 0.3,
      ease: 'power2.out'
    }, 0.3)

    // 0.5s - 2.2s: Curtains open & gather toward edges
    .to(leftCurtainRef.current, {
      xPercent: -102,
      scaleX: 0.85,
      duration: 1.6,
      ease: 'cubic-bezier(0.76, 0, 0.24, 1)',
      onStart: () => playSFX('ticketClick')
    }, 0.5)
    .to(rightCurtainRef.current, {
      xPercent: 102,
      scaleX: 0.85,
      duration: 1.6,
      ease: 'cubic-bezier(0.76, 0, 0.24, 1)'
    }, 0.5)

    // Center light beam expands and fades
    .to(centerLightRef.current, {
      width: '120px',
      opacity: 0,
      duration: 1.0,
      ease: 'power2.out'
    }, 0.6)

    // Fade out overlay container & unmount
    .to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, 2.0);

  }, [onComplete, playSFX]);

  if (isFinished) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex"
    >
      {/* LEFT VINTAGE THEATRE CURTAIN */}
      <div 
        ref={leftCurtainRef}
        className="absolute top-0 left-0 w-[51.5%] h-full bg-[#5A120D] border-r-4 border-[#11100C] shadow-[30px_0_90px_rgba(0,0,0,0.95)] origin-left flex items-center justify-end overflow-hidden"
      >
        {/* Realistic Fabric Vertical Folds & Deep Shadows */}
        <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#11100C_0%,#5A120D_12%,#320407_25%,#6E1711_38%,#11100C_50%)] opacity-95" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-[linear-gradient(0deg,#11100C_0%,transparent_100%)] opacity-80" />
      </div>

      {/* CENTER WARM AMBER LIGHT GAP BEAM */}
      <div 
        ref={centerLightRef}
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[linear-gradient(180deg,#E7D5A4_0%,#C99A2E_50%,#B94717_100%)] blur-md z-30 opacity-0 pointer-events-none"
      />

      {/* RIGHT VINTAGE THEATRE CURTAIN */}
      <div 
        ref={rightCurtainRef}
        className="absolute top-0 right-0 w-[51.5%] h-full bg-[#5A120D] border-l-4 border-[#11100C] shadow-[-30px_0_90px_rgba(0,0,0,0.95)] origin-right flex items-center justify-start overflow-hidden"
      >
        {/* Realistic Fabric Vertical Folds & Deep Shadows */}
        <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#11100C_0%,#320407_12%,#5A120D_25%,#6E1711_38%,#11100C_50%)] opacity-95" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-[linear-gradient(0deg,#11100C_0%,transparent_100%)] opacity-80" />
      </div>

    </div>
  );
};
