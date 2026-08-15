export const STATUS_COLORS = {
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  cancelled: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  refunded: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  new: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  read: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40',
  replied: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
};

export const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border rounded ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
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
      className="w-full sm:w-80 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
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
      className="mt-4 w-full py-2 border border-[#C99A2E]/40 text-[#C99A2E] text-[10px] font-bold uppercase hover:bg-[#C99A2E]/10"
    >
      LOAD MORE ↓
    </button>
  );
};

export const EmptyState = ({ children }) => (
  <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
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
    success: 'bg-[#10b981] text-[#11100C]',
    danger: 'bg-[#ef4444] text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 text-[9px] font-bold uppercase border ${tones[tone]} disabled:opacity-40`}
    >
      {children}
    </button>
  );
};
