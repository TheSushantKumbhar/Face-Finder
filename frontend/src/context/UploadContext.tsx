/**
 * Face Finder — Upload Context
 * ─────────────────────────────
 * Lifts upload state out of EventUploadScreen so that it persists
 * across navigation. The actual chunked-upload logic stays here;
 * the screen simply reads tasks / calls actions from this context.
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  uploadAsync,
  FileSystemUploadType,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  getInfoAsync,
  copyAsync,
  makeDirectoryAsync,
  EncodingType,
  cacheDirectory,
  documentDirectory,
} from 'expo-file-system/legacy';
import {
  initUploadApi,
  getPresignedUrlApi,
  completePartApi,
  completeUploadApi,
  getMeApi,
} from '../services/api';

/* ── Types ──────────────────────────────────────────────────── */

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';

export interface UploadTask {
  id: string;
  uri: string;
  fileName: string;
  fileSize?: number;
  progress: number;
  status: UploadStatus;
  totalParts: number;
  uploadedParts: number;
  uploadId?: string;
  errorMsg?: string;
  cancelFlag?: { current: boolean };
  eventId: string;          // which event this task belongs to
}

interface UploadContextType {
  /** All tasks across every event */
  allTasks: UploadTask[];
  /** Get tasks for a specific event */
  getTasksForEvent: (eventId: string) => UploadTask[];
  /** Whether images are being processed right now */
  isProcessingImages: boolean;
  /** Whether a batch upload-all is in progress for a given event */
  isUploadingAllForEvent: (eventId: string) => boolean;
  /** Pick images and add them as pending tasks for an event */
  pickImages: (eventId: string) => Promise<void>;
  /** Start uploading a single task */
  startUpload: (taskId: string) => Promise<void>;
  /** Upload all pending/failed tasks for a given event */
  uploadAll: (eventId: string) => Promise<void>;
  /** Remove a pending task from the queue */
  removeTask: (taskId: string) => void;
}

const UploadContext = createContext<UploadContextType>({
  allTasks: [],
  getTasksForEvent: () => [],
  isProcessingImages: false,
  isUploadingAllForEvent: () => false,
  pickImages: async () => {},
  startUpload: async () => {},
  uploadAll: async () => {},
  removeTask: () => {},
});

export const useUpload = () => useContext(UploadContext);

