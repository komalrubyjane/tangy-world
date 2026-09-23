import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { PatronDashboard } from '../../pages/dashboards/PatronDashboard';

// The single, authoritative landing point for "/dashboard" — every login/
// signup flow (JoinLoginPage, JoinPage) sends a user here regardless of
// role, so this is what makes "authenticated vendor -> /vendor/dashboard,
// authenticated sponsor -> /sponsor/dashboard, ..." actually happen. The
// role read here is `user.role` from UserAuthContext, which is exactly
// `profiles.role` as loaded from Supabase — never a value carried over
// from an earlier role-selection screen or client-side state. A role this
// map doesn't know about (or a still-plain 'user') just gets the Patron
// dashboard, which is also where every account starts out.
const ROLE_DASHBOARD_PATH = {
  vendor: '/vendor/dashboard',
  sponsor: '/sponsor/dashboard',
  volunteer: '/volunteer/dashboard',
  crew: '/crew/dashboard',
  venue: '/venue/dashboard',
  artist: '/artist/dashboard',
  staff: '/admin',
  admin: '/admin',
  super_admin: '/admin',
};

export const DashboardRedirect = () => {
  const { user } = useUserAuth();
  const target = user?.role ? ROLE_DASHBOARD_PATH[user.role] : undefined;

  if (target) return <Navigate to={target} replace />;
  return <PatronDashboard />;
};
