/**
 * PasswordProtectionSection — Reusable Component
 * ─────────────────────────────────────────────────
 * • Toggle to enable/disable password protection
 * • Animated reveal of password + confirm fields
 * • secureTextEntry with show/hide toggle
 * • Inline validation (min 6 chars, must match)
 * • Premium B&W dark-mode design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/* ── Palette (matches existing app palette) ────────────── */
const C = {
  bg: '#000000',
  surface: '#0C0C0C',
  card: '#111111',
  cardBorder: '#1F1F1F',
  inputBg: '#0E0E0E',
  inputBorder: '#1C1C1C',
  inputFocus: '#3A3A3A',
  white: '#FFFFFF',
  offWhite: '#E8E8E8',
  gray1: '#AAAAAA',
  gray2: '#666666',
  gray3: '#333333',
  gray4: '#222222',
  accent: '#FFFFFF',
  error: '#FF453A',
  success: '#30D158',
  pill: 'rgba(255,255,255,0.06)',
  pillBorder: 'rgba(255,255,255,0.1)',
};

/* ── Types ──────────────────────────────────────────────── */
export interface PasswordProtectionData {
  enabled: boolean;
  password: string;
  confirmPassword: string;
}

export interface PasswordValidation {
  isValid: boolean;
  passwordError: string | null;
  confirmError: string | null;
}

interface Props {
  data: PasswordProtectionData;
  onChange: (data: PasswordProtectionData) => void;
}

