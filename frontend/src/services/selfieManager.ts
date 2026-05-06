/**
 * Face Finder — Selfie Manager
 * ─────────────────────────────
 * Unified service for the entire selfie lifecycle:
 *   1. persistImage()   – copy picked image to permanent storage immediately
 *   2. uploadAll()      – upload 3 persisted selfies to backend sequentially
 *   3. cleanup()        – delete local copies after successful upload
 *
 * WHY THIS EXISTS:
 * Android cleans up /cache/ImagePicker/ temp files aggressively.
 * If you store the raw ImagePicker URI and try to read it later (even seconds
 * later), the file is often already gone — causing "FileNotFoundException".
 * The solution: copy every picked image into documentDirectory (permanent
 * app storage) the instant it is selected.  documentDirectory survives until
 * the user uninstalls the app or explicitly clears data.
 *
 * This mirrors the proven approach used by UploadContext for event photos.
 */

import {
  copyAsync,
  makeDirectoryAsync,
  deleteAsync,
  getInfoAsync,
  documentDirectory,
  uploadAsync,
  FileSystemUploadType,
} from 'expo-file-system/legacy';

import { getToken, BASE_URL } from './api';

/* ── Constants ──────────────────────────────────────────────── */

/**
 * Permanent directory for selfie files.
 * documentDirectory is NEVER cleaned by the OS — only by the user
 * or an explicit deleteAsync call.
 */
const SELFIE_DIR = `${documentDirectory}face_finder_selfies/`;

/* ── Directory bootstrap ────────────────────────────────────── */

let dirReady = false;

async function ensureDir(): Promise<void> {
  if (dirReady) return;
  try {
    const info = await getInfoAsync(SELFIE_DIR);
    if (!info.exists) {
      await makeDirectoryAsync(SELFIE_DIR, { intermediates: true });
    }
    dirReady = true;
  } catch {
    // If getInfo fails, try to create anyway
    await makeDirectoryAsync(SELFIE_DIR, { intermediates: true });
    dirReady = true;
  }
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Copy a picked image to permanent storage.
 * Call this IMMEDIATELY after ImagePicker returns — before storing in state.
 *
 * @param sourceUri  URI from ImagePicker (file:// or content://)
 * @param label      e.g. 'front', 'left', 'right'
 * @returns          Stable file:// path in documentDirectory
 */
export async function persistImage(
  sourceUri: string,
  label: string,
): Promise<string> {
  await ensureDir();

  const ext =
    sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const destPath = `${SELFIE_DIR}${label}_${Date.now()}.${ext}`;

  await copyAsync({ from: sourceUri, to: destPath });

  // Verify the copy actually landed
  const info = await getInfoAsync(destPath);
  if (!info.exists) {
    throw new Error(`Failed to persist selfie: file not found after copy`);
  }

  return destPath;
}

/**
 * Upload a single persisted selfie to the backend via native uploadAsync.
 * This uses expo-file-system's native HTTP client — NOT fetch + FormData —
 * which is the only reliable multipart upload method on React Native.
 */
async function uploadOne(
  filePath: string,
  selfieType: string,
  token: string,
): Promise<string> {
  const url = `${BASE_URL}/selfies/upload-single?selfie_type=${encodeURIComponent(selfieType)}`;

  const result = await uploadAsync(url, filePath, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: 'image',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    let detail = 'Upload failed';
    try {
      detail = JSON.parse(result.body).detail || detail;
    } catch { /* ignore parse errors */ }
    throw new Error(`Failed to upload ${selfieType}: ${detail}`);
  }

  return JSON.parse(result.body).url;
}

/**
 * Upload all three selfies sequentially and return the remote URLs.
 *
 * @param paths  Object with front/left/right paths (from persistImage)
 */
export async function uploadAllSelfies(paths: {
  front: string;
  left: string;
  right: string;
}): Promise<{ front_url: string; left_url: string; right_url: string }> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const front_url = await uploadOne(paths.front, 'front', token);
  const left_url = await uploadOne(paths.left, 'left', token);
  const right_url = await uploadOne(paths.right, 'right', token);

  return { front_url, left_url, right_url };
}

/**
 * Remove all locally-persisted selfie files.
 * Call after a successful upload to free storage.
 */
export async function cleanup(): Promise<void> {
  try {
    await deleteAsync(SELFIE_DIR, { idempotent: true });
    dirReady = false;
  } catch {
    // Cleanup is best-effort
  }
}
