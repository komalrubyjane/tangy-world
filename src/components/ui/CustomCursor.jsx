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
      
      document.documentElement.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      document.documentElement.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };

    window.addEventListener('mousemove', handleMouseMove);

    let rafId;
    const render = () => {
      curRef.current.x += (mouseRef.current.x - curRef.current.x) * 0.18;
      curRef.current.y += (mouseRef.current.y - curRef.current.y) * 0.18;
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${curRef.current.x}px, ${curRef.current.y}px) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
