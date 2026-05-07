/**
 * Face Finder — Premium Home Screen
 * ───────────────────────────────────
 * Ultra-premium monochrome cinematic homepage.
 * Black & white only — no color. Futuristic, elegant, minimal.
 *
 * Uses built-in RN Animated API (no Reanimated dependency).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { mono } from './home/constants';

import HeroSection from './home/HeroSection';
import StatsSection from './home/StatsSection';
import TimelineSection from './home/TimelineSection';
import FeaturesSection from './home/FeaturesSection';

export default function HomeScreen() {
  const { username } = useAuth();
  const insets = useSafeAreaInsets();

  /* ── Header entrance ───────────────────── */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;

  /* ── Footer entrance ───────────────────── */
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.timing(footerOpacity, {
      toValue: 1,
      duration: 800,
      delay: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* ── Ambient bg gradient ──────────────── */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.03)',
          'transparent',
          'rgba(255,255,255,0.015)',
          'transparent',
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* ── Header Bar ────────────────────────── */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerSlide }] },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(username || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.brandText}>Face Finder</Text>
            <Text style={styles.brandSub}>Premium</Text>
          </View>
        </View>

        <Pressable style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={18} color={mono.textSecondary} />
          <View style={styles.notifDot} />
        </Pressable>
      </Animated.View>

      {/* ── Scrollable Content ────────────────── */}
      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroSection username={username} />
        <StatsSection />
        <TimelineSection />
        <FeaturesSection />

        {/* ── Footer branding ────────────────── */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <View style={styles.footerDivider} />
          <Ionicons name="diamond-outline" size={16} color={mono.textDim} />
          <Text style={styles.footerText}>Face Finder</Text>
          <Text style={styles.footerSub}>Crafted with precision</Text>
        </Animated.View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mono.bg,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: mono.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: mono.black,
  },
  headerTextCol: {
    gap: 1,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '700',
    color: mono.textPrimary,
    letterSpacing: -0.4,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '500',
    color: mono.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mono.border,
    backgroundColor: mono.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: mono.accent,
  },

  /* ── Footer ── */
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  footerDivider: {
    width: 40,
    height: 1,
    backgroundColor: mono.border,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: mono.textDim,
    letterSpacing: 1,
  },
  footerSub: {
    fontSize: 11,
    color: mono.textDim,
    letterSpacing: 0.5,
    opacity: 0.6,
  },
});
