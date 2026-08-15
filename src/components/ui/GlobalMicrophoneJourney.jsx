import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const GlobalMicrophoneJourney = ({ active = true }) => {
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const pathEl = pathRef.current;
    if (!pathEl) return;

    // 1. Build Single Continuous Smooth Cubic Bézier SVG Cable across full document height
    const updatePath = () => {
      const isMobile = window.innerWidth < 1024;
      
      // Calculate true full document height for both mobile and desktop
      const fullH = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight * 4
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

      // Stroke thickness: 3.2px on desktop, 2.0px on mobile
      pathEl.setAttribute('stroke-width', isMobile ? '2.0' : '3.2');

      // Section Landmark Waypoints (Gutter & Edge Aligned, contained within viewport)
      const points = [
        { x: fullW * 0.50, y: 0 },
        { x: fullW * (isMobile ? 0.72 : 0.82), y: fullH * 0.08 }, // Hero
        { x: fullW * (isMobile ? 0.22 : 0.12), y: fullH * 0.18 }, // Manifesto
        { x: fullW * (isMobile ? 0.74 : 0.86), y: fullH * 0.28 }, // Sessions
        { x: fullW * (isMobile ? 0.20 : 0.10), y: fullH * 0.38 }, // History
        { x: fullW * (isMobile ? 0.76 : 0.88), y: fullH * 0.48 }, // Archive
        { x: fullW * (isMobile ? 0.22 : 0.12), y: fullH * 0.58 }, // Diary
        { x: fullW * (isMobile ? 0.74 : 0.86), y: fullH * 0.68 }, // Artists
        { x: fullW * (isMobile ? 0.20 : 0.11), y: fullH * 0.78 }, // Crew
        { x: fullW * (isMobile ? 0.76 : 0.87), y: fullH * 0.88 }, // Private Sessions
        { x: fullW * 0.50, y: fullH * 0.995 }                     // Footer
      ];

      // Generate Continuous Smooth Cubic Bézier Path
      let d = `M ${points[0].x} ${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        // Smooth vertical control points for fluid S-curves
        const cy1 = p1.y + (p2.y - p1.y) * 0.45;
        const cy2 = p2.y - (p2.y - p1.y) * 0.45;

        d += ` C ${p1.x} ${cy1}, ${p2.x} ${cy2}, ${p2.x} ${p2.y}`;
      }

      pathEl.setAttribute('d', d);

      const totalLength = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = `${totalLength}`;
      pathEl.style.strokeDashoffset = `${totalLength}`;
    };

    updatePath();
    window.addEventListener('resize', updatePath);

    // 2. High-Frequency Scroll Listener
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

    // 4. Smooth 60 FPS Render Loop
    const renderLoop = () => {
      currentScrollY.current += (targetScrollY.current - currentScrollY.current) * 0.08;

      const pathObj = pathRef.current;
      const micObj = micHeadRef.current;

      if (pathObj && micObj) {
        const totalLength = pathObj.getTotalLength();
        const vh = window.innerHeight;
        const isMobile = window.innerWidth < 768;
        
        // Microphone display dimensions & top metal connector offset (59.8% X, 0px Y)
        const micWidth = isMobile ? 40 : 56;
        const micHeight = isMobile ? 86 : 118;
        const connectorXOffset = micWidth * 0.598;

        // Position microphone suspended near ~55% of user's active viewport
        const targetDocY = currentScrollY.current + (vh * 0.55);

        const distance = findPathDistanceForY(pathObj, totalLength, targetDocY);

        // Cable terminates exactly at distance (pt.x, pt.y) without extra extension
        pathObj.style.strokeDashoffset = `${totalLength - distance}`;

        // Get exact position and curve tangent angle
        const pt = pathObj.getPointAtLength(distance);
        const ptNext = pathObj.getPointAtLength(Math.min(totalLength, distance + 5));

        const angleRad = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);
        let angleDeg = (angleRad * (180 / Math.PI)) - 90;
        angleDeg = Math.min(6, Math.max(-6, angleDeg)); // Natural subtle pendulum sway (-6deg to +6deg)

        // Translate so top metal connector hole meets (pt.x, pt.y) with 0 gap
        micObj.style.transform = `translate3d(${pt.x - connectorXOffset}px, ${pt.y}px, 0px) rotate(${angleDeg}deg)`;
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
    <div 
      ref={containerRef}
      className="absolute top-0 left-0 w-full pointer-events-none z-[85] overflow-visible"
    >
      {/* 1. SINGLE CONTINUOUS VINTAGE CABLE (Warm Cream / Gold, Smooth Bézier) */}
      <svg 
        ref={svgRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-[85] overflow-visible"
      >
        <path
          ref={pathRef}
          fill="none"
          stroke="#E7D5A4"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
        />
      </svg>

      {/* 2. SUSPENDED MICROPHONE HEAD (Top connector at 59.8% X, 0px Y) */}
      <div 
        ref={micHeadRef}
        className="absolute top-0 left-0 w-[40px] h-[86px] md:w-[56px] md:h-[118px] pointer-events-none z-[86] flex flex-col items-center will-change-transform"
        style={{ transformOrigin: '59.8% 0px' }}
      >
        <div className="relative w-full h-full">
          <img 
            src="/media/vintage-mic2.png" 
            alt="Tangy Vintage Suspended Microphone" 
            className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] contrast-125 block"
          />
        </div>
      </div>
    </div>
  );
};
