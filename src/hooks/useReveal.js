import { useEffect, useRef } from 'react';

const REVEAL_SELECTOR = '.reveal, .reveal-type, .reveal-paper, .reveal-stamp, .reveal-frame';

// Calm, one-shot scroll reveal: every reveal element inside the returned ref
// gets `.is-visible` the first time it enters the viewport, then is
// unobserved. The root itself toggles `.in-view` while on screen, which is
// what lets section-level effects (e.g. the Private Sessions film grain)
// run only while they can be seen. CSS transitions only; reduced motion is
// handled in CSS.
export function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll(REVEAL_SELECTOR);
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      root.classList.add('in-view');
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    targets.forEach((el) => io.observe(el));

    const rootIo = new IntersectionObserver(([entry]) => {
      root.classList.toggle('in-view', entry.isIntersecting);
    });
    rootIo.observe(root);

    return () => {
      io.disconnect();
      rootIo.disconnect();
    };
  }, []);

  return ref;
}
