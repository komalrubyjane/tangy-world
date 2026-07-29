import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const res = await authService.loginDirect(email, password);
    if (res.success) {
      setUser(res.user);
    }
    setLoading(false);
    return res.success;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(u => {
      const updated = { ...u, ...updates };
      localStorage.setItem('tangy_mock_session', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
