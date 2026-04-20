/**
 * Face Finder — Profile Screen
 * ─────────────────────────────
 * Placeholder for user profile. Dark themed with logout.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { palette } from '../../theme/colors';

export default function ProfileScreen() {
  const { username, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={40} color={palette.accent} />
        </View>
        <Text style={styles.usernameText}>{username || 'User'}</Text>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={palette.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primary,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: palette.primaryDark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.white,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(242, 192, 148, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(242, 192, 148, 0.2)',
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 40,
    letterSpacing: -0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(231, 76, 76, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 76, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.error,
  },
});
