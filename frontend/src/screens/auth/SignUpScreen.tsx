/**
 * Face Finder — Sign Up Screen
 * ─────────────────────────────
 * Warm peach themed sign up with role selection, animated cards, and glassmorphic styling.
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
import { signUpApi } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;
};

type Role = 'user' | 'organizer';

const { width } = Dimensions.get('window');

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { colors, spacing, borderRadius, fontSize } = theme;

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const userCardScale = useRef(new Animated.Value(1)).current;
  const organizerCardScale = useRef(new Animated.Value(1)).current;

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

  const animateCardPress = (anim: Animated.Value) => {
    Animated.sequence([
      Animated.spring(anim, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }),
    ]).start();
  };

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    animateButtonPress();
    setLoading(true);

    try {
      await signUpApi(username.trim(), email.trim(), password, role);
      Alert.alert('Account Created!', 'You can now sign in with your credentials.', [
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    focused: boolean,
    setFocused: (f: boolean) => void,
    options?: {
      secure?: boolean;
      showToggle?: boolean;
      showValue?: boolean;
      onToggle?: () => void;
      keyboardType?: 'default' | 'email-address';
      autoCapitalize?: 'none' | 'sentences' | 'words';
    }
  ) => (
    <View
      style={[
        styles.inputWrapper,
        {
          backgroundColor: 'rgba(255,255,255,0.5)',
          borderColor: focused ? colors.primary : 'rgba(0,0,0,0.08)',
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={focused ? colors.primary : colors.iconMuted}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, { color: colors.inputText, fontSize: fontSize.md }]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={options?.secure && !options?.showValue}
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
      {options?.showToggle && (
        <TouchableOpacity onPress={options.onToggle} style={styles.eyeButton}>
          <Ionicons
            name={options.showValue ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.iconMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

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
              <Ionicons name="person-add" size={30} color={colors.textOnPrimary} />
            </View>

            <Text style={[styles.title, { color: colors.text, fontSize: fontSize.xxl }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSize.md }]}>
              Join Face Finder today
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
            {/* Role Selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.sm }]}>
              I AM A
            </Text>

            <View style={styles.roleRow}>
              {/* User Card */}
              <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale: userCardScale }] }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setRole('user');
                    animateCardPress(userCardScale);
                  }}
                >
                  <View
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: role === 'user' ? colors.primary : 'rgba(255,255,255,0.5)',
                        borderColor: role === 'user' ? colors.primary : 'rgba(0,0,0,0.08)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIconBg,
                        {
                          backgroundColor: role === 'user'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="person"
                        size={24}
                        color={role === 'user' ? colors.textOnPrimary : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleTitle,
                        {
                          color: role === 'user' ? colors.textOnPrimary : colors.text,
                          fontSize: fontSize.lg,
                        },
                      ]}
                    >
                      User
                    </Text>
                    <Text
                      style={[
                        styles.roleDesc,
                        {
                          color: role === 'user'
                            ? 'rgba(255,255,255,0.75)'
                            : colors.textMuted,
                          fontSize: fontSize.xs,
                        },
                      ]}
                    >
                      Find my photos
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Organizer Card */}
              <Animated.View style={[styles.roleCardWrapper, { transform: [{ scale: organizerCardScale }] }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setRole('organizer');
                    animateCardPress(organizerCardScale);
                  }}
                >
                  <View
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: role === 'organizer' ? colors.secondary : 'rgba(255,255,255,0.5)',
                        borderColor: role === 'organizer' ? colors.secondary : 'rgba(0,0,0,0.08)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.roleIconBg,
                        {
                          backgroundColor: role === 'organizer'
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <Ionicons
                        name="calendar"
                        size={24}
                        color={role === 'organizer' ? colors.textOnPrimary : colors.secondary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.roleTitle,
                        {
                          color: role === 'organizer' ? colors.textOnPrimary : colors.text,
                          fontSize: fontSize.lg,
                        },
                      ]}
                    >
                      Organizer
                    </Text>
                    <Text
                      style={[
                        styles.roleDesc,
                        {
                          color: role === 'organizer'
                            ? 'rgba(255,255,255,0.75)'
                            : colors.textMuted,
                          fontSize: fontSize.xs,
                        },
                      ]}
                    >
                      Host events
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: 'rgba(0,0,0,0.08)' }]} />

            {/* Inputs */}
            {renderInput('person-outline', 'Username', username, setUsername, usernameFocused, setUsernameFocused, {
              autoCapitalize: 'none',
            })}

            {renderInput('mail-outline', 'Email address', email, setEmail, emailFocused, setEmailFocused, {
              keyboardType: 'email-address',
              autoCapitalize: 'none',
            })}

            {renderInput(
              'lock-closed-outline',
              'Password',
              password,
              setPassword,
              passwordFocused,
              setPasswordFocused,
              {
                secure: true,
                showToggle: true,
                showValue: showPassword,
                onToggle: () => setShowPassword(!showPassword),
              }
            )}

            {renderInput(
              'shield-checkmark-outline',
              'Confirm Password',
              confirmPassword,
              setConfirmPassword,
              confirmFocused,
              setConfirmFocused,
              {
                secure: true,
                showToggle: true,
                showValue: showConfirmPassword,
                onToggle: () => setShowConfirmPassword(!showConfirmPassword),
              }
            )}

            {/* Sign Up Button */}
            <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
              <TouchableOpacity
                onPress={handleSignUp}
                activeOpacity={0.85}
                disabled={loading}
                style={[
                  styles.signUpButton,
                  {
                    backgroundColor: role === 'organizer' ? colors.secondary : colors.primary,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text
                      style={[
                        styles.signUpText,
                        { color: colors.textOnPrimary, fontSize: fontSize.lg },
                      ]}
                    >
                      Create Account
                    </Text>
                    <View style={[styles.arrowContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={[styles.signInLabel, { color: colors.textMuted, fontSize: fontSize.md }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.signInLink, { color: colors.text, fontSize: fontSize.md }]}>
                Sign In
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
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    letterSpacing: 0.2,
    opacity: 0.8,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleCardWrapper: {
    flex: 1,
  },
  roleCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 130,
    justifyContent: 'center',
  },
  roleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  roleTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  roleDesc: {
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 14,
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
  buttonContainer: {
    marginTop: 8,
  },
  signUpButton: {
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
  signUpText: {
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
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInLabel: {},
  signInLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
