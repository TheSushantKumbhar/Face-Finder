/**
 * Face Finder — API Service
 * ──────────────────────────
 * All API calls and token management live here.
 * Update BASE_URL to point to your backend server.
 */

import * as SecureStore from 'expo-secure-store';

// ── Change this to your backend URL ──────────────────────
// export const BASE_URL = 'https://pcs-cabinets-carried-emission.trycloudflare.com'; // Android emulator → localhost
// For physical device, use your machine's LAN IP, e.g. 'http://192.168.1.100:8000'

const isDev = true;

export const BASE_URL = isDev
  ? 'http://192.168.1.10:8000'
  : 'https://face-finder-9zkc.onrender.com';

const TOKEN_KEY = 'face_finder_token';

// ── Token Management ─────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ── Auth API Calls ───────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface SignUpResponse {
  message: string;
}

export interface ApiError {
  detail: string;
}

export async function loginApi(
  email: string,
  password: string
): Promise<LoginResponse & { username: string; role: string }> {
  // 1. Login to get token
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data: LoginResponse = await response.json();
  await saveToken(data.access_token);

  // 2. Fetch user profile to get role and username
  const profile = await getMeApi();

  return { ...data, username: profile.username, role: profile.role };
}

export async function signUpApi(
  username: string,
  email: string,
  password: string,
  role: 'user' | 'organizer'
): Promise<SignUpResponse> {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, role }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.detail || 'Sign up failed');
  }

  return await response.json();
}

export async function logoutApi(): Promise<void> {
  await removeToken();
}

// ── Google OAuth API Calls ───────────────────────────────

export interface SelectRoleResponse {
  access_token: string;
  token_type: string;
  role: string;
  username: string;
}

export async function selectRoleApi(
  userId: string,
  role: 'user' | 'organizer'
): Promise<SelectRoleResponse> {
  const response = await fetch(
    `${BASE_URL}/auth/select-role?user_id=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || error.error || 'Role selection failed');
  }

  const data: SelectRoleResponse = await response.json();
  await saveToken(data.access_token);
  return data;
}

// ── User Profile API ──────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
}

export async function getMeApi(): Promise<UserProfile> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return await response.json();
}

// ── Event API ─────────────────────────────────────────────

export interface EventCreateData {
  name: string;
  description?: string;
}

export interface EventResponse {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export async function getEventsApi(): Promise<EventResponse[]> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/events/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch events');
  }

  return await response.json();
}

export async function createEventApi(data: EventCreateData): Promise<EventResponse> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/events/createEvent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create event');
  }

  return await response.json();
}

export async function deleteEventApi(eventId: string): Promise<{ message: string }> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete event');
  }

  return await response.json();
}

// ── Upload API ─────────────────────────────────────────────

export interface InitUploadResponse {
  upload_id: string;
  file_key: string;
  r2_upload_id: string;
  chunk_size: number;
}

export async function initUploadApi(fileName: string, userId: string, eventId: string): Promise<InitUploadResponse> {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/upload/init?file_name=${encodeURIComponent(fileName)}&user_id=${encodeURIComponent(userId)}&event_id=${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Init upload failed');
  return response.json();
}

export async function getPresignedUrlApi(uploadId: string, partNumber: number): Promise<{ url: string }> {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/upload/presigned-url?upload_id=${encodeURIComponent(uploadId)}&part_number=${partNumber}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Get presigned url failed');
  return response.json();
}

export async function completePartApi(uploadId: string, partNumber: number, etag: string): Promise<any> {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/upload/part-complete?upload_id=${encodeURIComponent(uploadId)}&part_number=${partNumber}&etag=${encodeURIComponent(etag)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Complete part failed');
  return response.json();
}

export async function completeUploadApi(uploadId: string, eventId: string, userId: string): Promise<{ message: string, image_url: string }> {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/upload/complete?upload_id=${encodeURIComponent(uploadId)}&event_id=${encodeURIComponent(eventId)}&user_id=${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Complete upload failed');
  return response.json();
}

export interface PhotoResponse {
  id: string;
  event_id: string;
  image_url: string;
  status: string;
  uploaded_by: string;
  created_at: string | null;
}

export async function getEventPhotosApi(eventId: string): Promise<PhotoResponse[]> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch photos');
  }

  return response.json();
}

// ── Selfie API ────────────────────────────────────────────

export interface SelfieStatusResponse {
  has_selfies: boolean;
  selfies: {
    front_url: string | null;
    left_url: string | null;
    right_url: string | null;
  };
}

export async function checkSelfieStatusApi(): Promise<SelfieStatusResponse> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/selfies/status`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    // Try JSON first, fall back to text
    const text = await response.text();
    let detail = 'Failed to check selfie status';
    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail || detail;
    } catch {
      detail = text || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export interface SelfieUploadResponse {
  message: string;
  data: {
    front_url: string;
    left_url: string;
    right_url: string;
  };
}

export async function uploadSelfiesApi(
  frontUri: string,
  leftUri: string,
  rightUri: string
): Promise<SelfieUploadResponse> {
  const token = await getToken();
  if (!token) throw new Error('No token found');

  const formData = new FormData();

  const createFileEntry = (uri: string, fieldName: string) => {
    const fileName = uri.split('/').pop() || `${fieldName}.jpg`;
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return { uri, name: fileName, type: mimeType } as any;
  };

  formData.append('front_image', createFileEntry(frontUri, 'front'));
  formData.append('left_image', createFileEntry(leftUri, 'left'));
  formData.append('right_image', createFileEntry(rightUri, 'right'));

  const response = await fetch(`${BASE_URL}/selfies/upload-selfie`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — let fetch set boundary for multipart
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload selfies');
  }

  return response.json();
}
