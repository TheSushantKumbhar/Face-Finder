/**
 * Face Finder — Login Screen
 * ───────────────────────────
 * Warm peach themed login with animated inputs and glassmorphic card.
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
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { loginApi } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const { colors, spacing, borderRadius, fontSize } = theme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const emailScale = useRef(new Animated.Value(1)).current;
  const passwordScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.spring(anim, {
      toValue: focused ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    animateButtonPress();
    setLoading(true);

    try {
      await loginApi(email.trim(), password);
      // Extract username from email (before @) as display name
      const displayName = email.trim().split('@')[0];
      login(displayName);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.08)' }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: 'rgba(0,0,0,0.08)' }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="scan" size={36} color={colors.textOnPrimary} />
            </View>

            <Text style={[styles.appName, { color: colors.text, fontSize: fontSize.hero }]}>
              Welcome Back
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary, fontSize: fontSize.md }]}>
              Sign in to find your moments
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                backgroundColor: 'rgba(255,255,255,0.35)',
                borderColor: 'rgba(255,255,255,0.5)',
                shadowColor: colors.shadow,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Email Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderColor: emailFocused ? colors.primary : 'rgba(0,0,0,0.08)',
                  transform: [{ scale: emailScale }],
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? colors.primary : colors.iconMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.inputText, fontSize: fontSize.md }]}
                placeholder="Email address"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                onFocus={() => {
                  setEmailFocused(true);
                  animateFocus(emailScale, true);
                }}
                onBlur={() => {
                  setEmailFocused(false);
                  animateFocus(emailScale, false);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderColor: passwordFocused ? colors.primary : 'rgba(0,0,0,0.08)',
                  transform: [{ scale: passwordScale }],
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? colors.primary : colors.iconMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.inputText, fontSize: fontSize.md }]}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={setPassword}
                onFocus={() => {
                  setPasswordFocused(true);
                  animateFocus(passwordScale, true);
                }}
                onBlur={() => {
                  setPasswordFocused(false);
                  animateFocus(passwordScale, false);
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.iconMuted}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={[styles.forgotText, { color: colors.primary, fontSize: fontSize.sm }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.signInButton,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.signInText, { color: colors.textOnPrimary, fontSize: fontSize.lg }]}>
                      Sign In
                    </Text>
                    <View style={[styles.arrowContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={[styles.signUpLabel, { color: colors.textMuted, fontSize: fontSize.md }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.signUpLink, { color: colors.text, fontSize: fontSize.md }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggle: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  appName: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 28,
    // Glassmorphic effect
    overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 8,
  },
  signInText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpLabel: {},
  signUpLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
