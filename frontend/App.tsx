/**
 * Face Finder — App Entry
 * ────────────────────────
 * Wraps the app in AuthProvider + ThemeProvider and renders the root navigator.
 */

import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
