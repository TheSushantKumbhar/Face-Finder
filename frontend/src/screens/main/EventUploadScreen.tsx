/**
 * Face Finder — Event Upload Screen
 * ────────────────────────────────
 * A premium, black-and-white, highly animated screen for uploading photos to an event.
 * Handles chunked multipart uploads with chunk progress and status.
 *
 * Upload state is managed by UploadContext so it persists across navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { useUpload, UploadTask } from '../../context/UploadContext';

// Helper
const formatMB = (bytes?: number) => {
  if (!bytes) return '';
  return ` • ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  success: '#EAEAEA',
  error: '#FF5555',
};

interface TaskCardProps {
  item: UploadTask;
  onSelect: (task: UploadTask) => void;
  onRetry: (taskId: string) => void;
  onRemove: (taskId: string) => void;
}

const TaskCard = React.memo(({ item, onSelect, onRetry, onRemove }: TaskCardProps) => {
  const isCompleted = item.status === 'completed';
  const isFailed = item.status === 'failed';
  const isUploading = item.status === 'uploading';

  return (
    <TouchableOpacity 
      style={styles.taskCard} 
      activeOpacity={0.8}
      onPress={() => onSelect(item)}
    >
      {/* Thumbnail */}
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      
      {/* Info */}
      <View style={styles.taskInfo}>
        <Text style={styles.taskName} numberOfLines={1}>{item.fileName}</Text>
        <Text style={styles.taskStatus}>
          {isUploading ? `Uploading • ${item.progress}%` : 
           isCompleted ? 'Upload Complete' : 
           isFailed ? 'Upload Failed' : 'Pending'}
          {formatMB(item.fileSize)}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { width: `${item.progress}%`, backgroundColor: isFailed ? C.error : C.white }
            ]} 
          />
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.taskActions}>
        {isCompleted ? (
          <Ionicons name="checkmark-circle" size={24} color={C.white} />
        ) : isUploading ? (
          <ActivityIndicator size="small" color={C.white} />
        ) : isFailed ? (
          <TouchableOpacity onPress={() => onRetry(item.id)}>
            <Ionicons name="refresh" size={24} color={C.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => onRemove(item.id)}>
            <Ionicons name="close-circle" size={24} color={C.gray2} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.status === nextProps.item.status &&
         prevProps.item.progress === nextProps.item.progress;
});

