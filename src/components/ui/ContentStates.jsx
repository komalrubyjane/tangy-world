// Shared loading / empty / error blocks for the public CMS pages.
export const ContentLoading = ({ label = 'Loading…' }) => (
  <div role="status" aria-live="polite" className="py-20 text-center font-mono text-xs uppercase tracking-widest opacity-70">{label}</div>
);

export const ContentError = ({ onRetry, children = 'We couldn’t load this right now.' }) => (
  <div role="alert" className="py-16 text-center font-mono text-xs flex flex-col items-center gap-3">
    <p className="m-0 uppercase tracking-widest">{children}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="min-h-[44px] px-4 border-2 border-current font-bold uppercase tracking-widest">Try again</button>
    )}
  </div>
);

export const ContentEmpty = ({ children }) => (
  <div className="py-20 text-center font-mono text-xs uppercase tracking-widest opacity-60">{children}</div>
);
