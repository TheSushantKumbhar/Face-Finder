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
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { discoverEventsApi, DiscoverEventResponse, verifyEventPasswordApi } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { mono } from './home/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - 40;

/* ── Helpers ─────────────────────────────────────────────── */
/** Backend sends naive UTC datetimes without 'Z'. Append it so JS parses as UTC. */
function parseUTC(iso: string): Date {
  if (iso && !iso.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    return new Date(iso + 'Z');
  }
  return new Date(iso);
}
function formatDate(iso: string): string {
  const d = parseUTC(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(iso: string): string {
  const d = parseUTC(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function timeAgo(iso: string): string {
  const diff = Date.now() - parseUTC(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
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

/* ── Password Modal ─────────────────────────────────────── */
function PasswordModal({
  visible,
  eventName,
  onCancel,
  onSuccess,
  eventId,
}: {
  visible: boolean;
  eventName: string;
  onCancel: () => void;
  onSuccess: () => void;
  eventId: string;
}) {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPwd('');
      setError('');
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleVerify = async () => {
    if (!pwd.trim()) { setError('Please enter a password.'); return; }
    setLoading(true);
    setError('');
    try {
      await verifyEventPasswordApi(eventId, pwd.trim());
      setLoading(false);
      onSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Incorrect password.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={pwStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
        <Animated.View style={[pwStyles.sheet, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Lock icon */}
          <View style={pwStyles.lockWrap}>
            <Ionicons name="lock-closed" size={22} color="#FFF" />
          </View>
          <Text style={pwStyles.title}>Protected Event</Text>
          <Text style={pwStyles.subtitle} numberOfLines={2}>{eventName}</Text>
          <View style={pwStyles.divider} />
          <Text style={pwStyles.label}>ENTER PASSWORD</Text>
          <View style={[pwStyles.inputWrap, error ? pwStyles.inputError : null]}>
            <Ionicons name="key-outline" size={16} color={error ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,255,0.3)'} style={{ marginRight: 10 }} />
            <TextInput
              style={pwStyles.input}
              placeholder="Event password"
              placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry
              value={pwd}
              onChangeText={t => { setPwd(t); setError(''); }}
              onSubmitEditing={handleVerify}
              returnKeyType="done"
              autoFocus
              selectionColor="rgba(255,255,255,0.4)"
            />
          </View>
          {error ? <Text style={pwStyles.errorText}>{error}</Text> : null}
          <View style={pwStyles.btnRow}>
            <Pressable style={pwStyles.cancelBtn} onPress={onCancel}>
              <Text style={pwStyles.cancelTxt}>Cancel</Text>
            </Pressable>
            <Pressable style={pwStyles.confirmBtn} onPress={handleVerify} disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#000" />
                : <><Text style={pwStyles.confirmTxt}>Continue</Text><Ionicons name="arrow-forward" size={14} color="#000" style={{ marginLeft: 6 }} /></>}
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const handleViewEvent = () => {
    if (event.is_password_protected) {
      setShowModal(true);
    } else {
      navigation.navigate('EventDetails', { event });
    }
  };

  const hue = event.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const accentColor = `hsla(${hue}, 30%, 50%, 0.15)`;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <PasswordModal
        visible={showModal}
        eventName={event.name}
        eventId={event.id}
        onCancel={() => setShowModal(false)}
        onSuccess={() => { setShowModal(false); navigation.navigate('EventDetails', { event }); }}
      />
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handleViewEvent} style={styles.cardPressable}>
        {/* Banner area */}
        <View style={styles.cardBanner}>
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <>
              <LinearGradient
                colors={[accentColor, 'rgba(255,255,255,0.03)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.bannerIconWrap}>
                <Text style={[styles.bannerInitial, { color: `hsla(${hue}, 40%, 70%, 0.6)` }]}>
                  {event.name[0]?.toUpperCase() || 'E'}
                </Text>
              </View>
            </>
          )}
          {/* Lock badge for protected events */}
          {event.is_password_protected && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{timeAgo(event.created_at)}</Text>
          </View>
          <View style={styles.photoBadge}>
            <Ionicons name="images-outline" size={11} color={mono.textSecondary} />
            <Text style={styles.photoBadgeText}>{event.photo_count}</Text>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)', '#0E0E0E']}
            locations={[0, 0.6, 1]}
            style={styles.bannerGradient}
          />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>{event.name}</Text>
            {event.is_password_protected && (
              <View style={styles.protectedBadge}>
                <Ionicons name="lock-closed" size={9} color="rgba(255,255,255,0.5)" />
                <Text style={styles.protectedBadgeText}>PRIVATE</Text>
              </View>
            )}
          </View>

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
              {event.is_password_protected
                ? <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.7)" />
                : null}
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

  /* Lock badge on banner */
  lockBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Title row */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },

  /* PRIVATE badge next to title */
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 3,
  },
  protectedBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
});

/* ── Password Modal Styles ───────────────────────────────── */
const pwStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  lockWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    marginBottom: 8,
  },
  inputError: {
    borderColor: 'rgba(255,80,80,0.4)',
    backgroundColor: 'rgba(255,50,50,0.04)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    padding: 0,
    letterSpacing: -0.2,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255,100,100,0.85)',
    marginBottom: 12,
    letterSpacing: 0.1,
    paddingLeft: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  confirmTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
});

