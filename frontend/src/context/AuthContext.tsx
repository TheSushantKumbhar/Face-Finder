/**
 * Face Finder — Auth Context
 * ──────────────────────────
 * Manages authentication state (logged in / out) and user info.
 * Wraps the entire app so any screen can read auth status or trigger logout.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { removeToken } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: '',
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

  const login = useCallback((name: string) => {
    setUsername(name);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setUsername('');
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      username,
      login,
      logout,
    }),
    [isAuthenticated, username, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
