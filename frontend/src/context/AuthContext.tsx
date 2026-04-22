/**
 * Face Finder — Auth Context
 * ──────────────────────────
 * Manages authentication state (logged in / out) and user info.
 * Wraps the entire app so any screen can read auth status or trigger logout.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { removeToken } from '../services/api';

type UserRole = 'user' | 'organizer' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  email: string;
  role: UserRole;
  login: (username: string, role: string, email?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: '',
  email: '',
  role: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(null);

  const login = useCallback((name: string, newRole: string, userEmail?: string) => {
    setUsername(name);
    setEmail(userEmail || '');
    setRole(newRole as UserRole);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setUsername('');
    setEmail('');
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      username,
      email,
      role,
      login,
      logout,
    }),
    [isAuthenticated, username, email, role, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

