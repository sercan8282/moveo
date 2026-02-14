import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moveo_token');
    const savedUser = localStorage.getItem('moveo_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token is still valid
        api.get('/auth/me').then(res => {
          setUser(res.data.user);
          localStorage.setItem('moveo_user', JSON.stringify(res.data.user));
        }).catch(() => {
          logout();
        }).finally(() => setLoading(false));
      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, mfaCode) => {
    const res = await api.post('/auth/login', { email, password, mfaCode });
    
    if (res.data.requireMfa) {
      return { requireMfa: true };
    }
    
    localStorage.setItem('moveo_token', res.data.token);
    localStorage.setItem('moveo_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('moveo_token');
    localStorage.removeItem('moveo_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('moveo_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
