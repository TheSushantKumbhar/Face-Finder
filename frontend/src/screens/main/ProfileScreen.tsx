import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import {
  checkSelfieStatusApi,
  updateProfileApi,
  SelfieStatusResponse,
} from '../../services/api';
import AvatarSelector, { renderAvatar } from '../../components/AvatarSelector';

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
  successGreen: '#34C759',
  errorRed: '#FF453A',
};

const { width: SCREEN_W } = Dimensions.get('window');
const SELFIE_THUMB = (SCREEN_W - 80) / 3;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const {
    username,
    email,
    profilePhotoUrl,
    hasSelfies,
    logout,
    setUsername: setAuthUsername,
    setProfilePhotoUrl,
    setHasSelfies,
  } = useAuth();

  const [editUsername, setEditUsername] = useState(username);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState('geo-diamond');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selfieData, setSelfieData] = useState<SelfieStatusResponse | null>(null);
  const [selfieLoading, setSelfieLoading] = useState(true);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const selfieOpacity = useRef(new Animated.Value(0)).current;
  const selfieSlide = useRef(new Animated.Value(30)).current;
  const logoutOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(selfieOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(selfieSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(logoutOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Reload selfies every time the profile screen is focused
  // (e.g., after returning from SelfieUpload screen)
  useFocusEffect(
    useCallback(() => {
      loadSelfies();
    }, [])
  );

  const loadSelfies = async () => {
    setSelfieLoading(true);
    try {
      const res = await checkSelfieStatusApi();
      setSelfieData(res);
      setHasSelfies(res.has_selfies);
    } catch {
      setSelfieData(null);
    } finally {
      setSelfieLoading(false);
    }
  };

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [toastOpacity]);

  const pickProfilePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Needed', 'Gallery access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
      setShowAvatarPicker(false);
      handleSavePhoto(result.assets[0].uri);
    }
  };

  const handleSavePhoto = async (uri: string) => {
    setSaving(true);
    try {
      const res = await updateProfileApi(undefined, uri);
      setProfilePhotoUrl(res.profile_photo_url);
      setLocalPhotoUri(null);
      showToast('Photo updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    const trimmed = editUsername.trim();
    if (trimmed === username) {
      setIsEditing(false);
      return;
    }
    if (trimmed.length < 2) {
      Alert.alert('Invalid', 'Username must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfileApi(trimmed);
      setAuthUsername(res.username);
      setIsEditing(false);
      showToast('Username updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const displayPhoto = localPhotoUri || profilePhotoUrl;

  const selfieImages = selfieData?.selfies;
  const hasSelfieImages = selfieData?.has_selfies;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={18} color={bw.successGreen} />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Animated.View
            style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}
          >
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSub}>Manage your account</Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            style={[styles.profileCard, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}
          >
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={pickProfilePhoto}
              activeOpacity={0.8}
            >
              {displayPhoto ? (
                <Image source={displayPhoto} style={styles.avatarImage} contentFit="cover" cachePolicy="disk" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  {renderAvatar(selectedAvatarId, 100)}
                </View>
              )}
              <View style={styles.avatarBadge}>
                {saving ? (
                  <ActivityIndicator size={12} color={bw.black} />
                ) : (
                  <Ionicons name="camera" size={14} color={bw.black} />
                )}
              </View>
            </TouchableOpacity>

            {/* Avatar selector toggle (only if no photo) */}
            {!displayPhoto && (
              <TouchableOpacity
                style={styles.avatarToggle}
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                activeOpacity={0.7}
              >
                <Ionicons name="color-palette-outline" size={14} color={bw.textSecondary} />
                <Text style={styles.avatarToggleText}>
                  {showAvatarPicker ? 'Hide Avatars' : 'Choose Avatar'}
                </Text>
              </TouchableOpacity>
            )}

            <AvatarSelector
              selectedId={selectedAvatarId}
              onSelect={(id) => setSelectedAvatarId(id)}
              visible={showAvatarPicker && !displayPhoto}
            />

            {/* Divider */}
            <View style={styles.divider} />

            {/* Username Field */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name="person-outline" size={18} color={bw.textSecondary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                {isEditing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.editInput}
                      value={editUsername}
                      onChangeText={setEditUsername}
                      autoFocus
                      selectionColor={bw.accent}
                      maxLength={30}
                      placeholderTextColor={bw.textMuted}
                    />
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveUsername}
                      activeOpacity={0.8}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size={14} color={bw.black} />
                      ) : (
                        <Ionicons name="checkmark" size={16} color={bw.black} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => { setIsEditing(false); setEditUsername(username); }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color={bw.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.editableValue}
                    onPress={() => setIsEditing(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fieldValue}>{username || 'Not set'}</Text>
                    <Ionicons name="pencil-outline" size={14} color={bw.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Email Field (read-only) */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name="mail-outline" size={18} color={bw.textSecondary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <Text style={styles.fieldValue}>{email || 'Not set'}</Text>
              </View>
              <View style={styles.readOnlyBadge}>
                <Ionicons name="lock-closed" size={10} color={bw.textMuted} />
              </View>
            </View>
          </Animated.View>

          {/* Selfie Section */}
          <Animated.View
            style={[
              styles.sectionCard,
              { opacity: selfieOpacity, transform: [{ translateY: selfieSlide }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={20} color={bw.accent} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Identity Verification</Text>
                <Text style={styles.sectionSub}>Selfie-based face recognition</Text>
              </View>
              {hasSelfieImages && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={bw.successGreen} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.selfieDivider} />

            {selfieLoading ? (
              <View style={styles.selfieLoading}>
                <ActivityIndicator size="small" color={bw.textMuted} />
                <Text style={styles.selfieLoadingText}>Loading selfies...</Text>
              </View>
            ) : hasSelfieImages && selfieImages ? (
              <View>
                <View style={styles.selfieGrid}>
                  {[
                    { url: selfieImages.front_url, label: 'Front' },
                    { url: selfieImages.left_url, label: 'Left' },
                    { url: selfieImages.right_url, label: 'Right' },
                  ].map((item) => (
                    <View key={item.label} style={styles.selfieThumbWrap}>
                      {item.url ? (
                        <Image source={item.url} style={styles.selfieThumb} contentFit="cover" cachePolicy="none" />
                      ) : (
                        <View style={[styles.selfieThumb, styles.selfieThumbEmpty]}>
                          <Ionicons name="image-outline" size={22} color={bw.textMuted} />
                        </View>
                      )}
                      <Text style={styles.selfieLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.updateSelfieCta}
                  onPress={() => navigation.navigate('SelfieUpload')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-outline" size={16} color={bw.textPrimary} />
                  <Text style={styles.updateSelfieCtaText}>Update Selfies</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.selfieEmpty}>
                <View style={styles.selfieEmptyIcon}>
                  <Ionicons name="scan-outline" size={32} color={bw.textMuted} />
                </View>
                <Text style={styles.selfieEmptyTitle}>No selfies uploaded</Text>
                <Text style={styles.selfieEmptyDesc}>
                  Upload 3 face angles to enable{'\n'}AI-powered recognition
                </Text>
                <TouchableOpacity
                  style={styles.selfieCta}
                  onPress={() => navigation.navigate('SelfieUpload')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera-outline" size={18} color={bw.black} />
                  <Text style={styles.selfieCtaText}>Upload Selfies</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Logout */}
          <Animated.View style={[styles.logoutWrap, { opacity: logoutOpacity }]}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={logout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={bw.errorRed} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Face Finder v1.0</Text>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bw.black },
  scrollContent: { paddingBottom: 20 },

  /* Toast */
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 44,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52,199,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  toastText: { fontSize: 14, fontWeight: '600', color: bw.successGreen },

  /* Header */
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 50,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: bw.textPrimary,
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 14,
    color: bw.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  /* Profile Card */
  profileCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: bw.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: bw.border,
    padding: 28,
    alignItems: 'center',
  },

  /* Avatar */
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: bw.borderLight,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: bw.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: bw.card,
  },
  avatarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  avatarToggleText: {
    fontSize: 12,
    color: bw.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  /* Divider */
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: bw.border,
    marginVertical: 20,
  },

  /* Field rows */
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  fieldIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: bw.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fieldContent: { flex: 1 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: bw.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
    color: bw.textPrimary,
    letterSpacing: -0.2,
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Edit mode */
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: bw.textPrimary,
    borderBottomWidth: 1.5,
    borderBottomColor: bw.accent,
    paddingVertical: 4,
    letterSpacing: -0.2,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: bw.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: bw.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Selfie Section */
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: bw.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: bw.border,
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: bw.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: bw.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: bw.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.2)',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: bw.successGreen,
    letterSpacing: 0.3,
  },
  selfieDivider: {
    height: 1,
    backgroundColor: bw.border,
    marginVertical: 18,
  },

  /* Selfie Grid */
  selfieGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  selfieThumbWrap: { alignItems: 'center' },
  selfieThumb: {
    width: SELFIE_THUMB,
    height: SELFIE_THUMB,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: bw.borderLight,
  },
  selfieThumbEmpty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: bw.textMuted,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* Selfie Loading */
  selfieLoading: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  selfieLoadingText: {
    fontSize: 13,
    color: bw.textMuted,
  },

  /* Selfie Empty */
  selfieEmpty: { alignItems: 'center', paddingVertical: 8 },
  selfieEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: bw.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  selfieEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: bw.textPrimary,
    marginBottom: 6,
  },
  selfieEmptyDesc: {
    fontSize: 13,
    color: bw.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  selfieCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: bw.accent,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 100,
  },
  selfieCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: bw.black,
    letterSpacing: -0.2,
  },

  /* Update Selfie CTA */
  updateSelfieCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: bw.borderLight,
  },
  updateSelfieCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: bw.textPrimary,
    letterSpacing: -0.1,
  },

  /* Logout */
  logoutWrap: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,69,58,0.08)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.15)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: bw.errorRed,
    letterSpacing: -0.2,
  },
  versionText: {
    fontSize: 12,
    color: bw.textMuted,
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
