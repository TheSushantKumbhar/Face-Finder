/**
 * Face Finder — Selfie Upload Screen
 * ────────────────────────────────────
 * Premium full-screen overlay for multi-angle selfie verification.
 * Appears after login when the user hasn't uploaded selfies yet.
 * B&W aesthetic matching the app's design language.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadSelfiesApi } from '../../services/api';

/* ── Local B&W palette ────────────────────────────────────── */
const bw = {
  black: '#000000',
  surface: '#0A0A0A',
  card: '#111111',
  cardHover: '#161616',
  border: '#1E1E1E',
  borderLight: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#5C5C5C',
  accent: '#FFFFFF',
  accentMuted: '#888888',
  successGreen: '#34C759',
  errorRed: '#FF453A',
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* eslint-disable @typescript-eslint/no-require-imports */
const faceIllustration = require('../../../assets/face-detection-illustration.png');

type SelfieType = 'front' | 'left' | 'right';

interface SelfieSlot {
  type: SelfieType;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SELFIE_SLOTS: SelfieSlot[] = [
  { type: 'front', label: 'Front', subtitle: 'Look straight ahead', icon: 'person-outline' },
  { type: 'left', label: 'Left', subtitle: 'Turn head left', icon: 'arrow-back-outline' },
  { type: 'right', label: 'Right', subtitle: 'Turn head right', icon: 'arrow-forward-outline' },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function SelfieUploadScreen({ onComplete, onSkip }: Props) {
  const { setHasSelfies, setSelfieChecked } = useAuth();

  /* ── State ───────────────────────────────── */
  const [images, setImages] = useState<Record<SelfieType, string | null>>({
    front: null,
    left: null,
    right: null,
  });
  const [activeStep, setActiveStep] = useState<SelfieType>('front');
  const [uploading, setUploading] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const allSelected = images.front && images.left && images.right;
  const completedCount = [images.front, images.left, images.right].filter(Boolean).length;

  /* ── Animations ──────────────────────────── */
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(0.85)).current;
  const illustrationOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(20)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const sourcePickerSlide = useRef(new Animated.Value(300)).current;
  const sourcePickerOpacity = useRef(new Animated.Value(0)).current;

  // Per-card pop-in animations
  const cardScales = useRef(SELFIE_SLOTS.map(() => new Animated.Value(0.8))).current;
  const cardOpacities = useRef(SELFIE_SLOTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(100, [
      // Fade in overlay
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Illustration
      Animated.parallel([
        Animated.spring(illustrationScale, { toValue: 1, friction: 8, useNativeDriver: true }),
        Animated.timing(illustrationOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Title / subtitle
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(contentSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]),
      // Cards
      Animated.parallel([
        Animated.timing(cardsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardsSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]),
      // Individual cards stagger
      ...SELFIE_SLOTS.map((_, i) =>
        Animated.parallel([
          Animated.spring(cardScales[i], { toValue: 1, friction: 7, useNativeDriver: true }),
          Animated.timing(cardOpacities[i], { toValue: 1, duration: 300, useNativeDriver: true }),
        ])
      ),
      // Buttons
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(buttonSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  // Progress bar animation
  useEffect(() => {
    Animated.spring(progressWidth, {
      toValue: completedCount / 3,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [completedCount]);

  // Source picker show/hide
  useEffect(() => {
    if (showSourcePicker) {
      Animated.parallel([
        Animated.spring(sourcePickerSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.timing(sourcePickerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sourcePickerSlide, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(sourcePickerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [showSourcePicker]);

  /* ── Image picking ───────────────────────── */
  const pickFromCamera = useCallback(async () => {
    setShowSourcePicker(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Camera access is required to take selfies.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  }, [activeStep]);

  const pickFromGallery = useCallback(async () => {
    setShowSourcePicker(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Gallery access is required to select selfies.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  }, [activeStep]);

  const handleImageSelected = useCallback((uri: string) => {
    setImages(prev => ({ ...prev, [activeStep]: uri }));

    // Auto-advance to next empty slot
    const order: SelfieType[] = ['front', 'left', 'right'];
    const currentIdx = order.indexOf(activeStep);
    for (let i = 1; i <= 3; i++) {
      const nextIdx = (currentIdx + i) % 3;
      const nextType = order[nextIdx];
      if (!images[nextType] && nextType !== activeStep) {
        setTimeout(() => setActiveStep(nextType), 300);
        return;
      }
    }
  }, [activeStep, images]);

  const handleSlotPress = useCallback((type: SelfieType) => {
    setActiveStep(type);
    setShowSourcePicker(true);
  }, []);

  /* ── Upload ──────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!images.front || !images.left || !images.right) return;

    setUploading(true);
    try {
      await uploadSelfiesApi(images.front, images.left, images.right);
      setHasSelfies(true);
      setSelfieChecked(true);
      onComplete();
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [images, onComplete, setHasSelfies, setSelfieChecked]);

  /* ── Render ──────────────────────────────── */
  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity }]}>
      <StatusBar style="light" />

      {/* ── Close Button ── */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onSkip}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <View style={styles.closeBtnInner}>
          <Ionicons name="close" size={20} color={bw.textSecondary} />
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Illustration ── */}
        <Animated.View
          style={[
            styles.illustrationWrap,
            {
              opacity: illustrationOpacity,
              transform: [{ scale: illustrationScale }],
            },
          ]}
        >
          <Image
            source={faceIllustration}
            style={styles.illustration}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ── Title ── */}
        <Animated.View
          style={[
            styles.titleArea,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Verify Your Identity</Text>
          <Text style={styles.subtitle}>
            Upload 3 angles of your face so our AI can{'\n'}recognize you in event photos
          </Text>
        </Animated.View>

        {/* ── Progress Bar ── */}
        <Animated.View style={[styles.progressContainer, { opacity: contentOpacity }]}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{completedCount} of 3 photos</Text>
        </Animated.View>

        {/* ── Selfie Cards ── */}
        <Animated.View
          style={[
            styles.cardsContainer,
            {
              opacity: cardsOpacity,
              transform: [{ translateY: cardsSlide }],
            },
          ]}
        >
          {SELFIE_SLOTS.map((slot, i) => {
            const isActive = activeStep === slot.type;
            const hasImage = !!images[slot.type];

            return (
              <Animated.View
                key={slot.type}
                style={[
                  { opacity: cardOpacities[i], transform: [{ scale: cardScales[i] }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.selfieCard,
                    isActive && styles.selfieCardActive,
                    hasImage && styles.selfieCardCompleted,
                  ]}
                  onPress={() => handleSlotPress(slot.type)}
                  activeOpacity={0.7}
                >
                  {hasImage ? (
                    <View style={styles.previewContainer}>
                      <Image
                        source={{ uri: images[slot.type]! }}
                        style={styles.previewImage}
                      />
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={bw.black} />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.placeholderCircle}>
                      <Ionicons
                        name={slot.icon}
                        size={24}
                        color={isActive ? bw.accent : bw.textMuted}
                      />
                    </View>
                  )}
                  <Text style={[styles.cardLabel, hasImage && styles.cardLabelCompleted]}>
                    {slot.label}
                  </Text>
                  <Text style={styles.cardSubtitle}>{slot.subtitle}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* ── Action Buttons ── */}
        <Animated.View
          style={[
            styles.actionArea,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonSlide }],
            },
          ]}
        >
          {/* Camera + Gallery Row */}
          <View style={styles.sourceRow}>
            <TouchableOpacity
              style={styles.sourceBtn}
              onPress={pickFromCamera}
              activeOpacity={0.7}
            >
              <View style={styles.sourceBtnIcon}>
                <Ionicons name="camera-outline" size={22} color={bw.accent} />
              </View>
              <Text style={styles.sourceBtnText}>Use Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceBtn}
              onPress={pickFromGallery}
              activeOpacity={0.7}
            >
              <View style={styles.sourceBtnIcon}>
                <Ionicons name="images-outline" size={22} color={bw.accent} />
              </View>
              <Text style={styles.sourceBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !allSelected && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!allSelected || uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={bw.black} />
            ) : (
              <View style={styles.submitBtnInner}>
                <Ionicons name="cloud-upload-outline" size={20} color={bw.black} style={{ marginRight: 10 }} />
                <Text style={styles.submitBtnText}>Submit Selfies</Text>
                <View style={{ flex: 1 }} />
                <View style={styles.submitArrow}>
                  <Ionicons name="arrow-forward" size={18} color={bw.black} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Source Picker Overlay (for card tap) ── */}
      {showSourcePicker && (
        <TouchableOpacity
          style={styles.sourceOverlay}
          activeOpacity={1}
          onPress={() => setShowSourcePicker(false)}
        >
          <Animated.View
            style={[
              styles.sourceSheet,
              {
                opacity: sourcePickerOpacity,
                transform: [{ translateY: sourcePickerSlide }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Select {SELFIE_SLOTS.find(s => s.type === activeStep)?.label} Photo
            </Text>
            <Text style={styles.sheetSubtitle}>
              {SELFIE_SLOTS.find(s => s.type === activeStep)?.subtitle}
            </Text>

            <TouchableOpacity style={styles.sheetOption} onPress={pickFromCamera} activeOpacity={0.7}>
              <View style={styles.sheetOptionIcon}>
                <Ionicons name="camera" size={22} color={bw.accent} />
              </View>
              <View>
                <Text style={styles.sheetOptionTitle}>Take a Photo</Text>
                <Text style={styles.sheetOptionSub}>Use your device camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={bw.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={pickFromGallery} activeOpacity={0.7}>
              <View style={styles.sheetOptionIcon}>
                <Ionicons name="images" size={22} color={bw.accent} />
              </View>
              <View>
                <Text style={styles.sheetOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.sheetOptionSub}>Select an existing photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={bw.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setShowSourcePicker(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const CARD_SIZE = (SCREEN_W - 72) / 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: bw.black,
    zIndex: 100,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },

  /* ── Close ── */
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    right: 20,
    zIndex: 110,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: bw.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Illustration ── */
  illustrationWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  illustration: {
    width: SCREEN_W * 0.52,
    height: SCREEN_W * 0.52,
  },

  /* ── Title ── */
  titleArea: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: bw.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.1,
  },

  /* ── Progress ── */
  progressContainer: {
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  progressTrack: {
    height: 4,
    backgroundColor: bw.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: bw.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: bw.textMuted,
    textAlign: 'right',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  /* ── Selfie Cards ── */
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  selfieCard: {
    width: CARD_SIZE,
    alignItems: 'center',
    backgroundColor: bw.card,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: bw.border,
  },
  selfieCardActive: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: bw.cardHover,
  },
  selfieCardCompleted: {
    borderColor: 'rgba(52,199,89,0.3)',
    backgroundColor: 'rgba(52,199,89,0.05)',
  },

  /* ── Placeholder ── */
  placeholderCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: bw.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  /* ── Preview ── */
  previewContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: bw.successGreen,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: bw.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: bw.card,
  },

  /* ── Card Text ── */
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: bw.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cardLabelCompleted: {
    color: bw.successGreen,
  },
  cardSubtitle: {
    fontSize: 10,
    color: bw.textMuted,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  /* ── Source Buttons ── */
  actionArea: {
    paddingHorizontal: 24,
    gap: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: bw.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: bw.border,
  },
  sourceBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: bw.textPrimary,
    letterSpacing: -0.2,
  },

  /* ── Submit ── */
  submitBtn: {
    backgroundColor: bw.accent,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: bw.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnDisabled: {
    backgroundColor: bw.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },
  submitArrow: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Source Picker Sheet ── */
  sourceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  sourceSheet: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: bw.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: bw.borderLight,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: bw.textMuted,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: bw.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: bw.border,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: bw.textPrimary,
    marginBottom: 2,
  },
  sheetOptionSub: {
    fontSize: 12,
    color: bw.textMuted,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: bw.border,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: bw.textSecondary,
  },
});
