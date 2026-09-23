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
    // What the pointer is over. Set on `mouseover` (fires only when the
    // hovered element changes), written as a data attribute so React's own
    // className management never overwrites it and nothing re-renders.
    let magnetEl = null;
    const MAGNET_MAX = 3; // px — the dot leans toward a button's centre, never more

    const applyPosition = () => {
      pending = false;
      const el = cursorRef.current;
      if (!el) return;
      let { x, y } = mouseRef.current;
      if (magnetEl) {
        const r = magnetEl.getBoundingClientRect();
        const clamp = (v) => Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, v));
        x += clamp((r.left + r.width / 2 - x) * 0.12);
        y += clamp((r.top + r.height / 2 - y) * 0.12);
      }
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };

    const schedule = () => {
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(applyPosition);
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      schedule();
    };

    const handleMouseOver = (e) => {
      const el = cursorRef.current;
      if (!el || !(e.target instanceof Element)) return;
      const interactive = e.target.closest('a, button, [role="button"], summary, label');
      const field = e.target.closest('input, textarea, select');
      const image = !interactive && e.target.closest('img, video, .photoFrame, .photoFrame-img');
      magnetEl = interactive && interactive.matches('button, .t-btn, .btn-ticket') ? interactive : null;
      el.dataset.mode = field ? 'field' : interactive ? 'link' : image ? 'image' : '';
      schedule();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
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
