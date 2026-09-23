import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCursor } from '../../hooks/useCursor';
import clsx from 'clsx';
import '../../styles/cursor.css';

export const CustomCursor = () => {
  const { active, label } = useCursor();
  const cursorRef = useRef(null);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const isTouch = window.matchMedia('(hover:none), (pointer:coarse)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || isReduced) return;

    document.body.classList.add('cursor-ready');

    // No lerp/easing — the cursor renders at the ACTUAL current pointer
    // position every frame, so it never trails behind the real mouse.
    // requestAnimationFrame here only throttles the DOM write to once per
    // frame (mousemove can fire far more often than the display refreshes),
    // which is what keeps this cheap without introducing any delay.
    let rafId = null;
    let pending = false;

    const applyPosition = () => {
      pending = false;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${mouseRef.current.x}px, ${mouseRef.current.y}px) translate(-50%, -50%)`;
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(applyPosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.classList.remove('cursor-ready');
    };
  }, []);

  return createPortal(
    <div 
      ref={cursorRef} 
      className={clsx('cursor', active && 'is-active')}
      aria-hidden="true"
    >
      <span className="cursor-dot"></span>
      <span className="cursor-label">{label}</span>
    </div>,
    document.body
  );
};
