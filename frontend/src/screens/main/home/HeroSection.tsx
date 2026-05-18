/**
 * Hero Section — Cinematic animated greeting
 * ────────────────────────────────────────────
 * Uses built-in Animated API (no Reanimated dependency).
 * On press: a small cyan particle with a fading tail travels once around the border.
 */
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Pressable, Easing, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { mono, SCREEN_W, QUOTES, getGreeting, getFormattedDate, getFormattedTime } from './constants';
import { palette } from '../../../theme/colors';

interface HeroSectionProps {
  username: string;
}

const BORDER_RADIUS = 28;
const SWEEP_MS = 1800;

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

/* ── Helper: compute perimeter path keyframes ──────────── */
function buildPerimeterPath(W: number, H: number, R: number) {
  const pts: { t: number; x: number; y: number }[] = [];
  const arcLen = (Math.PI * R) / 2;
  const topLen = W - 2 * R;
  const rightLen = H - 2 * R;
  const total = 2 * topLen + 2 * rightLen + 4 * arcLen;
  let d = 0;
  const CORNER_STEPS = 8;

  const push = (x: number, y: number) => { pts.push({ t: d / total, x, y }); };

  // Start at top-left after corner
  push(R, 0);

  // Top edge
  d += topLen; push(W - R, 0);

  // Top-right corner
  for (let i = 1; i <= CORNER_STEPS; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / CORNER_STEPS);
    d += arcLen / CORNER_STEPS;
    push(W - R + R * Math.cos(a), R + R * Math.sin(a));
  }

  // Right edge
  d += rightLen; push(W, H - R);

  // Bottom-right corner
  for (let i = 1; i <= CORNER_STEPS; i++) {
    const a = (Math.PI / 2) * (i / CORNER_STEPS);
    d += arcLen / CORNER_STEPS;
    push(W - R + R * Math.cos(a), H - R + R * Math.sin(a));
  }

  // Bottom edge
  d += topLen; push(R, H);

  // Bottom-left corner
  for (let i = 1; i <= CORNER_STEPS; i++) {
    const a = Math.PI / 2 + (Math.PI / 2) * (i / CORNER_STEPS);
    d += arcLen / CORNER_STEPS;
    push(R + R * Math.cos(a), H - R + R * Math.sin(a));
  }

  // Left edge
  d += rightLen; push(0, R);

  // Top-left corner
  for (let i = 1; i <= CORNER_STEPS; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / CORNER_STEPS);
    d += arcLen / CORNER_STEPS;
    push(R + R * Math.cos(a), R + R * Math.sin(a));
  }

  return pts;
}

/* ── Particle trail component ──────────────────────────── */
const PARTICLE_COUNT = 5;
const TRAIL_STAGGER = 35;
const PARTICLE_SIZES = [6, 5, 4, 3, 2];
const PARTICLE_ALPHAS = [1, 0.65, 0.4, 0.2, 0.08];

const ParticleTrail = React.forwardRef<{ play: () => void }, { path: ReturnType<typeof buildPerimeterPath> }>(
  ({ path }, ref) => {
    const anims = useRef(Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))).current;
    const visibility = useRef(new Animated.Value(0)).current;

    React.useImperativeHandle(ref, () => ({
      play: () => {
        anims.forEach(a => a.setValue(0));
        visibility.setValue(1);

        Animated.stagger(
          TRAIL_STAGGER,
          anims.map(a =>
            Animated.timing(a, {
              toValue: 1,
              duration: SWEEP_MS,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ),
        ).start(() => {
          Animated.timing(visibility, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      },
    }));

    const inputRange = path.map(p => p.t);
    const xRange = path.map(p => p.x);
    const yRange = path.map(p => p.y);

    return (
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: visibility }]}>
        {anims.map((a, i) => {
          const s = PARTICLE_SIZES[i];
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: s,
                height: s,
                borderRadius: s / 2,
                backgroundColor: palette.gold,
                opacity: PARTICLE_ALPHAS[i],
                transform: [
                  { translateX: a.interpolate({ inputRange, outputRange: xRange.map(x => x - s / 2), extrapolate: 'clamp' }) },
                  { translateY: a.interpolate({ inputRange, outputRange: yRange.map(y => y - s / 2), extrapolate: 'clamp' }) },
                ],
                ...(i === 0 && {
                  shadowColor: palette.gold,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 4,
                }),
              }}
            />
          );
        })}
      </Animated.View>
    );
  },
);

export default function HeroSection({ username }: HeroSectionProps) {
  const greeting = getGreeting();
  const date = getFormattedDate();
  const time = getFormattedTime();
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  /* ── Layout & path ─────────────────────── */
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);
  const path = useMemo(
    () => cardSize ? buildPerimeterPath(cardSize.w, cardSize.h, BORDER_RADIUS) : null,
    [cardSize],
  );
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCardSize({ w: width, h: height });
  }, []);

  /* ── Particle ref ──────────────────────── */
  const trailRef = useRef<{ play: () => void }>(null);
  const handlePress = useCallback(() => trailRef.current?.play(), []);

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
    <Animated.View
      style={[styles.hero, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}
      onLayout={handleLayout}
    >
      {/* Particle trail — plays once per tap */}
      {path && <ParticleTrail ref={trailRef} path={path} />}

      <Pressable onPress={handlePress} style={styles.heroInner}>
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
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 16 : 12,
    borderRadius: BORDER_RADIUS,
    minHeight: 260,
  },
  heroInner: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
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
    color: palette.gold,
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
