import { useEffect, useRef, useState } from 'react';
import { TangyAssistant } from './TangyAssistant';

/**
 * Floating "Tangy Assistant" launcher — a small fixed button that opens a
 * compact chat panel without leaving the current page. Positioned clear of
 * MuseumQuickDock (fixed bottom-4 left-1/2, z-[140]).
 *
 * Not wired into App.jsx by design — mount this once, globally, wherever
 * the app root layout lives.
 */
export const TangyAssistantLauncher = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Keep the composer above the on-screen keyboard: where the browser
  // overlays the keyboard instead of resizing the page (iOS Safari), lift the
  // panel by the part of the layout viewport the keyboard covers.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return undefined;
    const sync = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      panelRef.current?.style.setProperty('--kb-inset', `${Math.round(covered)}px`);
    };
    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => { vv.removeEventListener('resize', sync); vv.removeEventListener('scroll', sync); };
  }, [open]);

  // Escape closes the floating panel.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close Tangy Assistant' : 'Open Tangy Assistant'}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:bottom-6 right-4 md:right-6 z-[130] flex items-center gap-1.5 min-h-[44px] border border-[#181614] bg-[#C89D35] text-[#181614] font-mono text-[10px] font-medium uppercase tracking-[0.16em] px-3 py-2.5 shadow-[3px_3px_0_#181614] hover:bg-[#EFE2C0] transition-colors"
      >
        <span className="text-sm leading-none">{open ? '✕' : '◆'}</span>
        <span className="hidden sm:inline">{open ? 'CLOSE' : 'TANGY ASSISTANT'}</span>
      </button>

      {open && (
        <div ref={panelRef} className="assistant-panel" data-lenis-prevent>
          <TangyAssistant variant="floating" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};
