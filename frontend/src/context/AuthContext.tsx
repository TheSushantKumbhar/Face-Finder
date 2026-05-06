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
  profilePhotoUrl: string | null;
  hasSelfies: boolean;
  selfieChecked: boolean;
  login: (username: string, role: string, email?: string) => void;
  logout: () => void;
  setHasSelfies: (val: boolean) => void;
  setSelfieChecked: (val: boolean) => void;
  setUsername: (val: string) => void;
  setProfilePhotoUrl: (val: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: '',
  email: '',
  role: null,
  profilePhotoUrl: null,
  hasSelfies: false,
  selfieChecked: false,
  login: () => {},
  logout: () => {},
  setHasSelfies: () => {},
  setSelfieChecked: () => {},
  setUsername: () => {},
  setProfilePhotoUrl: () => {},
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [hasSelfies, setHasSelfies] = useState(false);
  const [selfieChecked, setSelfieChecked] = useState(false);

  const login = useCallback((name: string, newRole: string, userEmail?: string) => {
    setUsername(name);
    setEmail(userEmail || '');
    setRole(newRole as UserRole);
    setIsAuthenticated(true);
    // Reset selfie state on fresh login — will be checked by navigator
    setHasSelfies(false);
    setSelfieChecked(false);
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setUsername('');
    setEmail('');
    setRole(null);
    setProfilePhotoUrl(null);
    setHasSelfies(false);
    setSelfieChecked(false);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      username,
      email,
      role,
      profilePhotoUrl,
      hasSelfies,
      selfieChecked,
      login,
      logout,
      setHasSelfies,
      setSelfieChecked,
      setUsername,
      setProfilePhotoUrl,
    }),
    [isAuthenticated, username, email, role, profilePhotoUrl, hasSelfies, selfieChecked, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
