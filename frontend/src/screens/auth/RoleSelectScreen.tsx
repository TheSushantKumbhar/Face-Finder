/**
 * Face Finder — Role Selection Screen
 * ────────────────────────────────────
 * Shown after Google OAuth for new users. Pick your role:
 * "User" (find your photos) or "Event Organizer" (manage events).
 * Same dark B&W aesthetic as the WelcomeScreen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { selectRoleApi, saveToken } from '../../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'RoleSelect'>;

/* ── local B&W palette (matching WelcomeScreen) ───────── */
const bw = {
  black: '#000000',
  surface: '#0A0A0A',
  card: '#111111',
  border: '#1A1A1A',
  borderLight: '#252525',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#555555',
  accent: '#FFFFFF',
  dimWhite: 'rgba(255,255,255,0.06)',
  subtleWhite: 'rgba(255,255,255,0.03)',
  selectedBorder: '#FFFFFF',
  selectedBg: 'rgba(255,255,255,0.08)',
};

const { width: SCREEN_W } = Dimensions.get('window');

export default function RoleSelectScreen({ route }: Props) {
  const { userId, username } = route.params;
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'user' | 'organizer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ── animations ──────────────────────────── */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(30)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1Slide = useRef(new Animated.Value(40)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2Slide = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(30)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // Pulse animation for selected card
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(180, [
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(card1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(card1Slide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(card2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(card2Slide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(btnSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSelectRole = (role: 'user' | 'organizer') => {
    const scaleAnim = role === 'user' ? card1Scale : card2Scale;
    const otherScale = role === 'user' ? card2Scale : card1Scale;

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(otherScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const data = await selectRoleApi(userId, selectedRole);
      await saveToken(data.access_token);
      login(data.username || username);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = username.split(' ')[0]; // First name only

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Background grid lines ──────── */}
      <View style={styles.gridOverlay}>
        {[...Array(6)].map((_, i) => (
          <View
            key={`h${i}`}
            style={[
              styles.gridLine,
              styles.gridHorizontal,
              { top: `${(i + 1) * 14}%` },
            ]}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <View
            key={`v${i}`}
            style={[
              styles.gridLine,
              styles.gridVertical,
              { left: `${(i + 1) * 20}%` },
            ]}
          />
        ))}
      </View>

      {/* ── Header ──────────────────────── */}
      <Animated.View
        style={[
          styles.headerArea,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <View style={styles.welcomeBadge}>
          <Ionicons name="sparkles" size={14} color={bw.textPrimary} />
          <Text style={styles.welcomeBadgeText}>Welcome aboard</Text>
        </View>
        <Text style={styles.headerTitle}>
          Hey {displayName}! 👋
        </Text>
        <Text style={styles.headerSubtitle}>
          How would you like to use Face Finder?
        </Text>
      </Animated.View>

      {/* ── Role Cards ──────────────────── */}
      <View style={styles.cardsArea}>
        {/* User Card */}
        <Animated.View
          style={{
            opacity: card1Opacity,
            transform: [{ translateY: card1Slide }, { scale: card1Scale }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'user' && styles.roleCardSelected,
            ]}
            onPress={() => handleSelectRole('user')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleIconWrap,
                  selectedRole === 'user' && styles.roleIconWrapSelected,
                ]}
              >
                <Ionicons
                  name="person"
                  size={26}
                  color={selectedRole === 'user' ? bw.black : bw.textSecondary}
                />
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === 'user' && styles.radioOuterSelected,
                ]}
              >
                {selectedRole === 'user' && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.roleTitle}>I'm a User</Text>
            <Text style={styles.roleDescription}>
              Find your face in event photos, browse events, and download your pictures instantly.
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>Face recognition search</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>Browse & join events</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>Download your photos</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Organizer Card */}
        <Animated.View
          style={{
            opacity: card2Opacity,
            transform: [{ translateY: card2Slide }, { scale: card2Scale }],
          }}
        >
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'organizer' && styles.roleCardSelected,
            ]}
            onPress={() => handleSelectRole('organizer')}
            activeOpacity={0.85}
          >
            <View style={styles.roleCardHeader}>
              <View
                style={[
                  styles.roleIconWrap,
                  selectedRole === 'organizer' && styles.roleIconWrapSelected,
                ]}
              >
                <Ionicons
                  name="calendar"
                  size={26}
                  color={selectedRole === 'organizer' ? bw.black : bw.textSecondary}
                />
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === 'organizer' && styles.radioOuterSelected,
                ]}
              >
                {selectedRole === 'organizer' && <View style={styles.radioInner} />}
              </View>
            </View>
            <Text style={styles.roleTitle}>I'm an Organizer</Text>
            <Text style={styles.roleDescription}>
              Create events, upload bulk photos, and let attendees find themselves with AI.
            </Text>
            <View style={styles.roleFeatures}>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>Create & manage events</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>Bulk photo uploads</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color={bw.textMuted} />
                <Text style={styles.featureText}>AI-powered face tagging</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Continue Button ─────────────── */}
      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: btnOpacity,
            transform: [{ translateY: btnSlide }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              styles.continueBtn,
              !selectedRole && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!selectedRole || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={bw.black} />
            ) : (
              <>
                <Text
                  style={[
                    styles.continueBtnText,
                    !selectedRole && styles.continueBtnTextDisabled,
                  ]}
                >
                  Continue
                </Text>
                <View style={styles.arrowWrap}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={selectedRole ? bw.black : bw.textMuted}
                  />
                </View>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bw.black,
  },

  /* ── Background grid ── */
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  gridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },

  /* ── Header ── */
  headerArea: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: bw.dimWhite,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: bw.border,
  },
  welcomeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: bw.textSecondary,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: bw.textSecondary,
    lineHeight: 24,
    letterSpacing: 0.2,
  },

  /* ── Role Cards ── */
  cardsArea: {
    flex: 1,
    paddingHorizontal: 28,
    gap: 16,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: bw.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: bw.borderLight,
  },
  roleCardSelected: {
    borderColor: bw.selectedBorder,
    backgroundColor: bw.selectedBg,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  roleIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: bw.dimWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: bw.border,
  },
  roleIconWrapSelected: {
    backgroundColor: bw.accent,
    borderColor: bw.accent,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: bw.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: bw.accent,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: bw.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 14,
    color: bw.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  roleFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: bw.textMuted,
    letterSpacing: 0.2,
  },

  /* ── Continue Button ── */
  bottomArea: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
    paddingTop: 12,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bw.accent,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: bw.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  continueBtnDisabled: {
    backgroundColor: bw.card,
    borderWidth: 1,
    borderColor: bw.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },
  continueBtnTextDisabled: {
    color: bw.textMuted,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