export default function EventUploadScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { eventId, eventName } = route.params || { eventId: '', eventName: 'Event' };
  
  const {
    getTasksForEvent,
    isProcessingImages,
    isUploadingAllForEvent,
    pickImages,
    startUpload,
    uploadAll,
    removeTask,
  } = useUpload();

  const tasks = getTasksForEvent(eventId);
  const isUploadingAll = isUploadingAllForEvent(eventId);

  const [selectedTask, setSelectedTask] = useState<UploadTask | null>(null);
  
  // Overall upload stats
  const totalUploads = tasks.length;
  const completedUploads = tasks.filter((t) => t.status === 'completed').length;
  const inProgressUploads = tasks.filter((t) => t.status === 'uploading').length;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ── Renderers ───────────────────────────────────────────── */

  const renderTask = ({ item }: { item: UploadTask }) => {
    return (
      <TaskCard
        item={item}
        onSelect={setSelectedTask}
        onRetry={startUpload}
        onRemove={removeTask}
      />
    );
  };

  const getItemLayout = (data: any, index: number) => ({
    length: 82, // 12 + 12 padding + 56 image height + 2 borders
    offset: 82 * index,
    index,
  });

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Upload Photos</Text>
          <Text style={styles.headerSubtitle}>{eventName}</Text>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalUploads}</Text>
            <Text style={styles.statLabel}>Selected</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{inProgressUploads}</Text>
            <Text style={styles.statLabel}>Uploading</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{completedUploads}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.pickBtn, isProcessingImages && { opacity: 0.7 }]} 
            onPress={() => pickImages(eventId)}
            disabled={isProcessingImages}
          >
            {isProcessingImages ? (
              <ActivityIndicator size="small" color={C.bg} />
            ) : (
              <Ionicons name="images" size={18} color={C.bg} />
            )}
            <Text style={styles.pickBtnText}>
              {isProcessingImages ? 'Processing...' : 'Select Photos'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.galleryBtn, tasks.length > 0 && { flex: 0.5 }]} 
            onPress={() => navigation.navigate('EventGallery', { eventId, eventName })}
          >
            <Ionicons name="grid" size={18} color={C.white} />
            <Text style={styles.galleryBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {tasks.length > 0 && (
          <View style={[styles.actionsRow, { marginTop: -4 }]}>
            <TouchableOpacity 
              style={[styles.uploadAllBtn, isUploadingAll && { opacity: 0.7 }]} 
              onPress={() => uploadAll(eventId)}
              disabled={isUploadingAll}
            >
              {isUploadingAll ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Ionicons name="cloud-upload" size={18} color={C.white} />
              )}
              <Text style={styles.uploadAllText}>
                {isUploadingAll ? 'Uploading...' : 'Upload All Pending'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={48} color={C.gray3} />
            <Text style={styles.emptyText}>No photos selected.</Text>
            <Text style={styles.emptySubtext}>Tap "Select Photos" to begin.</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderTask}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
          />
        )}
      </Animated.View>

      {/* Details Modal */}
      <Modal
        visible={!!selectedTask}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Details</Text>
              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <Ionicons name="close" size={24} color={C.white} />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <View style={styles.modalBody}>
                <Image source={{ uri: selectedTask.uri }} style={styles.modalImage} />
                <Text style={styles.modalFilename}>{selectedTask.fileName}</Text>
                
                <View style={styles.chunkInfo}>
                  {selectedTask.fileSize && (
                    <Text style={styles.chunkText}>
                      Size: <Text style={{ color: C.white, fontWeight: '700' }}>{formatMB(selectedTask.fileSize).replace(' • ', '')}</Text>
                    </Text>
                  )}
                  <Text style={styles.chunkText}>
                    Status: <Text style={{ color: C.white, fontWeight: '700', textTransform: 'capitalize' }}>{selectedTask.status}</Text>
                  </Text>
                  {selectedTask.totalParts > 0 && (
                    <Text style={styles.chunkText}>
                      Chunks: {selectedTask.uploadedParts} / {selectedTask.totalParts} Uploaded
                    </Text>
                  )}
                  {selectedTask.errorMsg && (
                    <Text style={[styles.chunkText, { color: C.error }]}>Error: {selectedTask.errorMsg}</Text>
                  )}
                </View>

                {selectedTask.status === 'completed' && (
                  <View style={styles.successBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={C.bg} />
                    <Text style={styles.successText}>Upload Complete</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessingImages && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={C.white} />
          <Text style={styles.processingTitle}>Processing Photos...</Text>
          <Text style={styles.processingSubtitle}>Loading high-resolution images. This may take a moment.</Text>
        </View>
      )}

    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.gray1,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: C.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: C.gray2,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  pickBtn: {
    flex: 1,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  pickBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 8,
  },
  galleryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },
  uploadAllBtn: {
    flex: 1,
    backgroundColor: C.gray4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gray3,
    gap: 8,
  },
  uploadAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: C.gray4,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
    marginBottom: 4,
  },
  taskStatus: {
    fontSize: 12,
    color: C.gray1,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: C.gray4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  taskActions: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Modal */
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: C.cardBorder,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
  },
  modalBody: {
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: C.card,
  },
  modalFilename: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  chunkInfo: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 16,
  },
  chunkText: {
    fontSize: 14,
    color: C.gray1,
    marginBottom: 6,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    gap: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.bg,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 40,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    marginTop: 20,
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 14,
    color: C.gray1,
    textAlign: 'center',
    lineHeight: 20,
  },
});
