import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import clsx from 'clsx';

export const DustParticles = ({ count = 20, id }) => {
  const reduced = useReducedMotion();
  const containerRef = useRef(null);
  
  if (reduced) return null;

  const particles = Array.from({ length: count }).map((_, i) => {
    const left = `${Math.random() * 100}%`;
    const top = `${Math.random() * 100}%`;
    const duration = `${9 + Math.random() * 10}s`;
    const delay = `-${Math.random() * 14}s`;
    
    return { id: i, left, top, duration, delay };
  });

  return (
    <div id={id} ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map((p) => (
        <span 
          key={p.id}
          className="absolute w-[2px] h-[2px] rounded-full bg-tangy-cream opacity-0 animate-[floatDust_linear_infinite]"
          style={{
            left: p.left,
            top: p.top,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};
