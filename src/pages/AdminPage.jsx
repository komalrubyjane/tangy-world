import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { StaffAuthGate } from '../admin/StaffAuthGate';
import { useUserAuth } from '../context/UserAuthContext';
import { OverviewSection } from '../admin/sections/OverviewSection';
import { PortalsSection } from '../admin/sections/PortalsSection';
import { BookingsSection } from '../admin/sections/BookingsSection';
import { EventsSection } from '../admin/sections/EventsSection';
import { AttendeesSection } from '../admin/sections/AttendeesSection';
import { ArtistsSection } from '../admin/sections/ArtistsSection';
import { UsersSection } from '../admin/sections/UsersSection';
import { CrewSection } from '../admin/sections/CrewSection';
import { CollaborationsSection } from '../admin/sections/CollaborationsSection';
import { ContactEnquiriesSection, PrivateEnquiriesSection } from '../admin/sections/EnquiriesSection';
import { WaitlistSection } from '../admin/sections/WaitlistSection';
import { InboxSection } from '../admin/sections/InboxSection';
import { NotificationsSection } from '../admin/sections/NotificationsSection';
import { PaymentsSection } from '../admin/sections/PaymentsSection';
import { AnnouncementsSection } from '../admin/sections/AnnouncementsSection';
import { TVChannelsSection } from '../admin/sections/TVChannelsSection';
import { SettingsSection } from '../admin/sections/SettingsSection';

