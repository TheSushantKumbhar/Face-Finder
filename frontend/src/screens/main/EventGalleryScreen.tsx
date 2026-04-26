/**
 * Face Finder — Event Gallery Screen
 * ──────────────────────────────────
 * A premium, black-and-white, highly animated photo gallery.
 * Grid layout with full-screen swipeable preview.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { getEventPhotosApi, PhotoResponse } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const THUMB_SIZE = (SCREEN_WIDTH - (COLUMN_COUNT + 1) * SPACING) / COLUMN_COUNT;

/* ── Palette ─────────────────────────────────────────────── */
const C = {
  bg: '#000000',
  surface: '#0A0A0A',
  card: '#121212',
  cardBorder: '#1F1F1F',
  white: '#FFFFFF',
  offWhite: '#EAEAEA',
  gray1: '#A0A0A0',
  gray2: '#555555',
  gray3: '#333333',
  gray4: '#1A1A1A',
  accent: '#FFFFFF',
  selectionOverlay: 'rgba(255,255,255,0.2)',
};

export default function EventGalleryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { eventId, eventName } = route.params || { eventId: '', eventName: 'Gallery' };

  const [photos, setPhotos] = useState<PhotoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(new Set());

  // Full-screen viewer
  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await getEventPhotosApi(eventId);
      setPhotos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    fetchPhotos();
  }, [fetchPhotos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  const handlePhotoPress = (index: number, photoId: string) => {
    if (isSelectionMode) {
      toggleSelection(photoId);
    } else {
      setInitialIndex(index);
      setViewerVisible(true);
    }
  };

  const handlePhotoLongPress = (photoId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleSelection(photoId);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setIsSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  /* ── Renderers ───────────────────────────────────────────── */

  const renderPhoto = ({ item, index }: { item: PhotoResponse; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    const isProcessing = (item.status === 'pending' || item.status === 'processing') && !loadedPhotos.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handlePhotoPress(index, item.id)}
        onLongPress={() => handlePhotoLongPress(item.id)}
        style={[styles.thumbnailWrap, { marginRight: (index + 1) % COLUMN_COUNT === 0 ? 0 : SPACING }]}
      >
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.thumbnail}
          onLoadEnd={() => setLoadedPhotos(prev => new Set(prev).add(item.id))}
        />
        
        {/* Processing Blur Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color={C.white} />
          </View>
        )}

        {/* Selection Overlay */}
        {isSelectionMode && (
          <View style={styles.selectionCheckmarkWrap}>
            <View style={[styles.selectionCircle, isSelected && styles.selectionCircleActive]}>
              {isSelected && <Ionicons name="checkmark" size={14} color={C.bg} />}
            </View>
          </View>
        )}
        {isSelected && <View style={styles.thumbnailSelectedDim} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity style={styles.headerAction} onPress={clearSelection}>
              <Ionicons name="close" size={24} color={C.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>{selectedIds.size} Selected</Text>
            </View>
            {/* Placeholder for future action (e.g., delete) */}
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="trash-outline" size={22} color={C.white} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.headerAction} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={C.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Uploaded Photos</Text>
              <Text style={styles.headerSubtitle}>{photos.length} Photos • {eventName}</Text>
            </View>
            <View style={styles.headerAction} />
          </>
        )}
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={C.white} />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.centerWrap}>
            <Ionicons name="images-outline" size={48} color={C.gray3} />
            <Text style={styles.emptyText}>No photos yet.</Text>
            <Text style={styles.emptySubtext}>Upload some photos to see them here.</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.id}
            renderItem={renderPhoto}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.white} />
            }
          />
        )}
      </Animated.View>

      {/* Full-Screen Viewer Modal */}
      <PhotoViewerModal
        visible={viewerVisible}
        photos={photos}
        initialIndex={initialIndex}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════════════════
   FULL-SCREEN VIEWER
═══════════════════════════════════════════════════════════ */

interface ViewerProps {
  visible: boolean;
  photos: PhotoResponse[];
  initialIndex: number;
  onClose: () => void;
}

function ViewerItem({ item }: { item: PhotoResponse }) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={styles.viewerItem}>
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.viewerImage} 
        resizeMode="contain" 
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.viewerLoading}>
          <ActivityIndicator size="large" color={C.white} />
        </View>
      )}
    </View>
  );
}

function PhotoViewerModal({ visible, photos, initialIndex, onClose }: ViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Update index if it changes externally
  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const renderViewerItem = ({ item }: { item: PhotoResponse }) => <ViewerItem item={item} />;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewerRoot}>
        {/* Top Controls */}
        <SafeAreaView style={styles.viewerHeader}>
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color={C.white} />
          </TouchableOpacity>
          <Text style={styles.viewerCounter}>
            {currentIndex + 1} / {photos.length}
          </Text>
          <TouchableOpacity style={styles.viewerCloseBtn}>
            <Ionicons name="share-outline" size={24} color={C.white} />
          </TouchableOpacity>
        </SafeAreaView>

        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderViewerItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
      </View>
    </Modal>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.gray1,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: C.gray2,
  },
  listContent: {
    padding: SPACING,
    paddingBottom: 40,
  },
  thumbnailWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginBottom: SPACING,
    backgroundColor: C.gray4,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCheckmarkWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  selectionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.white,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircleActive: {
    backgroundColor: C.white,
    borderColor: C.white,
  },
  thumbnailSelectedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.selectionOverlay,
  },
  
  /* Viewer */
  viewerRoot: {
    flex: 1,
    backgroundColor: '#000000', // Pitch black for viewer
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    zIndex: 10,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)', // Gradient-like fade
  },
  viewerCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCounter: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    letterSpacing: 1,
  },
  viewerItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});
