/**
 * Stats Cards — Premium animated stat counters
 * ──────────────────────────────────────────────
 * Uses built-in Animated API (no Reanimated dependency).
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mono, STATS_DATA, SCREEN_W } from './constants';

/* ── Single stat card ───────────────────────────────────── */
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  suffix: string;
  index: number;
}

function StatCard({ icon, label, value, suffix, index }: StatCardProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    // Entrance animation
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      delay: 300 + index * 120,
      useNativeDriver: true,
    }).start();

    // Counter animation
    const startTime = Date.now();
    const duration = 1200;
    const delay = 500 + index * 120;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime - delay;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * value;

        if (suffix === 'GB') {
          setDisplayValue(current.toFixed(1));
        } else {
          setDisplayValue(Math.round(current).toString());
        }

        if (progress >= 1) clearInterval(interval);
      }, 16);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const CARD_W = (SCREEN_W - 16 * 2 - 12) / 2;

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { width: CARD_W }]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={mono.textSecondary} />
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.value}>{displayValue}</Text>
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>

        <Text style={styles.label}>{label}</Text>

        {/* Subtle glow accent */}
        <View style={styles.glowDot} />
      </Pressable>
    </Animated.View>
  );
}

/* ── Stats grid ─────────────────────────────────────────── */
export default function StatsSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>YOUR STATS</Text>
      <View style={styles.grid}>
        {STATS_DATA.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: mono.textDim,
    letterSpacing: 2,
    marginBottom: 14,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: mono.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: mono.border,
    overflow: 'hidden',
    position: 'relative',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: mono.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: mono.textPrimary,
    letterSpacing: -1,
  },
  suffix: {
    fontSize: 14,
    fontWeight: '500',
    color: mono.textMuted,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: mono.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  glowDot: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
