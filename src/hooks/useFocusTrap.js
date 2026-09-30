import { useEffect } from 'react';

// Keeps Tab / Shift+Tab inside an open dialog, focuses it on open and puts
// focus back where it was on close.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const root = ref.current;
    const previous = document.activeElement;
    // React's autoFocus may already have placed focus inside; keep it.
    if (!root.contains(document.activeElement)) {
      const first = root.querySelector('[data-autofocus]') || root.querySelector('input, select, textarea') || root.querySelector(FOCUSABLE);
      (first || root).focus({ preventScroll: true });
    }
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); return; }
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    root.addEventListener('keydown', onKey);
    return () => { root.removeEventListener('keydown', onKey); if (previous?.focus) previous.focus({ preventScroll: true }); };
  }, [ref, active]);
}
