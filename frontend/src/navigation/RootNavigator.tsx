/**
 * Face Finder — Root Navigator
 * ─────────────────────────────
 * Switches between Auth flow (Welcome → Login ↔ SignUp)
 * and Main app (bottom tabs) based on authentication state.
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import EventUploadScreen from '../screens/main/EventUploadScreen';
import EventGalleryScreen from '../screens/main/EventGalleryScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
  const { isAuthenticated } = useAuth();

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
      {isAuthenticated ? <AppStack /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
