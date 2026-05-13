/**
 * Face Finder — Retrieved Gallery Screen
 * ────────────────────────────────────────
 * Ultra-premium Pinterest-style masonry gallery for retrieved photos.
 * Immersive fullscreen viewer with swipe, zoom, and download.
 * Pure black & white editorial aesthetic.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
  ScrollView, FlatList, Modal, Dimensions, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { mono } from './home/constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COL_GAP = 8;
const SIDE_PAD = 16;
const COL_W = (SCREEN_W - SIDE_PAD * 2 - COL_GAP) / 2;

// Editorial height variations for masonry effect
const HEIGHTS = [220, 280, 200, 320, 240, 300, 260, 210, 290, 250];

interface MatchedPhoto {
  id: string;
  event_id: string;
  image_url: string;
  status: string;
  uploaded_by: string;
  created_at: string | null;
  score: number;
}

/* ── Masonry Photo Card ──────────────────────────────────── */
function MasonryCard({
  photo, index, height, onPress,
}: {
  photo: MatchedPhoto; index: number; height: number; onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      cardStyles.outer,
      { height, opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
    ]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        style={cardStyles.press}
      >
        <Image source={photo.image_url} style={cardStyles.img} contentFit="cover" cachePolicy="disk" transition={200} onLoadEnd={() => setLoaded(true)} />
        {!loaded && <View style={cardStyles.placeholder}><View style={cardStyles.shimmer} /></View>}
        {/* Score badge for high matches */}
        {photo.score >= 0.7 && (
          <View style={cardStyles.scoreBadge}>
            <Ionicons name="sparkles" size={8} color="#000" />
            <Text style={cardStyles.scoreText}>{Math.round(photo.score * 100)}%</Text>
          </View>
        )}
        {/* Bottom gradient */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.4)']} style={cardStyles.grad} />
      </Pressable>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  outer: { marginBottom: COL_GAP, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0E0E0E' },
  press: { flex: 1 },
  img: { width: '100%', height: '100%' },
  placeholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0E0E0E', alignItems: 'center', justifyContent: 'center' },
  shimmer: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },
  scoreBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  scoreText: { fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 0.3 },
  grad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },
});

