/**
 * Face Finder — Event Details Screen
 * ────────────────────────────────────
 * Premium cinematic event experience.
 * Pure black & white luxury editorial aesthetic.
 * Uses built-in RN Animated API only (no Reanimated).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  ScrollView, Dimensions, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import {
  DiscoverEventResponse, retrievePhotosApi,
  getEventPhotosApi, PhotoResponse,
} from '../../services/api';
import { mono } from './home/constants';

const { width: SCREEN_W } = Dimensions.get('window');

/** Backend sends naive UTC datetimes without 'Z'. Append it so JS parses as UTC. */
function parseUTC(iso: string): Date {
  if (iso && !iso.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    return new Date(iso + 'Z');
  }
  return new Date(iso);
}
function formatDateLong(iso: string): string {
  const d = parseUTC(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(iso: string): string {
  const d = parseUTC(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const LOADING_PHRASES = [
  'Scanning memories…', 'Finding your moments…',
  'Matching faces…', 'Curating your gallery…', 'Almost there…',
];

/* ── Intelligent Loading Overlay ─────────────────────────── */
function IntelligentLoader() {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const phraseOpacity = useRef(new Animated.Value(1)).current;
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const animateRing = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    animateRing(ring1, 0).start();
    animateRing(ring2, 400).start();
    animateRing(ring3, 800).start();

    const interval = setInterval(() => {
      Animated.timing(phraseOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
        Animated.timing(phraseOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const ringStyle = (anim: Animated.Value, size: number) => ({
    width: size, height: size, borderRadius: size / 2,
    position: 'absolute' as const, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.15, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] }) }],
  });

  return (
    <View style={ldStyles.container}>
      <View style={ldStyles.ringsWrap}>
        <Animated.View style={ringStyle(ring1, 120)} />
        <Animated.View style={ringStyle(ring2, 120)} />
        <Animated.View style={ringStyle(ring3, 120)} />
        <View style={ldStyles.dot} />
      </View>
      <Animated.Text style={[ldStyles.phrase, { opacity: phraseOpacity }]}>
        {LOADING_PHRASES[phraseIndex]}
      </Animated.Text>
    </View>
  );
}
const ldStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 60 },
  ringsWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  phrase: { fontSize: 14, fontWeight: '500', color: mono.textSecondary, letterSpacing: 0.5 },
});

