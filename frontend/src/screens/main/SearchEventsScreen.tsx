/**
 * Face Finder — Discover Events Screen
 * ──────────────────────────────────────
 * Premium matte-black search with Gemini-style animated border,
 * skeleton shimmer loading, and cinematic event cards.
 *
 * Uses built-in RN Animated API only (no Reanimated).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TextInput,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { discoverEventsApi, DiscoverEventResponse } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { mono } from './home/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - 40;

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Skeleton Shimmer Card ───────────────────────────────── */
function SkeletonCard({ delay }: { delay: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, delay, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });
  return (
    <View style={styles.skeletonCard}>
      <Animated.View style={[styles.skeletonBanner, { opacity }]} />
      <View style={styles.skeletonBody}>
        <Animated.View style={[styles.skeletonLine, { width: '65%', opacity }]} />
        <Animated.View style={[styles.skeletonLine, { width: '45%', marginTop: 10, opacity }]} />
        <Animated.View style={[styles.skeletonLine, { width: '30%', marginTop: 10, opacity }]} />
      </View>
    </View>
  );
}

/* ── Gemini-style Animated Search Border ─────────────────── */
function GeminiSearchBar({
  value,
  onChangeText,
  isSearching,
}: {
  value: string;
  onChangeText: (t: string) => void;
  isSearching: boolean;
}) {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.timing(borderAnim, { toValue: 1, duration: 2400, useNativeDriver: false }),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ]),
      ).start();
    } else {
      borderAnim.stopAnimation();
      glowAnim.stopAnimation();
      borderAnim.setValue(0);
      glowAnim.setValue(0);
    }
  }, [isSearching]);

  // Animated border colors cycling through white shades
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      'rgba(255,255,255,0.12)',
      'rgba(255,255,255,0.35)',
      'rgba(255,255,255,0.12)',
      'rgba(255,255,255,0.35)',
      'rgba(255,255,255,0.12)',
    ],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <Animated.View
      style={[
        styles.searchContainer,
        {
          borderColor: isSearching ? borderColor : focused ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          ...(Platform.OS === 'ios' && {
            shadowColor: '#FFFFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isSearching ? shadowOpacity : 0,
            shadowRadius: 12,
          }),
        },
      ]}
    >
      {/* Animated glow pills on left and right */}
      {isSearching && (
        <>
          <Animated.View style={[styles.glowPill, styles.glowLeft, { opacity: glowAnim }]} />
          <Animated.View
            style={[
              styles.glowPill,
              styles.glowRight,
              {
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          />
        </>
      )}

      <Ionicons name="search" size={18} color={focused ? '#FFFFFF' : mono.textMuted} style={{ marginRight: 10 }} />
      <TextInput
        ref={inputRef}
        style={styles.searchInput}
        placeholder="Search events..."
        placeholderTextColor={mono.textDim}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        selectionColor="rgba(255,255,255,0.5)"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <View style={styles.clearBtn}>
            <Ionicons name="close" size={14} color={mono.textSecondary} />
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
}

/* ── Event Card ──────────────────────────────────────────── */
function EventCard({
  event,
  index,
}: {
  event: DiscoverEventResponse;
  index: number;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  // Generate a deterministic hue from event name for the subtle gradient accent
  const hue = event.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const accentColor = `hsla(${hue}, 30%, 50%, 0.15)`;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={() => navigation.navigate('EventDetails', { event })} style={styles.cardPressable}>
        {/* Banner area */}
        <View style={styles.cardBanner}>
          <LinearGradient
            colors={[accentColor, 'rgba(255,255,255,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Event initial large icon */}
          <View style={styles.bannerIconWrap}>
            <Text style={[styles.bannerInitial, { color: `hsla(${hue}, 40%, 70%, 0.6)` }]}>
              {event.name[0]?.toUpperCase() || 'E'}
            </Text>
          </View>
          {/* Time badge */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{timeAgo(event.created_at)}</Text>
          </View>
          {/* Photo count badge */}
          <View style={styles.photoBadge}>
            <Ionicons name="images-outline" size={11} color={mono.textSecondary} />
            <Text style={styles.photoBadgeText}>{event.photo_count}</Text>
          </View>
          {/* Bottom gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)', '#0E0E0E']}
            locations={[0, 0.6, 1]}
            style={styles.bannerGradient}
          />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.name}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={13} color={mono.textMuted} />
              <Text style={styles.metaText}>{event.organiser_name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={mono.textMuted} />
              <Text style={styles.metaText}>{formatDate(event.created_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={mono.textMuted} />
              <Text style={styles.metaText}>{formatTime(event.created_at)}</Text>
            </View>
          </View>

          {event.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{event.description}</Text>
          ) : null}

          <View style={styles.cardFooter}>
            <View style={styles.viewBtn}>
              <Text style={styles.viewBtnText}>View Event</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ── Empty State ─────────────────────────────────────────── */
function EmptyState({ isSearch }: { isSearch: boolean }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={isSearch ? 'search-outline' : 'calendar-outline'} size={40} color={mono.textDim} />
      </View>
      <Text style={styles.emptyTitle}>
        {isSearch ? 'No events found' : 'No events yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSearch ? 'Try a different search term' : 'Events will appear here once created'}
      </Text>
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                              */
/* ══════════════════════════════════════════════════════════ */
export default function SearchEventsScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<DiscoverEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Header entrance
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    fetchEvents();
  }, []);

  const fetchEvents = useCallback(async (q?: string) => {
    try {
      const data = await discoverEventsApi(q);
      setEvents(data);
    } catch (e) {
      console.error('[Discover] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearching(false);
    }
  }, []);

  const onSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length > 0) {
      setSearching(true);
      searchTimeout.current = setTimeout(() => fetchEvents(text.trim()), 500);
    } else {
      setSearching(false);
      fetchEvents();
    }
  }, [fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(query.trim() || undefined);
  }, [query, fetchEvents]);

  const renderItem = useCallback(
    ({ item, index }: { item: DiscoverEventResponse; index: number }) => (
      <EventCard event={item} index={index} />
    ),
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Ambient gradient */}
      <LinearGradient
        colors={['rgba(255,255,255,0.02)', 'transparent', 'rgba(255,255,255,0.01)', 'transparent']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        <View>
          <Text style={styles.headerLabel}>DISCOVER</Text>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.eventCountBadge}>
            <Text style={styles.eventCountText}>{events.length}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <GeminiSearchBar value={query} onChangeText={onSearch} isSearching={searching} />
      </View>

      {/* Section label */}
      {!loading && events.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {query.trim() ? 'RESULTS' : 'RECENT EVENTS'}
          </Text>
          <View style={styles.sectionLine} />
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.skeletonList}>
          <SkeletonCard delay={0} />
          <SkeletonCard delay={200} />
          <SkeletonCard delay={400} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState isSearch={query.trim().length > 0} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={mono.textMuted}
              colors={['#FFFFFF']}
              progressBackgroundColor={mono.card}
            />
          }
        />
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mono.bg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: mono.textDim,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  eventCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: mono.border,
    backgroundColor: mono.card,
  },
  eventCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: mono.textSecondary,
    letterSpacing: 0.5,
  },

  /* Search */
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mono.card,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 6,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: -0.2,
    padding: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: mono.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Gemini glow pills */
  glowPill: {
    position: 'absolute',
    width: 60,
    height: '100%',
    borderRadius: 16,
  },
  glowLeft: {
    left: -10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  glowRight: {
    right: -10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: mono.textDim,
    letterSpacing: 1.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: mono.border,
  },

  /* List */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 4,
  },

  /* Skeleton */
  skeletonList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  skeletonCard: {
    borderRadius: 20,
    backgroundColor: mono.card,
    borderWidth: 1,
    borderColor: mono.border,
    overflow: 'hidden',
  },
  skeletonBanner: {
    height: 140,
    backgroundColor: '#FFFFFF',
  },
  skeletonBody: {
    padding: 20,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },

  /* Event Card */
  cardOuter: {
    marginBottom: 16,
  },
  cardPressable: {
    borderRadius: 20,
    backgroundColor: mono.card,
    borderWidth: 1,
    borderColor: mono.border,
    overflow: 'hidden',
  },
  cardBanner: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bannerIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInitial: {
    fontSize: 32,
    fontWeight: '800',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: mono.textSecondary,
    letterSpacing: 0.3,
  },
  photoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  photoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: mono.textSecondary,
  },

  /* Card content */
  cardContent: {
    padding: 20,
    paddingTop: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: mono.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: mono.textDim,
    lineHeight: 19,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: mono.border,
    paddingTop: 14,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: mono.card,
    borderWidth: 1,
    borderColor: mono.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: mono.textDim,
    textAlign: 'center',
    lineHeight: 19,
  },
});
