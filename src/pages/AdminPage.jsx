import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StaffAuthGate } from '../admin/StaffAuthGate';
import { useUserAuth } from '../context/UserAuthContext';
import { OverviewSection } from '../admin/sections/OverviewSection';
import { BookingsSection } from '../admin/sections/BookingsSection';
import { EventsSection } from '../admin/sections/EventsSection';
import { ArtistsSection } from '../admin/sections/ArtistsSection';
import { CrewSection } from '../admin/sections/CrewSection';
import { CollaborationsSection } from '../admin/sections/CollaborationsSection';
import { ContactEnquiriesSection, PrivateEnquiriesSection } from '../admin/sections/EnquiriesSection';
import { WaitlistSection } from '../admin/sections/WaitlistSection';
import { UsersSection } from '../admin/sections/UsersSection';
import { InboxSection } from '../admin/sections/InboxSection';
import { AnnouncementsSection } from '../admin/sections/AnnouncementsSection';

const TABS = [
  { id: 'overview', label: '📊 OVERVIEW', component: OverviewSection },
  { id: 'bookings', label: '🎫 BOOKINGS', component: BookingsSection },
  { id: 'events', label: '🏛️ EVENTS', component: EventsSection },
  { id: 'artists', label: '🎷 ARTISTS', component: ArtistsSection },
  { id: 'crew', label: '🤝 CREW', component: CrewSection },
  { id: 'collab', label: '🤲 COLLAB', component: CollaborationsSection },
  { id: 'private', label: '✨ PRIVATE', component: PrivateEnquiriesSection },
  { id: 'contact', label: '✉️ CONTACT', component: ContactEnquiriesSection },
  { id: 'waitlist', label: '⏳ WAITLIST', component: WaitlistSection },
  { id: 'users', label: '👤 USERS', component: UsersSection },
  { id: 'inbox', label: '📥 INBOX', component: InboxSection },
  { id: 'announcements', label: '📣 ANNOUNCEMENTS', component: AnnouncementsSection },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useUserAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || OverviewSection;

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#191410] border-2 border-[#C99A2E] p-4 md:p-6 mb-8 rounded-sm shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B94717] animate-pulse" />
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#E7D5A4]">
              TANGY SESSIONS ADMIN
            </h1>
          </div>
          <p className="font-serif italic text-xs text-[#E7D5A4]/70 mt-0.5">
            {user?.role?.toUpperCase()} · {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/check-in"
            className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-xs tracking-wider"
          >
            📷 CHECK-IN TERMINAL
          </Link>
          <button
            onClick={() => navigate('/')}
            className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-xs tracking-wider"
          >
            ← VIEW WEBSITE
          </button>
          <button
            onClick={logout}
            className="bg-[#C2272A] text-white hover:bg-[#11100C] border border-[#C2272A] px-3 py-1.5 text-xs font-bold tracking-wider"
          >
            LOG OUT ✕
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-8 border-b-2 border-[#C99A2E]/40 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold tracking-wider uppercase border transition-colors ${
              activeTab === tab.id
                ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E] shadow-[3px_3px_0px_#11100C]'
                : 'bg-[#191410] text-[#E7D5A4]/80 border-[#C99A2E]/30 hover:border-[#C99A2E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ActiveComponent />
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
