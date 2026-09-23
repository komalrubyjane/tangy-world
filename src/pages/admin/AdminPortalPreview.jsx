import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { StaffAuthGate } from '../../admin/StaffAuthGate';
import { supabase } from '../../lib/supabaseClient';
import { PatronDashboard } from '../dashboards/PatronDashboard';
import { CrewDashboard } from '../dashboards/CrewDashboard';
import { VolunteerDashboard } from '../dashboards/VolunteerDashboard';
import { VendorDashboard } from '../dashboards/VendorDashboard';
import { SponsorDashboard } from '../dashboards/SponsorDashboard';
import { VenueDashboard } from '../dashboards/VenueDashboard';

// Reuses the REAL dashboard components from Phase 3 — never a separate copy.
// The admin's own authenticated session (auth.uid() stays the admin's own,
// profiles.role never changes) reads the target's profiles row directly;
// existing "profiles: admin read all" RLS (0002_rls.sql) already permits
// this. Each dashboard is told to use this profile instead of the caller's
// own and to disable every write action (readOnly) — see the shared note in
// CrewDashboard.jsx.
const DASHBOARD_BY_ROLE = {
  patron: PatronDashboard,
  crew: CrewDashboard,
  volunteer: VolunteerDashboard,
  vendor: VendorDashboard,
  sponsor: SponsorDashboard,
  venue: VenueDashboard,
};

// Exported for reuse under a different auth gate if ever needed. Never
// render without an auth gate wrapping it (AdminPortalPreview below). The
// demo-admin build reuses the individual dashboard components directly
// with a synthetic profile instead of this id-based lookup — see
// src/pages/demoAdmin/DemoRoleDashboard.jsx for why.
export const AdminPortalPreviewInner = () => {
  const { role, id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        setProfile(data || null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const Component = DASHBOARD_BY_ROLE[role];

  if (!Component) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">
        Unknown portal type. <Link to="/admin" className="underline ml-2">Back to Control Room</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">LOADING...</div>;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex flex-col items-center justify-center gap-3 font-mono text-xs">
        <span>{error || 'Account not found.'}</span>
        <Link to={`/admin/preview/${role}`} className="underline text-[#C99A2E]">← Choose a different account</Link>
      </div>
    );
  }

  return <Component overrideProfile={profile} readOnly />;
};

export const AdminPortalPreview = () => (
  <StaffAuthGate title="ADMIN PREVIEW" subtitle="Inspecting a real portal" allowedRoles={['admin', 'super_admin']}>
    <AdminPortalPreviewInner />
  </StaffAuthGate>
);
