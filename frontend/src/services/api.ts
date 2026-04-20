/**
 * Face Finder — API Service
 * ──────────────────────────
 * All API calls and token management live here.
 * Update BASE_URL to point to your backend server.
 */

import * as SecureStore from 'expo-secure-store';

// ── Change this to your backend URL ──────────────────────
export const BASE_URL = 'https://pcs-cabinets-carried-emission.trycloudflare.com'; // Android emulator → localhost
// For physical device, use your machine's LAN IP, e.g. 'http://192.168.1.100:8000'

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
): Promise<LoginResponse> {
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
  return data;
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