/* ── Validation Helper ─────────────────────────────────── */
export function validatePassword(data: PasswordProtectionData): PasswordValidation {
  if (!data.enabled) {
    return { isValid: true, passwordError: null, confirmError: null };
  }

  let passwordError: string | null = null;
  let confirmError: string | null = null;

  if (data.password.length === 0) {
    passwordError = 'Password is required';
  } else if (data.password.length < 6) {
    passwordError = 'Must be at least 6 characters';
  }

  if (data.confirmPassword.length === 0) {
    confirmError = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    confirmError = 'Passwords do not match';
  }

  return {
    isValid: !passwordError && !confirmError,
    passwordError,
    confirmError,
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function PasswordProtectionSection({ data, onChange }: Props) {
  /* ── Local UI state ── */
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  /* ── Animations ── */
  const expandAnim = useRef(new Animated.Value(data.enabled ? 1 : 0)).current;
  const fieldsOpacity = useRef(new Animated.Value(data.enabled ? 1 : 0)).current;
  const fieldsTranslateY = useRef(new Animated.Value(data.enabled ? 0 : -12)).current;
  const toggleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (data.enabled) {
      // Expand first, then fade in fields
      Animated.sequence([
        Animated.timing(expandAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: false, // height can't use native driver
        }),
        Animated.parallel([
          Animated.timing(fieldsOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(fieldsTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Subtle glow pulse on toggle
      Animated.sequence([
        Animated.timing(toggleGlow, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.timing(toggleGlow, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    } else {
      // Fade out fields first, then collapse
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fieldsOpacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(fieldsTranslateY, {
            toValue: -12,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [data.enabled]);

  /* ── Derived validation ── */
  const validation = validatePassword(data);

  const showPwError = pwTouched && validation.passwordError;
  const showConfirmError = confirmTouched && validation.confirmError;

  /* ── Password strength indicator ── */
  const getStrength = useCallback((pw: string) => {
    if (pw.length === 0) return { level: 0, label: '', color: C.gray3 };
    if (pw.length < 6) return { level: 1, label: 'Too short', color: C.error };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 2, label: 'Weak', color: '#FF9F0A' };
    if (score <= 2) return { level: 3, label: 'Fair', color: '#FFD60A' };
    return { level: 4, label: 'Strong', color: C.success };
  }, []);

  const strength = getStrength(data.password);

  /* ── Handlers ── */
  const handleToggle = (value: boolean) => {
    if (!value) {
      // Reset fields when disabling
      setPwTouched(false);
      setConfirmTouched(false);
      onChange({ enabled: false, password: '', confirmPassword: '' });
    } else {
      onChange({ ...data, enabled: true });
    }
  };

  /* ── Interpolated height ── */
  const fieldsHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240], // approximate collapsed→expanded
  });

  const toggleBorderColor = toggleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [C.cardBorder, 'rgba(255,255,255,0.15)'],
  });

  return (
    <View style={styles.container}>
      {/* ── Toggle Row ── */}
      <Animated.View style={[styles.toggleRow, { borderColor: toggleBorderColor }]}>
        <View style={styles.toggleLeft}>
          <View style={[styles.toggleIconWrap, data.enabled && styles.toggleIconActive]}>
            <Ionicons
              name={data.enabled ? 'lock-closed' : 'lock-open-outline'}
              size={16}
              color={data.enabled ? C.white : C.gray2}
            />
          </View>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>Password Protect</Text>
            <Text style={styles.toggleSubtitle}>
              {data.enabled ? 'Guests need password to join' : 'Anyone can access this event'}
            </Text>
          </View>
        </View>
        <Switch
          value={data.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: C.gray3, true: 'rgba(255,255,255,0.25)' }}
          thumbColor={data.enabled ? C.white : C.gray1}
          ios_backgroundColor={C.gray3}
        />
      </Animated.View>

      {/* ── Animated Fields Container ── */}
      <Animated.View
        style={[
          styles.fieldsContainer,
          {
            maxHeight: fieldsHeight,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: fieldsOpacity,
            transform: [{ translateY: fieldsTranslateY }],
          }}
        >
          {/* ── Password Field ── */}
          <View style={styles.fieldWrapper}>
            <View
              style={[
                styles.inputWrap,
                pwFocused && styles.inputWrapFocused,
                showPwError && styles.inputWrapError,
              ]}
            >
              <Ionicons
                name="key-outline"
                size={16}
                color={showPwError ? C.error : pwFocused ? C.offWhite : C.gray2}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor={C.gray3}
                value={data.password}
                onChangeText={(text) => onChange({ ...data, password: text })}
                onFocus={() => setPwFocused(true)}
                onBlur={() => {
                  setPwFocused(false);
                  setPwTouched(true);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={64}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.gray2}
                />
              </TouchableOpacity>
            </View>

            {/* Password strength bar */}
            {data.password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBarTrack}>
                  {[1, 2, 3, 4].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.strengthBarSegment,
                        {
                          backgroundColor:
                            seg <= strength.level ? strength.color : C.gray4,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            {/* Password error */}
            {showPwError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={12} color={C.error} />
                <Text style={styles.errorText}>{validation.passwordError}</Text>
              </View>
            )}
          </View>

          {/* ── Confirm Password Field ── */}
          <View style={styles.fieldWrapper}>
            <View
              style={[
                styles.inputWrap,
                confirmFocused && styles.inputWrapFocused,
                showConfirmError && styles.inputWrapError,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={
                  showConfirmError
                    ? C.error
                    : data.confirmPassword.length > 0 &&
                      data.password === data.confirmPassword
                    ? C.success
                    : confirmFocused
                    ? C.offWhite
                    : C.gray2
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Confirm password"
                placeholderTextColor={C.gray3}
                value={data.confirmPassword}
                onChangeText={(text) => onChange({ ...data, confirmPassword: text })}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => {
                  setConfirmFocused(false);
                  setConfirmTouched(true);
                }}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={64}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.gray2}
                />
              </TouchableOpacity>
            </View>

            {/* Match indicator */}
            {data.confirmPassword.length > 0 &&
              !showConfirmError &&
              data.password === data.confirmPassword && (
                <View style={styles.matchRow}>
                  <Ionicons name="checkmark-circle" size={12} color={C.success} />
                  <Text style={[styles.matchText, { color: C.success }]}>
                    Passwords match
                  </Text>
                </View>
              )}

            {/* Confirm error */}
            {showConfirmError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={12} color={C.error} />
                <Text style={styles.errorText}>{validation.confirmError}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  /* ── Toggle Row ── */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.gray3,
  },
  toggleIconActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 11,
    color: C.gray2,
    lineHeight: 15,
  },

  /* ── Fields Container ── */
  fieldsContainer: {
    marginTop: 0,
  },

  fieldWrapper: {
    marginTop: 12,
  },

  /* ── Input ── */
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapFocused: {
    borderColor: C.inputFocus,
    backgroundColor: '#121212',
  },
  inputWrapError: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.04)',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: C.white,
    letterSpacing: 0.1,
  },

  /* ── Strength Bar ── */
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  strengthBarTrack: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBarSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    minWidth: 52,
    textAlign: 'right',
  },

  /* ── Error / Match ── */
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 11,
    color: C.error,
    fontWeight: '500',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  matchText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