// The Control Room's navigation taxonomy — grouped, not a flat tab strip.
// Each item is either a `component` rendered inline or `href` for a
// standalone route (Check-In has its own full-screen scanner UI).
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'overview', label: 'Overview', icon: '📊', component: OverviewSection }],
  },
  {
    label: 'Portals',
    items: [{ id: 'portals', label: 'View Portals', icon: '🚪', component: PortalsSection }],
  },
  {
    label: 'Operations',
    items: [
      { id: 'events', label: 'Events', icon: '🏛️', component: EventsSection },
      { id: 'bookings', label: 'Bookings', icon: '🎫', component: BookingsSection },
      { id: 'attendees', label: 'Attendees', icon: '🪪', component: AttendeesSection },
      { id: 'checkin', label: 'Check-In', icon: '📷', href: '/check-in' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'artists', label: 'Artists', icon: '🎷', component: ArtistsSection },
      { id: 'users', label: 'Users', icon: '👤', component: UsersSection },
    ],
  },
  {
    label: 'Applications',
    items: [
      { id: 'crew', label: 'Crew & Volunteers', icon: '🤝', component: CrewSection },
      { id: 'collab', label: 'Collaborations', icon: '🤲', component: CollaborationsSection },
    ],
  },
  {
    label: 'Enquiries',
    items: [
      { id: 'private', label: 'Private Sessions', icon: '✨', component: PrivateEnquiriesSection },
      { id: 'contact', label: 'Contact', icon: '✉️', component: ContactEnquiriesSection },
      { id: 'waitlist', label: 'Waitlist', icon: '⏳', component: WaitlistSection },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'inbox', label: 'Messages', icon: '📥', component: InboxSection },
      { id: 'notifications', label: 'Notifications', icon: '🔔', component: NotificationsSection },
    ],
  },
  {
    label: 'Finance',
    items: [{ id: 'payments', label: 'Payments', icon: '💳', component: PaymentsSection }],
  },
  {
    label: 'Content',
    items: [
      { id: 'announcements', label: 'Content', icon: '📣', component: AnnouncementsSection },
      { id: 'tv', label: 'Media — Tangy TV', icon: '📺', component: TVChannelsSection },
    ],
  },
  {
    label: 'Account',
    items: [{ id: 'settings', label: 'Settings', icon: '⚙', component: SettingsSection }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const NavList = ({ activeTab, onSelect }) => (
  <nav className="flex flex-col gap-5">
    {NAV_GROUPS.map((group) => (
      <div key={group.label}>
        <div className="px-3 mb-1.5 font-mono text-[9px] font-bold tracking-[0.25em] text-[#C99A2E]/60 uppercase">
          {group.label}
        </div>
        <div className="flex flex-col gap-0.5">
          {group.items.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#E7D5A4]/80 hover:text-[#E7D5A4] hover:bg-[#C99A2E]/10 rounded-sm transition-colors"
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
                <span className="ml-auto text-[9px] opacity-50">↗</span>
              </Link>
            ) : (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-sm transition-colors text-left ${
                  activeTab === item.id
                    ? 'bg-[#C99A2E] text-[#11100C] shadow-[2px_2px_0px_#11100C]'
                    : 'text-[#E7D5A4]/80 hover:text-[#E7D5A4] hover:bg-[#C99A2E]/10'
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </div>
      </div>
    ))}
  </nav>
);

// Exported so the demo-admin build can reuse the same Control Room UI under
// a different auth gate — see src/pages/demoAdmin/DemoControlRoom.jsx.
// Never render without an auth gate wrapping it (AdminPage below, or
// DemoAdminGate).
export const AdminDashboard = ({ portalsBasePath = '/admin/preview' } = {}) => {
  const navigate = useNavigate();
  const { logout, user } = useUserAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(ALL_ITEMS.some((i) => i.id === initialTab) ? initialTab : 'overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const select = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  const active = ALL_ITEMS.find((i) => i.id === activeTab);
  const ActiveComponent = active?.component || OverviewSection;

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r-2 border-[#C99A2E]/30 bg-[#191410] h-screen sticky top-0 overflow-y-auto">
        <div className="p-5 border-b border-[#C99A2E]/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B94717] animate-pulse" />
            <span className="font-display font-bold text-lg tracking-tight">TANGY CONTROL ROOM</span>
          </div>
          <p className="font-serif italic text-[10px] text-[#E7D5A4]/60 mt-1">{user?.role?.toUpperCase()} · {user?.email}</p>
        </div>
        <div className="p-4 flex-1">
          <NavList activeTab={activeTab} onSelect={select} />
        </div>
        <div className="p-4 border-t border-[#C99A2E]/30 flex flex-col gap-2">
          <button onClick={() => navigate('/')} className="text-[10px] font-bold uppercase tracking-wider text-[#E7D5A4]/60 hover:text-[#E7D5A4] text-left">
            ← View Website
          </button>
          <button onClick={logout} className="text-[10px] font-bold uppercase tracking-wider text-[#C2272A] hover:text-[#ef4444] text-left">
            Log Out ✕
          </button>
        </div>
      </aside>

      {/* MOBILE/TABLET DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[400] lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-[#191410] border-r-2 border-[#C99A2E] overflow-y-auto animate-[drawerIn_0.2s_ease]">
            <div className="p-5 border-b border-[#C99A2E]/30 flex justify-between items-start">
              <div>
                <span className="font-display font-bold text-base">TANGY CONTROL ROOM</span>
                <p className="font-serif italic text-[10px] text-[#E7D5A4]/60 mt-1">{user?.email}</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-lg leading-none opacity-70">✕</button>
            </div>
            <div className="p-4">
              <NavList activeTab={activeTab} onSelect={select} />
            </div>
            <div className="p-4 border-t border-[#C99A2E]/30 flex flex-col gap-2">
              <button onClick={() => navigate('/')} className="text-[10px] font-bold uppercase tracking-wider text-[#E7D5A4]/60 text-left">← View Website</button>
              <button onClick={logout} className="text-[10px] font-bold uppercase tracking-wider text-[#C2272A] text-left">Log Out ✕</button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN COLUMN */}
      <div className="flex-1 min-w-0">
        {/* MOBILE/TABLET TOP BAR */}
        <header className="lg:hidden sticky top-0 z-[100] bg-[#191410] border-b-2 border-[#C99A2E]/40 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setDrawerOpen(true)} className="border border-[#C99A2E]/60 text-[#C99A2E] px-3 py-1.5 text-xs font-bold uppercase">
            ☰ MENU
          </button>
          <span className="font-display font-bold text-sm">{active?.label?.toUpperCase() || 'OVERVIEW'}</span>
          <Link to="/check-in" className="border border-[#C99A2E]/60 text-[#C99A2E] px-2.5 py-1.5 text-xs">📷</Link>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="hidden lg:flex justify-between items-center mb-6">
            <h1 className="font-display text-2xl font-bold tracking-tight">{active?.label?.toUpperCase() || 'OVERVIEW'}</h1>
            <Link to="/check-in" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-xs tracking-wider">
              📷 CHECK-IN TERMINAL
            </Link>
          </div>
          <ActiveComponent onNavigate={select} basePath={portalsBasePath} />
        </main>
      </div>
    </div>
  );
};

export const AdminPage = () => (
  <StaffAuthGate
    title="TANGY ADMIN PORTAL"
    subtitle="Archival & Operations Management Dashboard"
    allowedRoles={['admin', 'super_admin']}
  >
    <AdminDashboard />
  </StaffAuthGate>
);
