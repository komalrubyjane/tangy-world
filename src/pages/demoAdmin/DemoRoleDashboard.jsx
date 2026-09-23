import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDemoAdmin } from '../../context/DemoAdminContext';
import { DemoModeBanner } from './DemoModeBanner';
import { DEMO_PROFILES } from './demoProfiles';
import { DEMO_DASHBOARD_DATA } from './demoAdminData';
import { PatronDashboard } from '../dashboards/PatronDashboard';
import { CrewDashboard } from '../dashboards/CrewDashboard';
import { VolunteerDashboard } from '../dashboards/VolunteerDashboard';
import { VendorDashboard } from '../dashboards/VendorDashboard';
import { SponsorDashboard } from '../dashboards/SponsorDashboard';
import { VenueDashboard } from '../dashboards/VenueDashboard';

// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
//
// One click from any login page's "TEAM DEMO" link lands here directly —
// no detour through an admin entry screen. This auto-enters demo mode on
// mount (still gated by DEMO_ADMIN_ENABLED; still just an in-memory flag,
// still zero Supabase calls to get here) and renders the REAL dashboard
// component for the requested role with a synthetic demo profile
// (demoProfiles.js) + readOnly — the exact same reuse pattern as the real
// admin preview (AdminPortalPreview.jsx), just entered from a different
// door and without needing a real database row to point at.
const DASHBOARD_BY_ROLE = {
  patron: PatronDashboard,
  crew: CrewDashboard,
  volunteer: VolunteerDashboard,
  vendor: VendorDashboard,
  sponsor: SponsorDashboard,
  venue: VenueDashboard,
};

export const DemoRoleDashboard = () => {
  const { role } = useParams();
  const { enterDemo, isDemoAdmin, demoAdminEnabled } = useDemoAdmin();

  useEffect(() => {
    if (demoAdminEnabled) enterDemo();
  }, [demoAdminEnabled, enterDemo]);

  if (!demoAdminEnabled) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <span>Demo mode is not enabled in this build.</span>
        <Link to="/" className="underline text-[#C99A2E]">← Back to site</Link>
      </div>
    );
  }

  const Component = DASHBOARD_BY_ROLE[role];
  const profile = DEMO_PROFILES[role];

  if (!Component || !profile) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <span>No demo dashboard for "{role}".</span>
        <Link to="/" className="underline text-[#C99A2E]">← Back to site</Link>
      </div>
    );
  }

  if (!isDemoAdmin) {
    // One-render flash while the effect above flips the flag — not a
    // permission check (that already happened: demoAdminEnabled is true).
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">ENTERING DEMO MODE...</div>;
  }

  return (
    <>
      <DemoModeBanner />
      <Component overrideProfile={profile} readOnly demoData={DEMO_DASHBOARD_DATA[role]} />
    </>
  );
};
