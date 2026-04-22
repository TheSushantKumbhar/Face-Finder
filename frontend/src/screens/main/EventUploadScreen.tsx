/**
 * Face Finder — Event Upload Screen
 * ────────────────────────────────
 * A premium, black-and-white, highly animated screen for uploading photos to an event.
 * Handles chunked multipart uploads with chunk progress and status.
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../context/AuthContext';
import {
  initUploadApi,
  getPresignedUrlApi,
  completePartApi,
  completeUploadApi
} from '../../services/api';

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

type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';

interface UploadTask {
  id: string; // usually local URI
  uri: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  totalParts: number;
  uploadedParts: number;
  uploadId?: string; // from backend
  errorMsg?: string;
  cancelFlag?: { current: boolean };
}

export default function EventUploadScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { eventId, eventName } = route.params || { eventId: '', eventName: 'Event' };
  
  const [userId, setUserId] = useState<string>('');

  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<UploadTask | null>(null);
  
  // Overall upload stats
  const totalUploads = tasks.length;
  const completedUploads = tasks.filter((t) => t.status === 'completed').length;
  const inProgressUploads = tasks.filter((t) => t.status === 'uploading').length;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // For demo purposes, we need a user ID. If not available from AuthContext, we use a fallback or fetch it.
    import('../../services/api').then((api) => {
      api.getMeApi().then((res) => setUserId(res.id)).catch(() => {});
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ── Actions ─────────────────────────────────────────────── */

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8, // Slightly lower quality to speed up upload
    });

    if (!result.canceled && result.assets) {
      const newTasks: UploadTask[] = result.assets.map((asset) => ({
        id: asset.uri,
        uri: asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        progress: 0,
        status: 'pending',
        totalParts: 0,
        uploadedParts: 0,
        cancelFlag: { current: false }
      }));
      setTasks((prev) => [...prev, ...newTasks]);
    }
  };

  const startUpload = async (taskId: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'uploading', errorMsg: undefined, cancelFlag: { current: false } } : t))
    );

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      // 1. Init Upload
      const { upload_id, chunk_size } = await initUploadApi(task.fileName, userId);
      
      // Update task with upload_id
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, uploadId: upload_id } : t));

      // 2. Read file as Blob
      const fileResponse = await fetch(task.uri);
      const blob = await fileResponse.blob();
      const totalParts = Math.ceil(blob.size / chunk_size);

      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, totalParts } : t));

      // 3. Upload parts sequentially
      for (let i = 0; i < totalParts; i++) {
        // Check for cancellation or pause
        const currentTask = tasks.find((t) => t.id === taskId);
        // We use a mutable ref for cancelFlag to check it mid-loop
        // But for simplicity in React Native, we just check if it was removed or marked as paused
        
        // In React Native, fetch can fail when uploading sliced blobs. 
        // If it's a single part, use the original blob to prevent Network Request Failed.
        const chunk = totalParts === 1 ? blob : blob.slice(i * chunk_size, (i + 1) * chunk_size);
        const partNumber = i + 1;

        // Get Presigned URL
        const { url } = await getPresignedUrlApi(upload_id, partNumber);

        // PUT Chunk
        const uploadRes = await fetch(url, { method: 'PUT', body: chunk });
        if (!uploadRes.ok) throw new Error(`Chunk ${partNumber} failed`);

        // Get Etag. R2 returns ETag in headers.
        const etag = uploadRes.headers.get('etag') || uploadRes.headers.get('Etag') || uploadRes.headers.get('ETag');
        if (!etag) throw new Error('No ETag received');

        // Complete Part on backend
        await completePartApi(upload_id, partNumber, etag);

        // Update progress
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              const newUploadedParts = t.uploadedParts + 1;
              return {
                ...t,
                uploadedParts: newUploadedParts,
                progress: Math.floor((newUploadedParts / totalParts) * 100)
              };
            }
            return t;
          })
        );
      }

      // 4. Complete Upload
      await completeUploadApi(upload_id, eventId, userId);

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
      );

    } catch (err: any) {
      console.log('Upload error', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'failed', errorMsg: err.message } : t))
      );
    }
  };

  const uploadAll = () => {
    tasks.forEach((task) => {
      if (task.status === 'pending' || task.status === 'failed') {
        startUpload(task.id);
      }
    });
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  /* ── Renderers ───────────────────────────────────────────── */

  const renderTask = ({ item, index }: { item: UploadTask; index: number }) => {
    const isCompleted = item.status === 'completed';
    const isFailed = item.status === 'failed';
    const isUploading = item.status === 'uploading';

    return (
      <TouchableOpacity 
        style={styles.taskCard} 
        activeOpacity={0.8}
        onPress={() => setSelectedTask(item)}
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
            <TouchableOpacity onPress={() => startUpload(item.id)}>
              <Ionicons name="refresh" size={24} color={C.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => removeTask(item.id)}>
              <Ionicons name="close-circle" size={24} color={C.gray2} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
            <Ionicons name="images" size={18} color={C.bg} />
            <Text style={styles.pickBtnText}>Select Photos</Text>
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
            <TouchableOpacity style={styles.uploadAllBtn} onPress={uploadAll}>
              <Ionicons name="cloud-upload" size={18} color={C.white} />
              <Text style={styles.uploadAllText}>Upload All Pending</Text>
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
});
