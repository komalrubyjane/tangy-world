import { useState } from 'react';
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
        <div className="fixed z-[131] bottom-[calc(10rem+env(safe-area-inset-bottom))] lg:bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-[380px] md:right-8">
          <TangyAssistant variant="floating" onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
};
