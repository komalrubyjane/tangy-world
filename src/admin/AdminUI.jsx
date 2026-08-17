export const STATUS_COLORS = {
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  paid: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  published: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  converted: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  reviewing: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  waiting: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  scheduled: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  notified: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40',
  contacted: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  cancelled: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  refunded: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  closed: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  archived: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  expired: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  new: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  read: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40',
  replied: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  draft: 'bg-[#E7D5A4]/10 text-[#E7D5A4]/70 border-[#E7D5A4]/30',
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase border rounded whitespace-nowrap ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status}
  </span>
);

export const SearchBar = ({ value, onChange, placeholder, count }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'Search...'}
      className="w-full sm:w-80 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2.5 sm:py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E] transition-colors"
    />
    {typeof count === 'number' && (
      <span className="text-[10px] text-[#E7D5A4]/50 uppercase font-bold">{count} result{count !== 1 ? 's' : ''}</span>
    )}
  </div>
);

export const LoadMoreButton = ({ hasMore, onClick }) => {
  if (!hasMore) return null;
  return (
    <button
      onClick={onClick}
      className="mt-4 w-full py-2.5 border border-[#C99A2E]/40 text-[#C99A2E] text-[10px] font-bold uppercase hover:bg-[#C99A2E]/10 active:scale-[0.99] transition-all"
    >
      LOAD MORE ↓
    </button>
  );
};

export const EmptyState = ({ children }) => (
  <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30 animate-[fadeIn_0.3s_ease]">
    {children}
  </div>
);

export const LoadingState = () => (
  <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div>
);

export const NotConfiguredState = () => (
  <div className="p-10 text-center font-mono text-xs font-bold text-[#C99A2E] border-2 border-dashed border-[#C99A2E]/40">
    BACKEND NOT CONNECTED — run the Supabase migrations to enable this section.
  </div>
);

export const ActionButton = ({ onClick, tone = 'default', children, disabled }) => {
  const tones = {
    default: 'bg-[#191410] text-[#E7D5A4] border-[#C99A2E]/40 hover:border-[#C99A2E]',
    success: 'bg-[#10b981] text-[#11100C] border-[#10b981]',
    danger: 'bg-[#ef4444] text-white border-[#ef4444]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2.5 py-1.5 min-h-[30px] text-[9px] font-bold uppercase border rounded-sm active:scale-95 transition-all ${tones[tone]} disabled:opacity-40`}
    >
      {children}
    </button>
  );
};

export const StatCard = ({ label, value, sub, accent }) => (
  <div className="bg-[#191410] border border-[#C99A2E]/60 p-4 sm:p-5 rounded-sm hover:border-[#C99A2E] transition-colors duration-200">
    <div className="text-[9px] sm:text-[10px] text-[#C99A2E] uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-2xl sm:text-3xl font-bold ${accent ? 'text-[#C99A2E]' : 'text-[#E7D5A4]'}`}>{value}</div>
    {sub && <div className="text-[9px] text-[#E7D5A4]/50 mt-1">{sub}</div>}
  </div>
);

// Responsive data table: renders an actual <table> from md upward, and a
// card list below md — same data, no separate mobile component needed per
// section. Tables don't reflow sensibly at 320-430px, cards do.
export const DataTable = ({ columns, rows, rowKey = 'id', renderCard, onRowClick }) => (
  <>
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-[#C99A2E]/40 text-[#C99A2E]">
            {columns.map((c) => <th key={c.key} className="py-2 pr-3">{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-[#E7D5A4]/10 ${onRowClick ? 'cursor-pointer hover:bg-[#C99A2E]/5' : ''}`}
            >
              {columns.map((c) => <td key={c.key} className="py-3 pr-3 align-top">{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="md:hidden flex flex-col gap-3">
      {rows.map((row) => (
        <div
          key={row[rowKey]}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={`bg-[#11100C] border border-[#C99A2E]/30 p-4 rounded-sm ${onRowClick ? 'active:scale-[0.99] transition-transform' : ''}`}
        >
          {renderCard(row)}
        </div>
      ))}
    </div>
  </>
);

export const Modal = ({ children, onClose, wide }) => (
  <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 animate-[fadeIn_0.2s_ease]" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92dvh] overflow-y-auto bg-[#191410] border-2 border-[#C99A2E] p-5 sm:p-6 flex flex-col gap-3 text-[#E7D5A4] rounded-t-lg sm:rounded-sm animate-[modalIn_0.2s_ease]`}
    >
      {children}
    </div>
  </div>
);

export const Drawer = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[300] flex items-end sm:items-center sm:justify-end bg-black/70 animate-[fadeIn_0.2s_ease]" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:max-w-md max-h-[92dvh] sm:h-full overflow-y-auto bg-[#191410] border-t-2 sm:border-t-0 sm:border-l-2 border-[#C99A2E] p-5 sm:p-6 flex flex-col gap-4 text-[#E7D5A4] rounded-t-lg sm:rounded-none animate-[drawerIn_0.25s_ease]"
    >
      {children}
    </div>
  </div>
);

export const MockModeBadge = () => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/40 rounded-sm">
    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
    MOCK MODE
  </span>
);
