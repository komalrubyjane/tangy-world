import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

// Real Supabase-Auth-backed route guard. Only checks isLoggedIn by default —
// the role-scoped dashboards it wraps (patron/vendor/crew/etc.) key off the
// applicant's OWN rows (bookings.user_id, collaborations.user_id, ...),
// authorized by RLS, not by profiles.role — selecting an account type at
// signup never grants a role (see prevent_role_self_escalation trigger).
// Pass `allowedRoles` only for surfaces that really are gated by
// profiles.role (staff/admin consoles use StaffAuthGate instead of this).
export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isLoggedIn, loading } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      navigate('/join/login');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, loading, user, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs font-bold">
        AUTHENTICATING...
      </div>
    );
  }

  if (!isLoggedIn || (allowedRoles && !allowedRoles.includes(user?.role))) return null;
  return children;
};