/* ══════════════════════════════════════════════════════════ */
export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const event: DiscoverEventResponse = route.params?.event;

  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const bannerScale = useRef(new Animated.Value(1.1)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bannerScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 200);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ctaSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 500);
    Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: false })).start();
  }, []);

  const handleRetrieve = useCallback(async () => {
    if (!event) return;
    setState('loading');
    setErrorMsg('');
    try {
      const result = await retrievePhotosApi(event.id);
      const matches = result.matches || [];
      if (matches.length === 0) {
        setState('error');
        setErrorMsg('No matching photos found in this event.');
        return;
      }
      const allPhotos = await getEventPhotosApi(event.id);
      const matchMap = new Map(matches.map(m => [m.photo_id, m.score]));
      const matchedPhotos = allPhotos
        .filter(p => matchMap.has(p.id))
        .map(p => ({ ...p, score: matchMap.get(p.id) || 0 }))
        .sort((a, b) => b.score - a.score);

      setState('idle');
      navigation.navigate('RetrievedGallery', { photos: matchedPhotos, eventName: event.name });
    } catch (err: any) {
      setState('error');
      setErrorMsg(err.message || 'Something went wrong.');
    }
  }, [event, navigation]);

  const onIn = () => Animated.spring(ctaScale, { toValue: 0.96, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(ctaScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  if (!event) return null;
  const hue = event.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const shimmerBorder = shimmerAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.30)', 'rgba(255,255,255,0.08)'],
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(255,255,255,0.015)', 'transparent', 'rgba(255,255,255,0.01)', 'transparent']} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFillObject} />

      <Pressable style={[s.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()} hitSlop={12}>
        <View style={s.backInner}><Ionicons name="arrow-back" size={20} color="#FFF" /></View>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Banner */}
        <Animated.View style={[s.banner, { opacity: bannerOpacity, transform: [{ scale: bannerScale }] }]}>
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : (
            <>
              <LinearGradient colors={[`hsla(${hue},20%,35%,0.2)`, 'rgba(255,255,255,0.02)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
              <View style={s.bannerIcon}>
                <Text style={[s.bannerLetter, { color: `hsla(${hue},25%,65%,0.35)` }]}>{event.name[0]?.toUpperCase() || 'E'}</Text>
              </View>
            </>
          )}
          <View style={s.decorLine1} /><View style={s.decorLine2} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)', mono.bg]} locations={[0, 0.6, 1]} style={s.bannerGrad} />
        </Animated.View>

        {/* Info */}
        <Animated.View style={[s.info, { opacity: contentOpacity, transform: [{ translateY: contentSlide }] }]}>
          <Text style={s.title}>{event.name}</Text>
          <View style={s.divider} />
          <View style={s.metaGrid}>
            {[
              { icon: 'calendar-outline' as const, label: 'DATE', val: formatDateLong(event.created_at) },
              { icon: 'time-outline' as const, label: 'TIME', val: formatTime(event.created_at) },
              { icon: 'person-outline' as const, label: 'ORGANIZER', val: event.organiser_name },
              { icon: 'images-outline' as const, label: 'PHOTOS', val: `${event.photo_count} captures` },
            ].map((m, i) => (
              <View key={i} style={s.metaItem}>
                <View style={s.metaIconWrap}><Ionicons name={m.icon} size={16} color={mono.textMuted} /></View>
                <View><Text style={s.metaLabel}>{m.label}</Text><Text style={s.metaVal}>{m.val}</Text></View>
              </View>
            ))}
          </View>
          {event.description ? <><View style={s.divider} /><Text style={s.desc}>{event.description}</Text></> : null}
          <View style={s.statsRow}>
            {[{ v: String(event.photo_count), l: 'Photos' }, { v: 'AI', l: 'Powered' }, { v: 'HD', l: 'Quality' }].map((st, i) => (
              <View key={i} style={s.statPill}><Text style={s.statV}>{st.v}</Text><Text style={s.statL}>{st.l}</Text></View>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[s.ctaSection, { opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] }]}>
          {state === 'idle' && (
            <Animated.View style={[s.ctaOuter, { borderColor: shimmerBorder, transform: [{ scale: ctaScale }] }]}>
              <Pressable onPress={handleRetrieve} onPressIn={onIn} onPressOut={onOut} style={s.ctaBtn}>
                <LinearGradient colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={s.ctaTxt}>Find My Moments</Text>
                <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" style={{ marginLeft: 10 }} />
              </Pressable>
            </Animated.View>
          )}
          {state === 'loading' && <IntelligentLoader />}
          {state === 'error' && (
            <View style={s.errWrap}>
              <View style={s.errIcon}><Ionicons name="alert-circle-outline" size={28} color={mono.textMuted} /></View>
              <Text style={s.errTxt}>{errorMsg}</Text>
              <Pressable style={s.retryBtn} onPress={() => setState('idle')}><Text style={s.retryTxt}>Try Again</Text></Pressable>
            </View>
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: mono.bg },
  scroll: { paddingBottom: 40 },
  backBtn: { position: 'absolute', left: 16, zIndex: 10 },
  backInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  banner: { height: 280, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  bannerIcon: { width: 120, height: 120, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  bannerLetter: { fontSize: 56, fontWeight: '900' },
  decorLine1: { position: 'absolute', top: 40, right: 30, width: 60, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  decorLine2: { position: 'absolute', bottom: 60, left: 30, width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  bannerGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  info: { paddingHorizontal: 24, marginTop: -20 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFF', letterSpacing: -0.8, lineHeight: 38, marginBottom: 16 },
  divider: { height: 1, backgroundColor: mono.border, marginVertical: 20 },
  metaGrid: { gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: mono.card, borderWidth: 1, borderColor: mono.border, alignItems: 'center', justifyContent: 'center' },
  metaLabel: { fontSize: 10, fontWeight: '700', color: mono.textDim, letterSpacing: 1.5, marginBottom: 2 },
  metaVal: { fontSize: 14, fontWeight: '600', color: mono.textSecondary, letterSpacing: -0.2 },
  desc: { fontSize: 14, color: mono.textMuted, lineHeight: 22, letterSpacing: 0.1 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: mono.card, borderWidth: 1, borderColor: mono.border },
  statV: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3, marginBottom: 4 },
  statL: { fontSize: 10, fontWeight: '600', color: mono.textDim, letterSpacing: 1, textTransform: 'uppercase' },
  ctaSection: { paddingHorizontal: 24, paddingTop: 32 },
  ctaOuter: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.04)' },
  ctaTxt: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
  errWrap: { alignItems: 'center', paddingVertical: 32 },
  errIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: mono.card, borderWidth: 1, borderColor: mono.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  errTxt: { fontSize: 14, color: mono.textMuted, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20, lineHeight: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  retryTxt: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
});
