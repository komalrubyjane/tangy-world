import { useState } from 'react';
import { TangyAssistant } from './TangyAssistant';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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
  const reducedMotion = useReducedMotion();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close Tangy Assistant' : 'Open Tangy Assistant'}
        className="fixed bottom-24 right-4 md:right-6 z-[130] flex items-center gap-1.5 border-4 border-[#11100C] bg-[#C99A2E] text-[#11100C] font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-2.5 shadow-[4px_4px_0px_#11100C] hover:bg-[#E7D5A4] active:scale-95 transition-colors relative"
      >
        {/* Tiny decorative "live signal" equalizer badge — purely
            ornamental, transform-only, off when reduced motion is set. */}
        {!open && !reducedMotion && (
          <span
            className="absolute -top-1.5 -left-1.5 flex items-end gap-[1.5px] h-2.5 w-3 pointer-events-none"
            aria-hidden="true"
          >
            <span
              className="w-[2px] h-2 bg-[#C2272A] rounded-full origin-bottom animate-[eqBar_0.9s_ease-in-out_infinite]"
            />
            <span
              className="w-[2px] h-2 bg-[#C2272A] rounded-full origin-bottom animate-[eqBar_0.9s_ease-in-out_infinite]"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="w-[2px] h-2 bg-[#C2272A] rounded-full origin-bottom animate-[eqBar_0.9s_ease-in-out_infinite]"
              style={{ animationDelay: '0.4s' }}
            />
          </span>
        )}
        <span className="text-sm leading-none">{open ? '✕' : '◆'}</span>
        <span className="hidden sm:inline">{open ? 'CLOSE' : 'TANGY ASSISTANT'}</span>
      </button>

      {open && (
        <div className="fixed z-[131] bottom-40 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] md:right-8">
          <TangyAssistant variant="floating" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};
