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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsFinished(true);
      if (onComplete) onComplete();
      return;
    }

    const isMobile = window.innerWidth < 768;

    const restoreScroll = () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };

    // Lock scroll during curtain open
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const tl = gsap.timeline({
      onComplete: () => {
        restoreScroll();
        setIsFinished(true);
        if (onComplete) onComplete();
      }
    });

    // Center light glows on
    tl.to(centerLightRef.current, {
      opacity: 0.9,
      width: isMobile ? '8px' : '12px',
      duration: 0.3,
      ease: 'power2.out'
    }, 0.2)

    // Curtains pull apart — slower ease on mobile for smoothness
    .to(leftCurtainRef.current, {
      xPercent: -102,
      scaleX: 0.85,
      duration: isMobile ? 1.3 : 1.6,
      ease: 'power2.inOut',
      onStart: () => { try { playSFX('ticketClick'); } catch (_) {} }
    }, 0.4)
    .to(rightCurtainRef.current, {
      xPercent: 102,
      scaleX: 0.85,
      duration: isMobile ? 1.3 : 1.6,
      ease: 'power2.inOut'
    }, 0.4)

    // Center light beam expands and fades
    .to(centerLightRef.current, {
      width: isMobile ? '80px' : '120px',
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out'
    }, 0.5)

    // Fade out and unmount
    .to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, isMobile ? 1.55 : 1.8);

    return () => {
      tl.kill();
      restoreScroll();
    };
  }, [onComplete, playSFX]);

  if (isFinished) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden flex"
      style={{ willChange: 'opacity' }}
    >
      {/* LEFT VINTAGE THEATRE CURTAIN */}
      <div
        ref={leftCurtainRef}
        className="absolute top-0 left-0 w-[51.5%] h-full bg-[#5A120D] border-r-4 border-[#11100C] shadow-[30px_0_90px_rgba(0,0,0,0.95)] origin-left flex items-center justify-end overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#11100C_0%,#5A120D_12%,#320407_25%,#6E1711_38%,#11100C_50%)] opacity-95" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-[linear-gradient(0deg,#11100C_0%,transparent_100%)] opacity-80" />
      </div>

      {/* CENTER WARM AMBER LIGHT GAP BEAM */}
      <div
        ref={centerLightRef}
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-[linear-gradient(180deg,#E7D5A4_0%,#C99A2E_50%,#B94717_100%)] blur-md z-30 opacity-0 pointer-events-none"
        style={{ willChange: 'width, opacity' }}
      />

      {/* RIGHT VINTAGE THEATRE CURTAIN */}
      <div
        ref={rightCurtainRef}
        className="absolute top-0 right-0 w-[51.5%] h-full bg-[#5A120D] border-l-4 border-[#11100C] shadow-[-30px_0_90px_rgba(0,0,0,0.95)] origin-right flex items-center justify-start overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <div className="w-full h-full bg-[repeating-linear-gradient(90deg,#11100C_0%,#320407_12%,#5A120D_25%,#6E1711_38%,#11100C_50%)] opacity-95" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-[linear-gradient(0deg,#11100C_0%,transparent_100%)] opacity-80" />
      </div>
    </div>
  );
};
