/**
 * Timeline Section — Elegant activity feed
 * ──────────────────────────────────────────
 * Uses built-in Animated API (no Reanimated dependency).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mono, TIMELINE_DATA } from './constants';

/* ── Single timeline item ───────────────────────────────── */
interface TimelineItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  time: string;
  index: number;
  isLast: boolean;
}

function TimelineItem({ icon, title, desc, time, index, isLast }: TimelineItemProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 500,
      delay: 600 + index * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = enter.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <Animated.View style={[styles.item, { opacity: enter, transform: [{ translateX }] }]}>
      {/* Timeline rail */}
      <View style={styles.rail}>
        <View style={styles.dot}>
          <Ionicons name={icon} size={14} color={mono.textSecondary} />
        </View>
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemTime}>{time}</Text>
        </View>
        <Text style={styles.itemDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
}

/* ── Timeline section ───────────────────────────────────── */
export default function TimelineSection() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
      <View style={styles.timeline}>
        {TIMELINE_DATA.map((item, i) => (
          <TimelineItem
            key={i}
            {...item}
            index={i}
            isLast={i === TIMELINE_DATA.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: mono.textDim,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  timeline: {
    backgroundColor: mono.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: mono.border,
    padding: 20,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    minHeight: 56,
  },
  rail: {
    alignItems: 'center',
    width: 36,
    marginRight: 14,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: mono.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 1,
    flex: 1,
    backgroundColor: mono.border,
    marginVertical: 4,
  },
  itemContent: {
    flex: 1,
    paddingBottom: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: mono.textPrimary,
    letterSpacing: -0.2,
  },
  itemTime: {
    fontSize: 11,
    color: mono.textDim,
    letterSpacing: 0.3,
  },
  itemDesc: {
    fontSize: 13,
    color: mono.textMuted,
    lineHeight: 18,
  },
});
