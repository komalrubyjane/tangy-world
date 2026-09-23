import { StatusBadge } from '../../admin/AdminUI';

// Chat thread header — name/role/status plus an actions slot so the Admin
// Inbox, Tangy Assistant, and artist chat view can each supply their own
// buttons (assign/resolve/reopen, close, etc.) without three header impls.
export const ChatHeader = ({ title, subtitle, status, onBack, actions }) => (
  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-4 border-[#C99A2E] bg-[#1A140F]">
    <div className="flex items-center gap-2 min-w-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="shrink-0 font-mono text-lg text-[#E7D5A4] hover:text-[#C99A2E] px-1"
        >
          ←
        </button>
      )}
      <div className="min-w-0">
        <div className="font-condensed text-sm text-[#E7D5A4] uppercase tracking-wide truncate">{title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {subtitle && <span className="font-mono text-[9px] text-[#C99A2E] uppercase tracking-wider truncate">{subtitle}</span>}
          {status && <StatusBadge status={status} />}
        </div>
      </div>
    </div>
    {actions && <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">{actions}</div>}
  </div>
);
