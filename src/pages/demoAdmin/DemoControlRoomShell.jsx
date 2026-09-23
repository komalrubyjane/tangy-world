import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';
import { PortalsSection } from '../../admin/sections/PortalsSection';
import {
  DemoOverviewSection, DemoEventsSection, DemoBookingsSection, DemoAttendeesSection,
  DemoArtistsSection, DemoApplicationsSection, DemoUsersSection, DemoPaymentsSection,
  DemoEnquiriesSection, DemoWaitlistSection,
} from './DemoAdminSections';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// A dedicated Control Room shell for demo mode — deliberately NOT the real
// AdminDashboard (src/pages/AdminPage.jsx). Reusing that would mean every
// section inside it firing real (safely-empty, RLS-blocked) Supabase
// queries; this shell points every nav item at the fabricated data in
// demoAdminData.js instead, so the demo actually looks populated. Same
// visual layout as the real Control Room for consistency. "View Portals"
// reuses the REAL PortalsSection component (it's pure links, no data
// fetching) pointed at /demo instead of /admin/preview.
const DemoCheckInNote = () => (
  <div className="bg-[#191410] border-2 border-dashed border-[#C99A2E]/40 p-10 rounded-sm text-center">
    <h3 className="text-lg font-bold text-[#C99A2E] mb-2">CHECK-IN — LIVE TOOL</h3>
    <p className="text-xs text-[#E7D5A4]/60 max-w-md mx-auto leading-relaxed">
      QR check-in scans a real camera feed and writes a real check-in record — it isn't simulated in this demo tour.
    </p>
  </div>
);

const NAV_GROUPS = [
  { label: 'Overview', items: [{ id: 'overview', label: 'Overview', icon: '📊', component: DemoOverviewSection }] },
  { label: 'Portals', items: [{ id: 'portals', label: 'View Portals', icon: '🚪', component: PortalsSection }] },
  {
    label: 'Operations',
    items: [
      { id: 'events', label: 'Events', icon: '🏛️', component: DemoEventsSection },
      { id: 'bookings', label: 'Bookings', icon: '🎫', component: DemoBookingsSection },
      { id: 'attendees', label: 'Attendees', icon: '🪪', component: DemoAttendeesSection },
      { id: 'checkin', label: 'Check-In', icon: '📷', component: DemoCheckInNote },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'artists', label: 'Artists', icon: '🎷', component: DemoArtistsSection },
      { id: 'users', label: 'Users', icon: '👤', component: DemoUsersSection },
    ],
  },
  { label: 'Applications', items: [{ id: 'applications', label: 'Applications', icon: '🤝', component: DemoApplicationsSection }] },
  { label: 'Enquiries', items: [
    { id: 'private', label: 'Enquiries', icon: '✉️', component: DemoEnquiriesSection },
    { id: 'waitlist', label: 'Waitlist', icon: '⏳', component: DemoWaitlistSection },
  ] },
  { label: 'Finance', items: [{ id: 'payments', label: 'Payments', icon: '💳', component: DemoPaymentsSection }] },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const NavList = ({ activeTab, onSelect }) => (
  <nav className="flex flex-col gap-5">
    {NAV_GROUPS.map((group) => (
      <div key={group.label}>
        <div className="px-3 mb-1.5 font-mono text-[9px] font-bold tracking-[0.25em] text-[#C99A2E]/60 uppercase">{group.label}</div>
        <div className="flex flex-col gap-0.5">
          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-sm transition-colors text-left ${
                activeTab === item.id ? 'bg-[#C99A2E] text-[#11100C] shadow-[2px_2px_0px_#11100C]' : 'text-[#E7D5A4]/80 hover:text-[#E7D5A4] hover:bg-[#C99A2E]/10'
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    ))}
  </nav>
);

export const DemoControlRoomShell = () => {
  const navigate = useNavigate();
  const { exitDemo } = useDemoAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const select = (id) => { setActiveTab(id); setDrawerOpen(false); };
  const handleExit = () => { exitDemo(); navigate('/'); };

  const active = ALL_ITEMS.find((i) => i.id === activeTab);
  const ActiveComponent = active?.component || DemoOverviewSection;

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r-2 border-[#C99A2E]/30 bg-[#191410] h-screen sticky top-0 overflow-y-auto">
        <div className="p-5 border-b border-[#C99A2E]/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B2E00] animate-pulse" />
            <span className="font-condensed font-bold text-lg tracking-tight">TANGY CONTROL ROOM</span>
          </div>
          <p className="font-serif italic text-[10px] text-[#E7D5A4]/60 mt-1">DEMO ADMIN · TEAM PREVIEW</p>
        </div>
        <div className="p-4 flex-1">
          <NavList activeTab={activeTab} onSelect={select} />
        </div>
        <div className="p-4 border-t border-[#C99A2E]/30 flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="text-[10px] font-bold uppercase tracking-wider text-[#E7D5A4]/60 hover:text-[#E7D5A4] text-left">← View Website</button>
          <button onClick={handleExit} className="text-[10px] font-bold uppercase tracking-wider text-[#8B2E00] hover:text-[#ef4444] text-left">Exit Demo ✕</button>
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-[400] lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#191410] border-r-2 border-[#C99A2E] overflow-y-auto animate-[drawerIn_0.2s_ease]">
            <div className="p-5 border-b border-[#C99A2E]/30 flex justify-between items-start">
              <div>
                <span className="font-condensed font-bold text-base">TANGY CONTROL ROOM</span>
                <p className="font-serif italic text-[10px] text-[#E7D5A4]/60 mt-1">DEMO ADMIN</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-lg leading-none opacity-70">✕</button>
            </div>
            <div className="p-4"><NavList activeTab={activeTab} onSelect={select} /></div>
            <div className="p-4 border-t border-[#C99A2E]/30 flex flex-col gap-2">
              <button onClick={() => navigate('/')} className="text-[10px] font-bold uppercase tracking-wider text-[#E7D5A4]/60 text-left">← View Website</button>
              <button onClick={handleExit} className="text-[10px] font-bold uppercase tracking-wider text-[#8B2E00] text-left">Exit Demo ✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-[100] bg-[#191410] border-b-2 border-[#C99A2E]/40 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setDrawerOpen(true)} className="border border-[#C99A2E]/60 text-[#C99A2E] px-3 py-1.5 text-xs font-bold uppercase">☰ MENU</button>
          <span className="font-condensed font-bold text-sm">{active?.label?.toUpperCase() || 'OVERVIEW'}</span>
          <button onClick={handleExit} className="border border-[#8B2E00]/60 text-[#8B2E00] px-2.5 py-1.5 text-[10px] font-bold uppercase">EXIT</button>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h1 className="font-condensed text-2xl font-bold tracking-tight">{active?.label?.toUpperCase() || 'OVERVIEW'}</h1>
          </div>
          <ActiveComponent onNavigate={select} basePath="/demo" />
        </main>
      </div>
    </div>
  );
};
