import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCursor } from '../../hooks/useCursor';
import clsx from 'clsx';
import '../../styles/cursor.css';

export const CustomCursor = () => {
  const { active, label } = useCursor();
  const cursorRef = useRef(null);
  const curRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const isTouch = window.matchMedia('(hover:none), (pointer:coarse)').matches;
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isTouch || isReduced) return;

    document.body.classList.add('cursor-ready');

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    let rafId;
    let loopRunning = false;

    const render = () => {
      const dx = mouseRef.current.x - curRef.current.x;
      const dy = mouseRef.current.y - curRef.current.y;
      curRef.current.x += dx * 0.18;
      curRef.current.y += dy * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${curRef.current.x}px, ${curRef.current.y}px) translate(-50%, -50%)`;
      }

      // Stop once the lerp has caught up instead of running forever —
      // a mousemove event restarts it. Avoids a permanent 60fps loop
      // (and the style write it does every tick) while the pointer sits
      // still, which was compounding with everything else on the page.
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafId = requestAnimationFrame(render);
      } else {
        loopRunning = false;
      }
    };

    const ensureLoopRunning = () => {
      if (!loopRunning) {
        loopRunning = true;
        rafId = requestAnimationFrame(render);
      }
    };

    const handleMouseMoveAndRestart = (e) => {
      handleMouseMove(e);
      ensureLoopRunning();
    };

    window.addEventListener('mousemove', handleMouseMoveAndRestart);
    ensureLoopRunning();

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveAndRestart);
      cancelAnimationFrame(rafId);
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
