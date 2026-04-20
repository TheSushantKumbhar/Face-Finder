/**
 * Face Finder — Search Events Screen
 * ────────────────────────────────────
 * Placeholder for event search. Dark themed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/colors';

export default function SearchEventsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Events</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.emptyIcon}>
          <Ionicons name="search-outline" size={48} color={palette.accent} />
        </View>
        <Text style={styles.emptyTitle}>Discover Events</Text>
        <Text style={styles.emptySubtitle}>
          Search and explore events near you
        </Text>
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(242, 192, 148, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
});
