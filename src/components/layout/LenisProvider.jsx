import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

export const LenisProvider = ({ children }) => {
  const [lenis, setLenis] = useState(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const newLenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 1.5,
    });

    lenisRef.current = newLenis;
    setLenis(newLenis);

    // Sync Lenis with GSAP ScrollTrigger
    newLenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time) => {
      newLenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    // Allow GSAP lag smoothing to prevent freeze frames when CPU spikes
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      newLenis.destroy();
      gsap.ticker.remove(updateLenis);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
};

export const useLenis = () => useContext(LenisContext);
