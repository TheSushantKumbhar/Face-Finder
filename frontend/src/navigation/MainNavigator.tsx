/**
 * Face Finder — Main Navigator (Bottom Tabs)
 * ───────────────────────────────────────────
 * Premium dark bottom tab bar with rich gold accent for the active state.
 * Features a subtle glow pill behind active icons and clean typography.
 */

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../theme/colors';

import HomeScreen from '../screens/main/HomeScreen';
import SearchEventsScreen from '../screens/main/SearchEventsScreen';
import CreateEventScreen from '../screens/main/CreateEventScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

export type MainTabParamList = {
  Home: undefined;
  SearchEvents: undefined;
  CreateEvent: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/* ── Tiny gold dot beneath active label ─────────────────── */
const ActiveDot = () => <View style={styles.activeDot} />;

export default function MainNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: palette.gold,
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={21}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SearchEvents"
        component={SearchEventsScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={21}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'add-circle' : 'add-circle-outline'}
                size={25}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrap, focused && styles.activeIconWrap]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={21}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 92 : 78;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: palette.dark.surface,        // #141414 — near-black
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 168, 76, 0.08)',   // whisper of gold border
    height: TAB_BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    paddingTop: 8,
    // Elevated shadow
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    // Seamless positioning
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 2,
  },
  /* Default icon container */
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
    borderRadius: 10,
  },
  /* Active: subtle golden pill glow */
  activeIconWrap: {
    backgroundColor: palette.goldMuted,             // rgba gold tint
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.18)',        // fine gold stroke
    // Subtle golden shadow
    ...Platform.select({
      ios: {
        shadowColor: palette.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.gold,
    marginTop: 4,
  },
});
