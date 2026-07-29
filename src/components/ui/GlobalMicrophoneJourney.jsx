import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const GlobalMicrophoneJourney = ({ active }) => {
  const { isAudioEnabled, isMuted } = useAudio();
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const micHeadRef = useRef(null);
  const animationFrameRef = useRef(null);

  const currentScrollY = useRef(0);
  const targetScrollY = useRef(0);

  useEffect(() => {
    if (!active) return;

    const pathEl = pathRef.current;
    if (!pathEl) return;

    // 1. Set Full Document Height on Single Overlay Container
    const updatePath = () => {
      const fullH = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const fullW = window.innerWidth;

      if (containerRef.current) {
        containerRef.current.style.height = `${fullH}px`;
      }

      if (svgRef.current) {
        svgRef.current.setAttribute('width', fullW);
        svgRef.current.setAttribute('height', fullH);
        svgRef.current.setAttribute('viewBox', `0 0 ${fullW} ${fullH}`);
      }

      const isMobile = fullW < 768;

      // Single Continuous Route across 10 Chapters matching Section Directions
      const p0 = { x: fullW * 0.50, y: 0 };
      const pHero = { x: fullW * (isMobile ? 0.70 : 0.76), y: fullH * 0.07 };
      const pManifesto = { x: fullW * (isMobile ? 0.20 : 0.16), y: fullH * 0.16 };
      const pChronoStart = { x: fullW * (isMobile ? 0.15 : 0.12), y: fullH * 0.24 };
      const pChronoEnd = { x: fullW * (isMobile ? 0.85 : 0.88), y: fullH * 0.32 };
      const pArchive = { x: fullW * (isMobile ? 0.20 : 0.18), y: fullH * 0.42 };
      const pFilmStart = { x: fullW * (isMobile ? 0.12 : 0.10), y: fullH * 0.49 };
      const pFilmEnd = { x: fullW * (isMobile ? 0.88 : 0.90), y: fullH * 0.57 };
      const pDiary = { x: fullW * (isMobile ? 0.18 : 0.16), y: fullH * 0.65 };
      const pVinylStart = { x: fullW * (isMobile ? 0.85 : 0.88), y: fullH * 0.72 };
      const pVinylEnd = { x: fullW * (isMobile ? 0.15 : 0.14), y: fullH * 0.79 };
      const pCrew = { x: fullW * (isMobile ? 0.80 : 0.82), y: fullH * 0.86 };
      const pPrivateStart = { x: fullW * (isMobile ? 0.15 : 0.12), y: fullH * 0.90 };
      const pPrivateEnd = { x: fullW * (isMobile ? 0.85 : 0.86), y: fullH * 0.95 };
      const pFooter = { x: fullW * 0.50, y: fullH * 0.99 };

      const d = `
        M ${p0.x} ${p0.y}
        C ${p0.x} ${pHero.y * 0.4}, ${pHero.x} ${pHero.y * 0.7}, ${pHero.x} ${pHero.y}
        C ${pHero.x} ${pManifesto.y * 0.8}, ${pManifesto.x} ${pManifesto.y * 0.6}, ${pManifesto.x} ${pManifesto.y}
        C ${pManifesto.x} ${pChronoStart.y}, ${pChronoStart.x} ${pChronoStart.y}, ${pChronoStart.x} ${pChronoStart.y}
        L ${pChronoEnd.x} ${pChronoEnd.y}
        C ${pChronoEnd.x} ${pArchive.y * 0.8}, ${pArchive.x} ${pArchive.y * 0.6}, ${pArchive.x} ${pArchive.y}
        C ${pArchive.x} ${pFilmStart.y}, ${pFilmStart.x} ${pFilmStart.y}, ${pFilmStart.x} ${pFilmStart.y}
        L ${pFilmEnd.x} ${pFilmEnd.y}
        C ${pFilmEnd.x} ${pDiary.y * 0.8}, ${pDiary.x} ${pDiary.y * 0.6}, ${pDiary.x} ${pDiary.y}
        C ${pDiary.x} ${pVinylStart.y}, ${pVinylStart.x} ${pVinylStart.y}, ${pVinylStart.x} ${pVinylStart.y}
        L ${pVinylEnd.x} ${pVinylEnd.y}
        C ${pVinylEnd.x} ${pCrew.y * 0.8}, ${pCrew.x} ${pCrew.y * 0.6}, ${pCrew.x} ${pCrew.y}
        C ${pCrew.x} ${pPrivateStart.y}, ${pPrivateStart.x} ${pPrivateStart.y}, ${pPrivateStart.x} ${pPrivateStart.y}
        L ${pPrivateEnd.x} ${pPrivateEnd.y}
        C ${pPrivateEnd.x} ${pFooter.y * 0.97}, ${pFooter.x} ${pFooter.y * 0.98}, ${pFooter.x} ${pFooter.y}
      `;

      pathEl.setAttribute('d', d);

      const totalLength = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = `${totalLength}`;
      pathEl.style.strokeDashoffset = `${totalLength}`;
    };

    updatePath();
    window.addEventListener('resize', updatePath);

    // 2. High-Frequency Scroll Tracker
    const handleScroll = () => {
      targetScrollY.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 3. Binary Search for Path Distance at Target Document Y
    const findPathDistanceForY = (pathObj, totalLen, targetDocY) => {
      let low = 0;
      let high = totalLen;
      let bestDist = 0;

      for (let i = 0; i < 22; i++) {
        const mid = (low + high) / 2;
        const pt = pathObj.getPointAtLength(mid);
        if (pt.y < targetDocY) {
          bestDist = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      return bestDist;
    };

    // 4. Single Animation Loop (Derives BOTH Wire & Mic from ONE distance value)
    const renderLoop = () => {
      currentScrollY.current += (targetScrollY.current - currentScrollY.current) * 0.09;

      const pathObj = pathRef.current;
      const micObj = micHeadRef.current;

      if (pathObj && micObj) {
        const totalLength = pathObj.getTotalLength();
        const vh = window.innerHeight;

        // Target Document Y: Synchronized near ~62vh of user's active viewport
        const targetDocY = currentScrollY.current + (vh * 0.62);

        // ONE SINGLE SOURCE OF TRUTH: distance along SVG path
        const distance = findPathDistanceForY(pathObj, totalLength, targetDocY);

        // A. Wire ends EXACTLY at current distance tip
        pathObj.style.strokeDashoffset = `${totalLength - distance}`;

        // B. Microphone head positioned EXACTLY at current distance tip (Document Space)
        const pt = pathObj.getPointAtLength(distance);
        const ptNext = pathObj.getPointAtLength(Math.min(totalLength, distance + 6));

        // Angle Calculation & Pendulum Clamp (-8deg to +8deg)
        const angleRad = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
        let angleDeg = (angleRad * (180 / Math.PI)) - 90;
        angleDeg = Math.min(8, Math.max(-8, angleDeg));

        // Microphone top center connects exactly to point.x, point.y
        micObj.style.transform = `translate3d(${pt.x - 28}px, ${pt.y}px, 0px) rotate(${angleDeg}deg)`;
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener('resize', updatePath);
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active]);

  return (
    // SINGLE DOCUMENT-SIZED OVERLAY CONTAINER (z-2 for wire, z-3 for mic head)
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full pointer-events-none z-[12] overflow-visible"
    >
      {/* SVG WIRE (z-12, PASSES BEHIND SECTION CONTENT) */}
      <svg 
        ref={svgRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-[12] overflow-visible"
      >
        <path
          ref={pathRef}
          fill="none"
          stroke="#E7D5A4"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="opacity-55 mix-blend-difference"
        />
      </svg>

      {/* VINTAGE CHROME MICROPHONE HEAD AT EXACT WIRE TIP (Document Coordinates, z-85) */}
      <div 
        ref={micHeadRef}
        className="absolute top-0 left-0 w-14 h-28 md:w-16 md:h-32 pointer-events-none z-[85] transition-transform duration-75 ease-out origin-top flex flex-col items-center will-change-transform"
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
