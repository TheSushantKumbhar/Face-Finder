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
  card: '#0E0E0E',
  border: '#1A1A1A',
  borderLight: '#222222',
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#505050',
  accent: '#FFFFFF',
};

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_W - 28 * 2 - 16) / 2; // two cards side by side

export default function RoleSelectScreen({ route }: Props) {
  const { userId, username } = route.params;
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'user' | 'organizer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ── animations ──────────────────────────── */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(24)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(200, [
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
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(cardsSlide, {
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
          toValue: 0.93,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
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
      login(data.username || username, data.role || 'user');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = username.split(' ')[0];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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
        <Text style={styles.greeting}>Hey {displayName} 👋</Text>
        <Text style={styles.headerTitle}>Choose your role</Text>
        <Text style={styles.headerSubtitle}>
          You can always change this later in settings
        </Text>
      </Animated.View>

      {/* ── Role Cards (side by side) ───── */}
      <Animated.View
        style={[
          styles.cardsRow,
          {
            opacity: cardsOpacity,
            transform: [{ translateY: cardsSlide }],
          },
        ]}
      >
        {/* User Card */}
        <Animated.View style={{ transform: [{ scale: card1Scale }], flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'user' && styles.roleCardSelected,
            ]}
            onPress={() => handleSelectRole('user')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                selectedRole === 'user' && styles.iconCircleSelected,
              ]}
            >
              <Ionicons
                name="person"
                size={28}
                color={selectedRole === 'user' ? bw.black : bw.textSecondary}
              />
            </View>

            <Text style={styles.roleTitle}>User</Text>
            <Text style={styles.roleDescription}>
              Find your photos{'\n'}in any event
            </Text>

            {/* Selection indicator */}
            <View
              style={[
                styles.checkCircle,
                selectedRole === 'user' && styles.checkCircleSelected,
              ]}
            >
              {selectedRole === 'user' && (
                <Ionicons name="checkmark" size={14} color={bw.black} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Organizer Card */}
        <Animated.View style={{ transform: [{ scale: card2Scale }], flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'organizer' && styles.roleCardSelected,
            ]}
            onPress={() => handleSelectRole('organizer')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconCircle,
                selectedRole === 'organizer' && styles.iconCircleSelected,
              ]}
            >
              <Ionicons
                name="calendar"
                size={28}
                color={selectedRole === 'organizer' ? bw.black : bw.textSecondary}
              />
            </View>

            <Text style={styles.roleTitle}>Organizer</Text>
            <Text style={styles.roleDescription}>
              Create events &{'\n'}upload photos
            </Text>

            {/* Selection indicator */}
            <View
              style={[
                styles.checkCircle,
                selectedRole === 'organizer' && styles.checkCircleSelected,
              ]}
            >
              {selectedRole === 'organizer' && (
                <Ionicons name="checkmark" size={14} color={bw.black} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

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
              <View style={styles.continueBtnInner}>
                <Text
                  style={[
                    styles.continueBtnText,
                    !selectedRole && styles.continueBtnTextDisabled,
                  ]}
                >
                  Get Started
                </Text>
                <View
                  style={[
                    styles.arrowWrap,
                    !selectedRole && styles.arrowWrapDisabled,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={selectedRole ? bw.black : bw.textMuted}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </Animated.View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bw.black,
    justifyContent: 'center',
  },

  /* ── Header ── */
  headerArea: {
    paddingHorizontal: 28,
    marginBottom: 40,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    color: bw.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: bw.textMuted,
    letterSpacing: 0.2,
  },

  /* ── Cards ── */
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    gap: 16,
    marginBottom: 50,
  },
  roleCard: {
    backgroundColor: bw.card,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: bw.borderLight,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: bw.accent,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: bw.border,
  },
  iconCircleSelected: {
    backgroundColor: bw.accent,
    borderColor: bw.accent,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: bw.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 13,
    color: bw.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  checkCircle: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: bw.accent,
    borderColor: bw.accent,
  },

  /* ── Continue Button ── */
  bottomArea: {
    paddingHorizontal: 28,
  },
  continueBtn: {
    backgroundColor: bw.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: bw.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: bw.card,
    borderWidth: 1,
    borderColor: bw.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowWrapDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  footerText: {
    fontSize: 11,
    color: bw.textMuted,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
});
