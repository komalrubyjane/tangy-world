import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ArtistProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/artist/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191410] text-[#ecdcaf] flex items-center justify-center font-mono text-xs font-bold">
        [ AUTHENTICATING ARTIST SESSION... ]
      </div>
    );
  }

  return user ? children : null;
};
