import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAPContext = (callback, dependencies = []) => {
  const comp = useRef(null);

  // Guarantee dependencies is always a valid Array for useLayoutEffect
  const validDeps = Array.isArray(dependencies) ? dependencies : [];

  useLayoutEffect(() => {
    if (!comp.current) return;
    
    let ctx = gsap.context((context) => {
      callback(context);
    }, comp.current);

    return () => ctx.revert();
  }, validDeps);

  return comp;
};
