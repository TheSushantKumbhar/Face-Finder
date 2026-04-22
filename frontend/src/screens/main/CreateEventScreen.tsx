/**
 * Face Finder — Create Event Screen (Premium B&W Redesign)
 * ─────────────────────────────────────────────────────────
 * • Premium black & white theme
 * • Illustration from provided PNG asset
 * • Created events shown as cards below the form
 * • Search bar to filter events
 * • Creator email + username shown on each card
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  ScrollView,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { createEventApi, getEventsApi, EventResponse } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../../navigation/MainNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'CreateEvent'> & NativeStackNavigationProp<AppStackParamList>;

/* ── Palette ─────────────────────────────────────────────── */
const C = {
  bg: '#000000',
  surface: '#0C0C0C',
  card: '#111111',
  cardBorder: '#1F1F1F',
  inputBg: '#0E0E0E',
  inputBorder: '#1C1C1C',
  inputFocus: '#3A3A3A',
  white: '#FFFFFF',
  offWhite: '#E8E8E8',
  gray1: '#AAAAAA',
  gray2: '#666666',
  gray3: '#333333',
  gray4: '#222222',
  accent: '#FFFFFF',
  pill: 'rgba(255,255,255,0.06)',
  pillBorder: 'rgba(255,255,255,0.1)',
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════
   ROOT SCREEN
═══════════════════════════════════════════════════════════ */
export default function CreateEventScreen() {
  const { role } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const isOrganizer = role === 'organizer';

  if (!isOrganizer) {
    return <AccessDeniedView onGoHome={() => navigation.navigate('Home')} />;
  }
  return <OrganizerView />;
}

/* ═══════════════════════════════════════════════════════════
   ORGANIZER VIEW
═══════════════════════════════════════════════════════════ */
function OrganizerView() {
  const { username, email } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  /* form state */
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  /* events list state */
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  /* animations */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
    fetchEvents();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEventsApi();
      setEvents(data);
    } catch (_) { }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const handleCreate = async () => {
    if (!eventName.trim()) {
      Alert.alert('Missing Field', 'Please enter an event name.');
      return;
    }
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      const newEvent = await createEventApi({
        name: eventName.trim(),
        description: description.trim() || undefined,
      });
      setEvents((prev) => [newEvent, ...prev]);
      setEventName('');
      setDescription('');
      Alert.alert('🎉 Event Created', `"${newEvent.name}" is live!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.white}
            colors={[C.white]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── HERO HEADER ───────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.heroTextBlock}>
              <View style={styles.badgePill}>
                <Ionicons name="sparkles" size={11} color={C.white} />
                <Text style={styles.badgeText}>ORGANIZER STUDIO</Text>
              </View>
              <Text style={styles.heroTitle}>Create{'\n'}Your Event</Text>
              <Text style={styles.heroSubtitle}>
                Build memorable experiences for your audience.
              </Text>
            </View>
            <Image
              source={require('../../../assets/welcome-illustration.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* ── DIVIDER ───────────────────────────────── */}
          <View style={styles.divider} />

          {/* ── FORM CARD ─────────────────────────────── */}
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <View style={styles.formIconWrap}>
                <Ionicons name="add-circle" size={20} color={C.white} />
              </View>
              <Text style={styles.formCardTitle}>New Event</Text>
            </View>

            {/* Event Name */}
            <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
              <Ionicons
                name="calendar-outline"
                size={17}
                color={nameFocused ? C.offWhite : C.gray2}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Event Name *"
                placeholderTextColor={C.gray3}
                value={eventName}
                onChangeText={setEventName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                maxLength={60}
              />
            </View>

            {/* Description */}
            <View style={[styles.textAreaWrap, descFocused && styles.inputWrapFocused]}>
              <TextInput
                style={styles.textArea}
                placeholder="Description (optional)…"
                placeholderTextColor={C.gray3}
                value={description}
                onChangeText={setDescription}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={250}
              />
            </View>

            {/* Submit */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreate}
                activeOpacity={0.82}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={C.bg} />
                ) : (
                  <View style={styles.submitInner}>
                    <Text style={styles.submitText}>Create Event</Text>
                    <View style={styles.submitArrow}>
                      <Ionicons name="arrow-forward" size={16} color={C.bg} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── MY EVENTS SECTION ─────────────────────── */}
          {events.length > 0 && (
            <View style={styles.eventsSection}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Events</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{events.length}</Text>
                </View>
              </View>

              {/* Search bar */}
              <View style={[styles.searchWrap, searchFocused && styles.inputWrapFocused]}>
                <Ionicons
                  name="search"
                  size={16}
                  color={searchFocused ? C.offWhite : C.gray2}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search events…"
                  placeholderTextColor={C.gray3}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={16} color={C.gray2} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Event cards */}
              {filtered.length === 0 ? (
                <View style={styles.emptySearch}>
                  <Ionicons name="search-outline" size={32} color={C.gray3} />
                  <Text style={styles.emptySearchText}>No events match "{searchQuery}"</Text>
                </View>
              ) : (
                filtered.map((item, index) => (
                  <EventCard
                    key={item.id}
                    event={item}
                    username={username}
                    email={email}
                    index={index}
                    onPress={() => navigation.navigate('EventUpload', { eventId: item.id, eventName: item.name })}
                  />
                ))
              )}
            </View>
          )}

          {/* empty state */}
          {events.length === 0 && (
            <View style={styles.noEventsWrap}>
              <View style={styles.noEventsIconWrap}>
                <Ionicons name="calendar-outline" size={28} color={C.gray2} />
              </View>
              <Text style={styles.noEventsText}>No events yet.</Text>
              <Text style={styles.noEventsSubtext}>Create your first event above!</Text>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVENT CARD
═══════════════════════════════════════════════════════════ */
interface EventCardProps {
  event: EventResponse;
  username: string;
  email: string;
  index: number;
  onPress: () => void;
}

function EventCard({ event, username, email, index, onPress }: EventCardProps) {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const initials = getInitials(username || 'U');

  return (
    <Animated.View
      style={[
        styles.eventCard,
        {
          opacity: cardAnim,
          transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardEventDot} />
        <Text style={styles.cardDate}>{formatDate(event.created_at)}</Text>
      </View>

      {/* Event name */}
      <Text style={styles.cardName} numberOfLines={2}>{event.name}</Text>

      {/* Description */}
      {event.description ? (
        <Text style={styles.cardDesc} numberOfLines={3}>{event.description}</Text>
      ) : (
        <Text style={styles.cardDescMuted}>No description provided</Text>
      )}

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Creator row */}
      <View style={styles.creatorRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>{username || 'Organizer'}</Text>
          <Text style={styles.creatorEmail} numberOfLines={1}>{email || 'N/A'}</Text>
        </View>
        <View style={styles.creatorBadge}>
          <Ionicons name="shield-checkmark" size={12} color={C.white} />
          <Text style={styles.creatorBadgeText}>Organizer</Text>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCESS DENIED VIEW
═══════════════════════════════════════════════════════════ */
function AccessDeniedView({ onGoHome }: { onGoHome: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.deniedRoot}>
      <StatusBar style="light" />
      <Animated.View
        style={[styles.deniedCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.lockWrap}>
          <Ionicons name="lock-closed" size={30} color={C.gray1} />
        </View>
        <Text style={styles.deniedTitle}>Organizers Only</Text>
        <Text style={styles.deniedSubtitle}>
          You need an Organizer account to create events and manage photos.
        </Text>
        <TouchableOpacity style={styles.goHomeBtn} onPress={onGoHome} activeOpacity={0.8}>
          <Text style={styles.goHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingBottom: 48,
  },

  /* ── Hero ── */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 68 : 52,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.pill,
    borderWidth: 1,
    borderColor: C.pillBorder,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -1.2,
    lineHeight: 42,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.gray1,
    lineHeight: 19,
  },
  heroImage: {
    width: 140,
    height: 140,
  },

  /* ── Divider ── */
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginHorizontal: 24,
    marginBottom: 28,
  },

  /* ── Form Card ── */
  formCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 22,
    marginBottom: 32,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  formIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.gray3,
  },
  formCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: -0.4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 14,
  },
  textAreaWrap: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    padding: 16,
    minHeight: 110,
    marginBottom: 20,
  },
  inputWrapFocused: {
    borderColor: C.inputFocus,
    backgroundColor: '#121212',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.1,
  },
  textArea: {
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.1,
    lineHeight: 22,
    flex: 1,
  },
  submitBtn: {
    backgroundColor: C.white,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.bg,
    letterSpacing: -0.2,
  },
  submitArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Events Section ── */
  eventsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: C.gray4,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.gray3,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.gray1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.white,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptySearchText: {
    fontSize: 14,
    color: C.gray2,
  },

  /* ── Event Card ── */
  eventCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.white,
  },
  cardDate: {
    fontSize: 11,
    color: C.gray2,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: C.gray1,
    lineHeight: 20,
    marginBottom: 4,
  },
  cardDescMuted: {
    fontSize: 13,
    color: C.gray2,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 14,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.gray4,
    borderWidth: 1,
    borderColor: C.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.offWhite,
  },
  creatorEmail: {
    fontSize: 11,
    color: C.gray2,
    marginTop: 1,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.pill,
    borderWidth: 1,
    borderColor: C.pillBorder,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.white,
  },

  /* ── No Events ── */
  noEventsWrap: {
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 40,
  },
  noEventsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.gray1,
    marginBottom: 6,
  },
  noEventsSubtext: {
    fontSize: 13,
    color: C.gray2,
    textAlign: 'center',
  },

  /* ── Access Denied ── */
  deniedRoot: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  deniedCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  lockWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.gray4,
    borderWidth: 1,
    borderColor: C.gray3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  deniedSubtitle: {
    fontSize: 14,
    color: C.gray1,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  goHomeBtn: {
    backgroundColor: C.gray4,
    borderWidth: 1,
    borderColor: C.gray3,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  goHomeText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
  },
});
