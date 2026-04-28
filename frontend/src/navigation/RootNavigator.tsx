/**
 * Face Finder — Root Navigator
 * ─────────────────────────────
 * Switches between Auth flow (Welcome → Login ↔ SignUp)
 * and Main app (bottom tabs) based on authentication state.
 * Shows selfie upload overlay after login when selfies are missing.
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import EventUploadScreen from '../screens/main/EventUploadScreen';
import EventGalleryScreen from '../screens/main/EventGalleryScreen';
import SelfieUploadScreen from '../screens/main/SelfieUploadScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { checkSelfieStatusApi } from '../services/api';

export type AppStackParamList = {
  MainTabs: undefined;
  EventUpload: { eventId: string; eventName: string };
  EventGallery: { eventId: string; eventName: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainNavigator} />
      <Stack.Screen 
        name="EventUpload" 
        component={EventUploadScreen} 
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen 
        name="EventGallery" 
        component={EventGalleryScreen} 
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, hasSelfies, selfieChecked, setHasSelfies, setSelfieChecked } = useAuth();
  const [showSelfieOverlay, setShowSelfieOverlay] = useState(false);

  // Check selfie status after login
  useEffect(() => {
    if (isAuthenticated && !selfieChecked) {
      console.log('[RootNavigator] Checking selfie status...');
      checkSelfieStatusApi()
        .then(res => {
          console.log('[RootNavigator] Selfie status response:', JSON.stringify(res));
          setHasSelfies(res.has_selfies);
          setSelfieChecked(true);
          if (!res.has_selfies) {
            console.log('[RootNavigator] No selfies found — showing overlay');
            setShowSelfieOverlay(true);
          }
        })
        .catch((err) => {
          // Log the error so we can debug
          console.error('[RootNavigator] Selfie check failed:', err.message || err);
          setSelfieChecked(true);
        });
    }
  }, [isAuthenticated, selfieChecked]);

  // Customize React Navigation's theme to match our app theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? (
        <>
          <AppStack />
          {showSelfieOverlay && (
            <SelfieUploadScreen
              onComplete={() => setShowSelfieOverlay(false)}
              onSkip={() => {
                setSelfieChecked(true);
                setShowSelfieOverlay(false);
              }}
            />
          )}
        </>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
