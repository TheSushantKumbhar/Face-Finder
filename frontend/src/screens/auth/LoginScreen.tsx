/**
 * Face Finder — Login Screen
 * ───────────────────────────
 * Premium dark B&W login — matches the WelcomeScreen aesthetic.
 * No scroll — everything fits in a single view.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../../context/AuthContext';
import { loginApi, BASE_URL, saveToken } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

/* ── local B&W palette ───────────────────────────────────── */
const bw = {
  black: '#000000',
  surface: '#0A0A0A',
  card: '#0E0E0E',
  border: '#1A1A1A',
  borderLight: '#222222',
  inputBg: '#111111',
  inputBorder: '#1E1E1E',
  inputFocusBorder: '#444444',
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#505050',
  accent: '#FFFFFF',
  placeholder: '#3A3A3A',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ILLUSTRATION_SIZE = SCREEN_W * 0.65;

/* eslint-disable @typescript-eslint/no-require-imports */
const loginIllustration = require('../../../assets/login-illustration.png');

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  /* ── animations ──────────────────────────── */
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(25)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const googleBtnScale = useRef(new Animated.Value(1)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(illustrationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(illustrationScale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlide, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    try {
      const resp = await loginApi(email.trim(), password);
      login(resp.username, resp.role);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
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
      const redirectUrl = Linking.createURL('oauth');
      const googleAuthUrl = `${BASE_URL}/auth/google?app_redirect_uri=${encodeURIComponent(redirectUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(
        googleAuthUrl,
        redirectUrl
      );

      if (result.type === 'success' && result.url) {
        const url = Linking.parse(result.url);
        const params = url.queryParams || {};

        if (params.is_new_user === 'true') {
          navigation.navigate('RoleSelect', {
            userId: params.user_id as string,
            username: params.username as string,
          });
        } else if (params.access_token) {
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

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={bw.textPrimary} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* ── Illustration ── */}
        <Animated.View
          style={[
            styles.illustrationArea,
            {
              opacity: illustrationOpacity,
              transform: [{ scale: illustrationScale }],
            },
          ]}
        >
          <View style={styles.illustrationGlow} />
          <Image
            source={loginIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── Header ── */}
        <Animated.View
          style={[
            styles.headerArea,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to find your moments</Text>
        </Animated.View>

        {/* ── Form ── */}
        <Animated.View
          style={[
            styles.formArea,
            {
              opacity: formOpacity,
              transform: [{ translateY: formSlide }],
            },
          ]}
        >
          {/* Email */}
          <View
            style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={18}
              color={emailFocused ? bw.textSecondary : bw.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={bw.placeholder}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View
            style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused,
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={passwordFocused ? bw.textSecondary : bw.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={bw.placeholder}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={bw.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Buttons ── */}
        <Animated.View
          style={[
            styles.buttonArea,
            {
              opacity: btnOpacity,
              transform: [{ translateY: btnSlide }],
            },
          ]}
        >
          {/* Sign In */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={bw.black} />
              ) : (
                <View style={styles.signInBtnInner}>
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={bw.black}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <View style={{ flex: 1 }} />
                  <View style={styles.arrowWrap}>
                    <Ionicons name="arrow-forward" size={18} color={bw.black} />
                  </View>
                </View>
              )}
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

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpLabel}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bw.black,
  },

  /* ── Back ── */
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: bw.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  /* ── Illustration ── */
  illustrationArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  illustrationGlow: {
    position: 'absolute',
    width: ILLUSTRATION_SIZE * 0.7,
    height: ILLUSTRATION_SIZE * 0.7,
    borderRadius: ILLUSTRATION_SIZE * 0.35,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  illustration: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    tintColor: bw.accent,
  },

  /* ── Header ── */
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: bw.textSecondary,
    letterSpacing: 0.2,
  },

  /* ── Form ── */
  formArea: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: bw.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: bw.inputBorder,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 12,
  },
  inputWrapperFocused: {
    borderColor: bw.inputFocusBorder,
    backgroundColor: '#141414',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: bw.textPrimary,
    letterSpacing: 0.2,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: bw.textSecondary,
    letterSpacing: 0.2,
  },

  /* ── Buttons ── */
  buttonArea: {
    gap: 14,
  },
  signInBtn: {
    backgroundColor: bw.accent,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: bw.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  signInBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
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
    fontSize: 12,
    color: bw.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* ── Google ── */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: bw.borderLight,
    backgroundColor: bw.surface,
    gap: 12,
  },
  googleIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: bw.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 14,
    fontWeight: '800',
    color: bw.black,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: bw.textPrimary,
    letterSpacing: -0.2,
  },

  /* ── Sign Up Link ── */
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  signUpLabel: {
    fontSize: 13,
    color: bw.textMuted,
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: '700',
    color: bw.textPrimary,
    textDecorationLine: 'underline',
  },
});
