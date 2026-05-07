/**
 * Hero Section — Cinematic animated greeting
 * ────────────────────────────────────────────
 * Uses built-in Animated API (no Reanimated dependency).
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mono, SCREEN_W, QUOTES, getGreeting, getFormattedDate, getFormattedTime } from './constants';

interface HeroSectionProps {
  username: string;
}

/* ── Floating blur orb ──────────────────────────────────── */
const FloatingOrb = ({ size, x, y, delay }: { size: number; x: number; y: number; delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 4000, useNativeDriver: true, delay }),
        Animated.timing(anim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.3, 0.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255,255,255,0.06)',
        left: x,
        top: y,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
};

export default function HeroSection({ username }: HeroSectionProps) {
  const greeting = getGreeting();
  const date = getFormattedDate();
  const time = getFormattedTime();
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  /* ── Entrance animations ───────────────── */
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const quoteSlide = useRef(new Animated.Value(20)).current;
  const dateOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
      Animated.timing(titleSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(quoteOpacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(quoteSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(dateOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      {/* Ambient gradient bg */}
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating orbs */}
      <FloatingOrb size={120} x={-30} y={20} delay={0} />
      <FloatingOrb size={80} x={SCREEN_W - 100} y={60} delay={1000} />
      <FloatingOrb size={60} x={SCREEN_W / 2 - 30} y={-10} delay={2000} />

      {/* Noise texture overlay */}
      <View style={styles.noiseOverlay} />

      {/* Content */}
      <View style={styles.heroContent}>
        <Animated.Text style={[styles.greetingEmoji, { transform: [{ translateY: titleSlide }] }]}>
          👋
        </Animated.Text>

        <Animated.Text style={[styles.greetingText, { opacity: fadeIn, transform: [{ translateY: titleSlide }] }]}>
          {greeting},{'\n'}
          <Text style={styles.nameText}>{username || 'User'}</Text>
        </Animated.Text>

        <Animated.Text style={[styles.quoteText, { opacity: quoteOpacity, transform: [{ translateY: quoteSlide }] }]}>
          "{quote}"
        </Animated.Text>

        <Animated.View style={[styles.dateRow, { opacity: dateOpacity }]}>
          <View style={styles.datePill}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom glow line */}
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.glowLine}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 16 : 12,
    borderRadius: 28,
    backgroundColor: mono.card,
    borderWidth: 1,
    borderColor: mono.border,
    overflow: 'hidden',
    minHeight: 260,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128,128,128,0.02)',
  },
  heroContent: {
    padding: 28,
    paddingTop: 32,
    paddingBottom: 24,
    zIndex: 1,
  },
  greetingEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '300',
    color: mono.textSecondary,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  nameText: {
    fontWeight: '700',
    color: mono.textPrimary,
    letterSpacing: -1,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: mono.textMuted,
    marginTop: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: mono.border,
  },
  dateText: {
    fontSize: 12,
    color: mono.textSecondary,
    letterSpacing: 0.4,
    fontWeight: '500',
  },
  timePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: mono.border,
  },
  timeText: {
    fontSize: 12,
    color: mono.textMuted,
    letterSpacing: 0.4,
    fontWeight: '500',
  },
  glowLine: {
    height: 1,
    marginHorizontal: 20,
  },
});
