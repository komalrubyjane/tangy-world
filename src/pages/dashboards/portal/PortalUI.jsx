import { Link } from 'react-router-dom';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';

// Shared portal infrastructure — every role-specific dashboard (Crew,
// Volunteer, Vendor, Sponsor, Venue) is built from these, but each owns its
// own tabs/sections/data so the *functionality* stays genuinely different
// per role. This only standardizes the chrome (header/tabs/empty/loading),
// never the content.

const STATUS_COLORS = {
  approved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  confirmed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  delivered: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  done: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  completed: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  assigned: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  in_progress: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  rejected: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
  declined: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40',
};

export const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {(status || 'n/a').replace('_', ' ')}
  </span>
);

export const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">
    {children}
  </div>
);

export const Loading = ({ label = 'LOADING...' }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50">{label}</div>
);

export const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const iso = typeof d === 'string' && d.length === 10 ? `${d}T00:00:00` : d;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(d);
  }
};

export const ReadOnlyNote = ({ children }) => (
  <div className="p-4 bg-[#B94717]/10 border-2 border-[#B94717]/40 font-mono text-[10px] font-bold text-[#E7D5A4]/70 uppercase">
    {children || 'Not available in admin preview — actions are disabled while inspecting another account.'}
  </div>
);

export const StatTile = ({ label, value, sub }) => (
  <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-4 sm:p-5 shadow-[5px_5px_0px_#11100C]">
    <span className="font-mono text-[9px] font-bold uppercase text-[#B94717]">{label}</span>
    <div className="font-display text-3xl font-bold mt-1">{value}</div>
    {sub && <p className="font-mono text-[10px] text-[#11100C]/60 mt-1">{sub}</p>}
  </div>
);

// `preview` = { label } — when set, this dashboard is being rendered for an
// ADMIN inspecting someone else's portal, not the actual owner. Never pass
// this based on anything other than a real is_admin()-backed session; the
// banner is a UI affordance, not the security boundary (RLS is).
export const AdminPreviewBanner = ({ label }) => (
  <div className="sticky top-[49px] z-[90] bg-[#B94717] text-[#E7D5A4] border-b-2 border-[#11100C]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E7D5A4] animate-pulse shrink-0" />
        <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
          ADMIN PREVIEW · {label}
        </span>
      </div>
      <Link
        to="/admin"
        className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-[#E7D5A4]/60 px-2.5 py-1 hover:bg-[#E7D5A4] hover:text-[#B94717] transition-colors"
      >
        ← BACK TO CONTROL ROOM
      </Link>
    </div>
  </div>
);

export const PortalShell = ({ icon, roleLabel, title, subtitle, statusBadge, tabs, activeTab, onTabChange, onLogout, preview, children }) => (
  <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
    <Navbar />
    {preview && <AdminPreviewBanner label={preview.label} />}

    <section className="pt-24 sm:pt-28 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="bg-[#191410] border-2 border-[#C99A2E] p-4 sm:p-6 shadow-[8px_8px_0px_#11100C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-[#E7D5A4] text-[#11100C] rounded-full border-2 border-[#B94717] flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">{roleLabel}</span>
            <h1 className="font-display text-xl sm:text-2xl font-bold uppercase">{title}</h1>
            {subtitle && <span className="font-mono text-[10px] text-[#E7D5A4]/60">{subtitle}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge}
          {!preview && (
            <button onClick={onLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              LOG OUT ✕
            </button>
          )}
        </div>
      </div>
    </section>

    <section className="px-4 sm:px-6 max-w-6xl mx-auto">
      <nav className="flex flex-wrap gap-2 border-b-2 border-[#C99A2E]/40 pb-3 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase border transition-colors ${
              activeTab === tab.id ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]' : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </section>

    <section className="px-4 sm:px-6 max-w-6xl mx-auto pb-20">{children}</section>

    <Footer />
  </div>
);
