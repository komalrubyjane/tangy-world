// Artist portal helpers (formatting, class names, calendar grids).
export const cx = (...a) => a.filter(Boolean).join(' ');
export const fmtDate = (d) => (d ? new Date(String(d).length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—');
export const fmtMoney = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export { iso, monthGrid, WEEKDAYS } from '../../lib/calendarDates';
