import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useMockAuth } from '../../context/MockAuthContext';

export const MockProtectedRoute = ({ role, children }) => {
  const { user, loading, DASHBOARD_BY_ROLE } = useMockAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/join/login'); return; }
    if (role && user.role !== role) {
      navigate(DASHBOARD_BY_ROLE[user.role] || '/join');
    }
  }, [user, loading, role, navigate, DASHBOARD_BY_ROLE]);

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
