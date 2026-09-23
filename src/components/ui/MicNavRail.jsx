import { useEffect, useState } from 'react';
import { useLenis } from '../layout/LenisProvider';
import { HOME_CHAPTERS } from '../../data/homeChapters';

// The homepage's one navigation instrument (replaces GlobalMicrophoneJourney,
// which swung a microphone along a cable across the whole page on every
// scroll frame). Modelled on an old OS scrollbar: a fixed rail on the right
// edge, one tick per chapter, and the vintage microphone as the "thumb". The
// mic only moves when the active chapter changes — a single CSS transform
// transition, no scroll-linked animation loop.
//
// Desktop only (lg+). On phones/tablets a side rail would cover content, so
// the header shows a compact "04 — Archive" indicator instead (fed by the
// `tangy:chapter` event dispatched below).
const TICK_GAP = 34; // px between chapter ticks

export const MicNavRail = () => {
  const lenis = useLenis();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = HOME_CHAPTERS
      .map((c) => document.getElementById(c.id))
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return undefined;

    // A thin band across the middle of the viewport: whichever chapter
    // crosses it is "current". Works for pinned sections too, since a pinned
    // section stays in that band for its whole pin duration.
    // Track every chapter currently in the band and pick the last one in
    // chapter order, so two chapters touching the band at once resolve
    // deterministically.
    const inBand = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = HOME_CHAPTERS.findIndex((c) => c.id === entry.target.id);
          if (idx === -1) return;
          if (entry.isIntersecting) inBand.add(idx);
          else inBand.delete(idx);
        });
        if (inBand.size) setActive(Math.max(...inBand));
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Tell the mobile header which chapter is current (it shows a compact
  // "04 — Archive" indicator instead of this rail).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tangy:chapter', { detail: active }));
  }, [active]);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Pinned sections are wrapped in a GSAP pin-spacer; scrolling to the
    // spacer lands on the start of the pin instead of mid-animation.
    const target = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
    if (lenis) lenis.scrollTo(target, { duration: 1.1 });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const railHeight = (HOME_CHAPTERS.length - 1) * TICK_GAP;

  return (
    <nav
      aria-label="Homepage chapters"
      className="mic-rail hidden lg:block fixed right-2 top-1/2 -translate-y-1/2 z-[120] select-none bg-[#181614]/90 border border-[#EFE2C0]/15 px-1.5 py-2"
    >
      {/* Dark panel so the rail reads the same over light paper and dark
          archive sections alike. */}
      <div className="relative w-[36px]" style={{ height: railHeight + 24 }}>
        {/* The rail itself — a single hairline, like a scrollbar track */}
        <span
          className="absolute right-[5px] top-3 w-px bg-[#EFE2C0]/25"
          style={{ height: railHeight }}
          aria-hidden="true"
        />

        {/* Progress along the index: a gold line grown with scaleY (compositor-only) */}
        <span
          className="absolute right-[5px] top-3 w-px bg-[#C89D35] origin-top transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          style={{ height: railHeight, transform: `scaleY(${active / (HOME_CHAPTERS.length - 1)})` }}
          aria-hidden="true"
        />

        {/* Index scale: one hairline tick per chapter */}
        {HOME_CHAPTERS.map((c, i) => (
          <span
            key={`tick-${c.id}`}
            className={`absolute right-[3px] h-px w-[5px] transition-colors duration-300 ${i <= active ? 'bg-[#C89D35]' : 'bg-[#EFE2C0]/35'}`}
            style={{ top: i * TICK_GAP + 12 }}
            aria-hidden="true"
          />
        ))}

        {/* Microphone thumb: parks beside the active chapter */}
        <img
          src="/media/opt/mic.webp"
          alt=""
          aria-hidden="true"
          width="14"
          height="30"
          decoding="async"
          className="absolute -right-[2px] top-0 w-[14px] h-[30px] object-contain pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
          style={{ transform: `translateY(${active * TICK_GAP - 1}px)` }}
        />

        <ol className="relative m-0 p-0 list-none">
          {HOME_CHAPTERS.map((c, i) => {
            const isActive = i === active;
            return (
              <li key={c.id} className="absolute left-0" style={{ top: i * TICK_GAP }}>
                <button
                  type="button"
                  onClick={() => goTo(c.id)}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`${String(i + 1).padStart(2, '0')} ${c.label}`}
                  className="group relative flex items-center h-6 w-6 font-mono text-[10px] tracking-[0.1em] uppercase"
                >
                  <span
                    className={`absolute right-full mr-3 whitespace-nowrap px-2 py-1 border border-[#EFE2C0]/15 bg-[#181614] pointer-events-none transition-[opacity,translate] duration-300 ease-out ${
                      isActive
                        ? 'opacity-0 translate-x-1.5 xl:opacity-100 xl:translate-x-0 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 text-[#EFE2C0]'
                        : 'opacity-0 translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 text-[#EFE2C0]/80'
                    }`}
                  >
                    {c.label}
                  </span>
                  <span
                    className={`tabular-nums transition-colors duration-300 ${isActive ? 'text-[#C89D35]' : 'text-[#EFE2C0]/55 group-hover:text-[#EFE2C0]'}`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
