/**
 * Face Finder — Welcome Screen
 * ─────────────────────────────
 * Minimal, dark startup aesthetic — pure black & white.
 * Self-contained palette so the rest of the app stays unchanged.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL, saveToken } from '../../services/api';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

/* ── local B&W palette (only for this screen) ────────────── */
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
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* eslint-disable @typescript-eslint/no-require-imports */
const welcomeIllustration = require('../../../assets/welcome-illustration.png');

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { login } = useAuth();

  /* ── animations ──────────────────────────────── */
  const illustrationScale = useRef(new Animated.Value(0.8)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(40)).current;
  const loginBtnScale = useRef(new Animated.Value(1)).current;
  const googleBtnScale = useRef(new Animated.Value(1)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance
    Animated.stagger(160, [
      // Illustration
      Animated.parallel([
        Animated.spring(illustrationScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(illustrationOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Title
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(titleSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Buttons
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
      // Footer
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle floating animation for illustration
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleLogin = () => {
    Animated.sequence([
      Animated.timing(loginBtnScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(loginBtnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.navigate('Login'));
  };

  const handleGoogleSignIn = async () => {
    Animated.sequence([
      Animated.timing(googleBtnScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(googleBtnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // Build the redirect URL that the backend will use to send us back
      const redirectUrl = Linking.createURL('oauth');

      // Pass our redirect URL to the backend so it knows where to send us back
      const googleAuthUrl = `${BASE_URL}/auth/google?app_redirect_uri=${encodeURIComponent(redirectUrl)}`;

      // Open the backend OAuth endpoint in an in-app browser sheet
      // This shows Google's account chooser without leaving the app
      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        redirectUrl
      );

      if (result.type === 'success' && result.url) {
        // Parse the deep link URL params from the redirect
        const url = Linking.parse(result.url);
        const params = url.queryParams || {};

        if (params.is_new_user === 'true') {
          // New user — navigate to role selection
          navigation.navigate('RoleSelect', {
            userId: params.user_id as string,
            username: params.username as string,
          });
        } else if (params.access_token) {
          // Existing user — save token and log in
          await saveToken(params.access_token as string);
          login(params.username as string || 'User', params.role as string || 'user');
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Sign In Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Background grid lines (subtle) ──────── */}
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

      {/* ── Illustration ────────────────────────── */}
      <View style={styles.heroArea}>
        <Animated.View
          style={[
            styles.illustrationContainer,
            {
              opacity: illustrationOpacity,
              transform: [
                { scale: illustrationScale },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          {/* Glow backdrop behind illustration */}
          <View style={styles.illustrationGlow} />
          <Image
            source={welcomeIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* ── Text content ───────────────────────── */}
      <View style={styles.contentArea}>
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
          }}
        >
          <Text style={styles.brandName}>Face Finder</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleSlide }],
          }}
        >
          <Text style={styles.tagline}>
            Find your face in any event photo
          </Text>
        </Animated.View>
      </View>

      {/* ── Buttons ────────────────────────────── */}
      <Animated.View
        style={[
          styles.buttonArea,
          { opacity: btnOpacity, transform: [{ translateY: btnSlide }] },
        ]}
      >
        {/* Login CTA */}
        <Animated.View style={{ transform: [{ scale: loginBtnScale }] }}>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <View style={styles.loginBtnInner}>
              <Ionicons
                name="log-in-outline"
                size={20}
                color={bw.black}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.loginBtnText}>Login</Text>
            </View>
            <View style={styles.arrowWrap}>
              <Ionicons name="arrow-forward" size={18} color={bw.black} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Continue with Google */}
        <Animated.View style={{ transform: [{ scale: googleBtnScale }] }}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer text */}
        <Animated.View style={{ opacity: footerOpacity }}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const ILLUSTRATION_SIZE = SCREEN_W * 0.8;

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

  /* ── Hero / Illustration ── */
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
  },
  illustrationContainer: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationGlow: {
    position: 'absolute',
    width: ILLUSTRATION_SIZE * 0.8,
    height: ILLUSTRATION_SIZE * 0.8,
    borderRadius: ILLUSTRATION_SIZE * 0.4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    // Invert the black illustration to white for dark background
    tintColor: bw.accent,
  },

  /* ── Content ── */
  contentArea: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 16,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -1,
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: bw.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },

  /* ── Buttons ── */
  buttonArea: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
    paddingTop: 20,
    gap: 16,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: bw.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 24,
    paddingRight: 8,
    shadowColor: bw.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },
  arrowWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Divider ── */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: bw.borderLight,
  },
  dividerText: {
    fontSize: 13,
    color: bw.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* ── Google Button ── */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: bw.borderLight,
    backgroundColor: bw.surface,
    gap: 12,
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: bw.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: '800',
    color: bw.black,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: bw.textPrimary,
    letterSpacing: -0.2,
  },

  /* ── Footer ── */
  footerText: {
    fontSize: 11,
    color: bw.textMuted,
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
