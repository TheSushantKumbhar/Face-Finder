/**
 * Face Finder — Auth Navigator
 * ─────────────────────────────
 * Stack navigator for the authentication flow:
 * Welcome → Login ↔ SignUp, and Google OAuth → RoleSelect.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  RoleSelect: {
    userId: string;
    username: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen
        name="RoleSelect"
        component={RoleSelectScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
