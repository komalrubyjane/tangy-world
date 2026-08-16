import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useMockAuth } from '../../context/MockAuthContext';

// Gates a role-specific dashboard behind the mock auth session. If a
// `role` prop is given, also requires the signed-in mock account to match
// that role (prevents e.g. a vendor account from opening /crew/dashboard).
export const MockProtectedRoute = ({ role, children }) => {
  const { user, loading } = useMockAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/join/login'); return; }
    if (role && user.role !== role) { navigate('/join'); }
  }, [user, loading, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] flex items-center justify-center font-mono text-xs">
        LOADING...
      </div>
    );
  }
  if (!user || (role && user.role !== role)) return null;
  return children;
};
