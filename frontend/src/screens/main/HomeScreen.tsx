/**
 * Face Finder — Home Screen
 * ──────────────────────────
 * Minimal dark startup aesthetic — black & white only.
 * Self-contained palette so other screens stay unchanged.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

/* ── local B&W palette (only for this screen) ────────────── */
const bw = {
  black: '#000000',
  surface: '#0A0A0A',
  card: '#111111',
  cardHover: '#161616',
  border: '#1E1E1E',
  borderLight: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#5C5C5C',
  accent: '#FFFFFF',        // white as the "accent" in a B&W world
  accentMuted: '#888888',
  dot: '#333333',
};

const { width: SCREEN_W } = Dimensions.get('window');

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const { username } = useAuth();
  const greeting = getGreeting();

  /* ── entrance animations ─────────────────── */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(heroScale, { toValue: 1, friction: 8, useNativeDriver: true }),
        Animated.timing(heroOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(statsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  /* ── Quick-action data ─────────────────── */
  const actions = [
    { icon: 'scan-outline' as const, title: 'Scan Face', sub: 'Identify in seconds' },
    { icon: 'calendar-outline' as const, title: 'My Events', sub: 'Browse your events' },
    { icon: 'cloud-upload-outline' as const, title: 'Upload', sub: 'Add new photos' },
    { icon: 'analytics-outline' as const, title: 'Insights', sub: 'Recognition stats' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────── */}
        <Animated.View
          style={[
            styles.header,
            { opacity: headerOpacity, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(username || 'U')[0].toUpperCase()}
              </Text>
            </View>

            <View style={styles.greetingText}>
              <Text style={styles.greetingLabel}>{greeting}</Text>
              <Text style={styles.usernameText}>{username || 'User'}</Text>
            </View>

            <TouchableOpacity style={styles.notifBtn} activeOpacity={0.6}>
              <Ionicons name="notifications-outline" size={20} color={bw.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Hero Card ───────────────────────── */}
        <Animated.View
          style={[
            styles.heroCard,
            { opacity: heroOpacity, transform: [{ scale: heroScale }] },
          ]}
        >
          <View style={styles.heroInner}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="scan" size={32} color={bw.accent} />
            </View>
            <Text style={styles.heroTitle}>Face Finder</Text>
            <Text style={styles.heroSub}>
              AI-powered facial recognition{'\n'}for your events & photos
            </Text>
            <TouchableOpacity style={styles.heroCta} activeOpacity={0.8}>
              <Text style={styles.heroCtaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={16} color={bw.black} />
            </TouchableOpacity>
          </View>

          {/* decorative dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === 0 && { backgroundColor: bw.accent }]}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Stats Row ───────────────────────── */}
        <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
          {[
            { label: 'Events', value: '0' },
            { label: 'Photos', value: '0' },
            { label: 'Matches', value: '0' },
          ].map((stat, i) => (
            <View
              key={i}
              style={[
                styles.statCard,
                i < 2 && { borderRightWidth: 1, borderRightColor: bw.border },
              ]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Quick Actions ───────────────────── */}
        <Animated.View
          style={[
            styles.actionsSection,
            { opacity: cardsOpacity, transform: [{ translateY: cardsSlide }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionCard}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconWrap}>
                  <Ionicons name={action.icon} size={22} color={bw.accent} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSub}>{action.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Recent Activity (empty state) ──── */}
        <Animated.View style={[styles.recentSection, { opacity: cardsOpacity }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyActivity}>
            <Ionicons name="time-outline" size={28} color={bw.textMuted} />
            <Text style={styles.emptyText}>No recent activity yet</Text>
          </View>
        </Animated.View>

        {/* bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bw.black,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  /* ── Header ── */
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: bw.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: bw.black,
  },
  greetingText: {
    flex: 1,
    marginLeft: 14,
  },
  greetingLabel: {
    fontSize: 13,
    color: bw.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    color: bw.textPrimary,
    letterSpacing: -0.4,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: bw.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Hero Card ── */
  heroCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: bw.card,
    borderWidth: 1,
    borderColor: bw.border,
    overflow: 'hidden',
  },
  heroInner: {
    padding: 28,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: bw.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: bw.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 100,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: bw.dot,
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: bw.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: bw.border,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: bw.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* ── Actions ── */
  actionsSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: bw.textSecondary,
    letterSpacing: -0.2,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (SCREEN_W - 52) / 2,
    backgroundColor: bw.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: bw.border,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: bw.textPrimary,
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
    color: bw.textMuted,
    lineHeight: 16,
  },

  /* ── Recent activity ── */
  recentSection: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  emptyActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: bw.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: bw.border,
  },
  emptyText: {
    fontSize: 14,
    color: bw.textMuted,
  },
});
