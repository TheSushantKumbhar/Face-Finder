/**
 * Features Section — Horizontal snap-scroll showcase
 * ────────────────────────────────────────────────────
 * Uses built-in Animated API (no Reanimated dependency).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { mono, FEATURES_DATA, SCREEN_W } from './constants';

const CARD_W = SCREEN_W * 0.7;

/* ── Single feature card ────────────────────────────────── */
interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  index: number;
}

function FeatureCard({ icon, title, desc, index }: FeatureCardProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 600,
      delay: 800 + index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.featureCard}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.featureIconWrap}>
          <Ionicons name={icon} size={24} color={mono.textSecondary} />
        </View>

        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>

        {/* Ambient glow */}
        <View style={styles.featureGlow} />
      </Pressable>
    </Animated.View>
  );
}

/* ── Features section ───────────────────────────────────── */
export default function FeaturesSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>CAPABILITIES</Text>
      <FlatList
        data={FEATURES_DATA}
        keyExtractor={(item) => item.title}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <FeatureCard {...item} index={index} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: mono.textDim,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 20,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featureCard: {
    width: CARD_W,
    backgroundColor: mono.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: mono.border,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
    justifyContent: 'flex-end',
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: mono.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: mono.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 26,
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: 13,
    color: mono.textMuted,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  featureGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
});