/* ── Provider ───────────────────────────────────────────────── */

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [uploadingAllEvents, setUploadingAllEvents] = useState<Set<string>>(new Set());

  const tasksRef = useRef<UploadTask[]>([]);
  // Keep ref in sync
  React.useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Cache userId so we don't fetch on every upload
  const userIdRef = useRef<string>('');
  const ensureUserId = async () => {
    if (userIdRef.current) return userIdRef.current;
    const me = await getMeApi();
    userIdRef.current = me.id;
    return me.id;
  };

  /* ── getTasksForEvent ─────────────────────────────────────── */
  const getTasksForEvent = useCallback(
    (eventId: string) => tasks.filter((t) => t.eventId === eventId),
    [tasks]
  );

  /* ── isUploadingAllForEvent ───────────────────────────────── */
  const isUploadingAllForEvent = useCallback(
    (eventId: string) => uploadingAllEvents.has(eventId),
    [uploadingAllEvents]
  );

  /* ── pickImages ───────────────────────────────────────────── */
  const pickImages = useCallback(async (eventId: string) => {
    setIsProcessingImages(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const uploadDir = (documentDirectory || cacheDirectory || '') + 'face_finder_uploads/';
        try {
          await makeDirectoryAsync(uploadDir, { intermediates: true });
        } catch {
          // Directory might already exist
        }

        const assets = result.assets;

        const processAsset = async (asset: ImagePicker.ImagePickerAsset, index: number) => {
          const fileName = asset.fileName || `photo_${Date.now()}_${index}.jpg`;
          const destPath = uploadDir + `${Date.now()}_${index}_${fileName}`;

          try {
            await copyAsync({ from: asset.uri, to: destPath });
            const info = await getInfoAsync(destPath);
            if (!info.exists) throw new Error('File not created after write');

            console.log(`✓ Saved ${fileName} (${((info.size || 0) / 1024 / 1024).toFixed(1)}MB)`);

            return {
              id: destPath,
              uri: destPath,
              fileName,
              fileSize: info.size || asset.fileSize,
              progress: 0,
              status: 'pending' as UploadStatus,
              totalParts: 0,
              uploadedParts: 0,
              eventId,
            };
          } catch (err: any) {
            console.log(`✗ Failed to save ${fileName}: ${err.message}`);
            return {
              id: asset.uri,
              uri: asset.uri,
              fileName,
              fileSize: asset.fileSize,
              progress: 0,
              status: 'pending' as UploadStatus,
              totalParts: 0,
              uploadedParts: 0,
              eventId,
            };
          }
        };

        const results = await Promise.all(
          assets.map((asset, idx) => processAsset(asset, idx))
        );

        const savedCount = results.filter((t) => t.uri.includes('face_finder_uploads')).length;
        console.log(`Saved ${savedCount}/${assets.length} photos to persistent storage`);
        setTasks((prev) => [...prev, ...results]);
      }
    } finally {
      setIsProcessingImages(false);
    }
  }, []);

  /* ── startUpload ──────────────────────────────────────────── */
  const startUpload = useCallback(async (taskId: string) => {
    let userId: string;
    try {
      userId = await ensureUserId();
    } catch {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'uploading' as UploadStatus, errorMsg: undefined, progress: 0, uploadedParts: 0 }
          : t
      )
    );

    const task = tasksRef.current.find((t) => t.id === taskId);
    if (!task) return;

    const eventId = task.eventId;

    try {
      const fileUri = task.uri;

      // 1. Get file size
      const fileInfo = await getInfoAsync(fileUri);
      if (!fileInfo.exists) throw new Error('File does not exist: ' + fileUri);
      const fileSize = fileInfo.size || 0;
      if (fileSize === 0) throw new Error('File size is 0: ' + fileUri);
      console.log(`Uploading: ${task.fileName}, size: ${fileSize}, uri: ${fileUri}`);

      // 2. Init Upload on backend
      let initRes;
      try {
        initRes = await initUploadApi(task.fileName, userId, eventId);
      } catch (e: any) {
        throw new Error(`Init Upload Failed: ${e.message}`);
      }
      const { upload_id, chunk_size } = initRes;

      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, uploadId: upload_id } : t)));

      const totalParts = Math.ceil(fileSize / chunk_size);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, totalParts } : t)));

      // 3. Upload each part sequentially
      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const offset = i * chunk_size;
        const length = Math.min(chunk_size, fileSize - offset);

        // 3a. Get presigned URL
        let presignedUrl: string;
        try {
          const res = await getPresignedUrlApi(upload_id, partNumber);
          presignedUrl = res.url;
        } catch (e: any) {
          throw new Error(`Presigned URL Failed (part ${partNumber}): ${e.message}`);
        }

        // 3b. Upload chunk
        if (totalParts === 1) {
          const uploadResult = await uploadAsync(presignedUrl, fileUri, {
            httpMethod: 'PUT',
            uploadType: FileSystemUploadType.BINARY_CONTENT,
          });

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Upload failed with status ${uploadResult.status}`);
          }

          const etag =
            uploadResult.headers['etag'] ||
            uploadResult.headers['ETag'] ||
            uploadResult.headers['Etag'];
          if (!etag) throw new Error('No ETag received from upload');

          try {
            await completePartApi(upload_id, partNumber, etag);
          } catch (e: any) {
            throw new Error(`Complete Part Failed: ${e.message}`);
          }
        } else {
          const base64Chunk = await readAsStringAsync(fileUri, {
            encoding: EncodingType.Base64,
            position: offset,
            length: length,
          });

          const tempChunkUri = (cacheDirectory || '') + `chunk_${upload_id}_${partNumber}.tmp`;
          await writeAsStringAsync(tempChunkUri, base64Chunk, {
            encoding: EncodingType.Base64,
          });

          const uploadResult = await uploadAsync(presignedUrl, tempChunkUri, {
            httpMethod: 'PUT',
            uploadType: FileSystemUploadType.BINARY_CONTENT,
          });

          await deleteAsync(tempChunkUri, { idempotent: true });

          if (uploadResult.status < 200 || uploadResult.status >= 300) {
            throw new Error(`Chunk ${partNumber} failed with status ${uploadResult.status}`);
          }

          const etag =
            uploadResult.headers['etag'] ||
            uploadResult.headers['ETag'] ||
            uploadResult.headers['Etag'];
          if (!etag) throw new Error(`No ETag received for chunk ${partNumber}`);

          try {
            await completePartApi(upload_id, partNumber, etag);
          } catch (e: any) {
            throw new Error(`Complete Part Failed (part ${partNumber}): ${e.message}`);
          }
        }

        // Update progress
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              const newUploadedParts = i + 1;
              return {
                ...t,
                uploadedParts: newUploadedParts,
                progress: Math.floor((newUploadedParts / totalParts) * 100),
              };
            }
            return t;
          })
        );
      }

      // 4. Complete Upload
      try {
        await completeUploadApi(upload_id, eventId, userId);
      } catch (e: any) {
        throw new Error(`Complete Upload Failed: ${e.message}`);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as UploadStatus, progress: 100 } : t))
      );

      // Clean up
      try {
        await deleteAsync(fileUri, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
    } catch (err: any) {
      console.log('Upload error', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'failed' as UploadStatus, errorMsg: err.message || 'Unknown error' }
            : t
        )
      );
    }
  }, []);

  /* ── uploadAll ────────────────────────────────────────────── */
  const uploadAll = useCallback(async (eventId: string) => {
    if (uploadingAllEvents.has(eventId)) return;

    setUploadingAllEvents((prev) => new Set(prev).add(eventId));

    const pendingTaskIds = tasksRef.current
      .filter((t) => t.eventId === eventId && (t.status === 'pending' || t.status === 'failed'))
      .map((t) => t.id);

    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < pendingTaskIds.length) {
        const idx = currentIndex++;
        const taskId = pendingTaskIds[idx];
        await startUpload(taskId);
      }
    };

    const workers = Array.from({ length: Math.min(pendingTaskIds.length, 1) }).map(worker);
    await Promise.all(workers);

    setUploadingAllEvents((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }, [startUpload, uploadingAllEvents]);

  /* ── removeTask ───────────────────────────────────────────── */
  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  /* ── Context value ────────────────────────────────────────── */
  const value = useMemo(
    () => ({
      allTasks: tasks,
      getTasksForEvent,
      isProcessingImages,
      isUploadingAllForEvent,
      pickImages,
      startUpload,
      uploadAll,
      removeTask,
    }),
    [tasks, getTasksForEvent, isProcessingImages, isUploadingAllForEvent, pickImages, startUpload, uploadAll, removeTask]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};