/* ── Fullscreen Photo Viewer ─────────────────────────────── */
function PhotoViewer({
  visible, photos, initialIndex, onClose,
}: {
  visible: boolean; photos: MatchedPhoto[]; initialIndex: number; onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [visible, initialIndex]);

  const toggleControls = () => {
    const next = !showControls;
    setShowControls(next);
    Animated.timing(controlsOpacity, { toValue: next ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  };

  const handleDownload = async () => {
    if (downloading) return;
    const photo = photos[currentIndex];
    if (!photo) return;

    try {
      setDownloading(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save photos.');
        return;
      }
      const ext = photo.image_url.split('.').pop()?.split('?')[0] || 'jpg';
      const localUri = `${FileSystem.cacheDirectory}facefinder_${photo.id}.${ext}`;
      const dl = await FileSystem.downloadAsync(photo.image_url, localUri);
      await MediaLibrary.saveToLibraryAsync(dl.uri);
      Alert.alert('Saved', 'Photo saved to your gallery.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save photo.');
    } finally {
      setDownloading(false);
    }
  };

  const onViewableChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index);
  }).current;

  const renderItem = ({ item }: { item: MatchedPhoto }) => (
    <View style={vStyles.itemWrap}>
      <ScrollView
        maximumZoomScale={4} minimumZoomScale={1}
        showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}
        contentContainerStyle={vStyles.zoomContainer} centerContent
      >
        <Pressable onPress={toggleControls} style={vStyles.imgPress}>
          <Image source={item.image_url} style={vStyles.img} contentFit="contain" cachePolicy="disk" />
        </Pressable>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={vStyles.root}>
        <StatusBar style="light" />
        {/* Header */}
        <Animated.View style={[vStyles.header, { opacity: controlsOpacity }]}>
          <Pressable style={vStyles.headerBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color="#FFF" />
          </Pressable>
          <Text style={vStyles.counter}>{currentIndex + 1} / {photos.length}</Text>
          <View style={vStyles.headerBtn} />
        </Animated.View>

        {/* Swipeable gallery */}
        <FlatList
          data={photos}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onViewableItemsChanged={onViewableChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />

        {/* Bottom controls */}
        <Animated.View style={[vStyles.bottomBar, { opacity: controlsOpacity }]}>
          <Pressable style={vStyles.actionBtn} onPress={handleDownload}>
            {downloading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFF" />
                <Text style={vStyles.actionText}>Save</Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const vStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  counter: { fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 1 },
  itemWrap: { width: SCREEN_W, height: SCREEN_H },
  zoomContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imgPress: { width: SCREEN_W, height: SCREEN_H },
  img: { width: '100%', height: '100%' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
});

/* ══════════════════════════════════════════════════════════ */
/*  MAIN SCREEN                                              */
/* ══════════════════════════════════════════════════════════ */
export default function RetrievedGalleryScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const photos: MatchedPhoto[] = route.params?.photos || [];
  const eventName: string = route.params?.eventName || 'Event';

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  // Split photos into 2 columns for masonry
  const col1: { photo: MatchedPhoto; globalIdx: number; height: number }[] = [];
  const col2: { photo: MatchedPhoto; globalIdx: number; height: number }[] = [];
  let h1 = 0, h2 = 0;

  photos.forEach((photo, i) => {
    const height = HEIGHTS[i % HEIGHTS.length];
    if (h1 <= h2) {
      col1.push({ photo, globalIdx: i, height });
      h1 += height + COL_GAP;
    } else {
      col2.push({ photo, globalIdx: i, height });
      h2 += height + COL_GAP;
    }
  });

  return (
    <View style={[gs.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(255,255,255,0.015)', 'transparent', 'rgba(255,255,255,0.01)', 'transparent']} locations={[0, 0.3, 0.7, 1]} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <Animated.View style={[gs.header, { opacity: headerOpacity, transform: [{ translateY: headerSlide }] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={gs.headerBack}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>
        <View style={gs.headerCenter}>
          <Text style={gs.headerLabel}>YOUR MOMENTS</Text>
          <Text style={gs.headerTitle}>{eventName}</Text>
        </View>
        <View style={gs.headerBadge}>
          <Text style={gs.headerBadgeText}>{photos.length}</Text>
        </View>
      </Animated.View>

      {/* Subtitle */}
      <View style={gs.subtitleRow}>
        <View style={gs.subtitleLine} />
        <Text style={gs.subtitleText}>CURATED FOR YOU</Text>
        <View style={gs.subtitleLine} />
      </View>

      {/* Masonry Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={gs.masonryScroll}>
        <View style={gs.masonryWrap}>
          <View style={gs.masonryCol}>
            {col1.map(({ photo, globalIdx, height }) => (
              <MasonryCard key={photo.id} photo={photo} index={globalIdx} height={height} onPress={() => openViewer(globalIdx)} />
            ))}
          </View>
          <View style={gs.masonryCol}>
            {col2.map(({ photo, globalIdx, height }) => (
              <MasonryCard key={photo.id} photo={photo} index={globalIdx} height={height} onPress={() => openViewer(globalIdx)} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Viewer */}
      <PhotoViewer visible={viewerVisible} photos={photos} initialIndex={viewerIndex} onClose={() => setViewerVisible(false)} />
    </View>
  );
}

const gs = StyleSheet.create({
  root: { flex: 1, backgroundColor: mono.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
  },
  headerBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: mono.border, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', color: mono.textDim, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: mono.border, backgroundColor: mono.card },
  headerBadgeText: { fontSize: 13, fontWeight: '800', color: mono.textSecondary, letterSpacing: 0.5 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 12 },
  subtitleLine: { flex: 1, height: 1, backgroundColor: mono.border },
  subtitleText: { fontSize: 10, fontWeight: '700', color: mono.textDim, letterSpacing: 2 },
  masonryScroll: { paddingBottom: 120, paddingTop: 4 },
  masonryWrap: { flexDirection: 'row', paddingHorizontal: SIDE_PAD, gap: COL_GAP },
  masonryCol: { flex: 1 },
});
