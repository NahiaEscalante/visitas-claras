import { apiRequest } from './http';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshResponse {
  token: string;
  expiresIn: number;
}

const AUTH_BASE = 'auth';

export async function loginApi(payload: LoginPayload) {
  return apiRequest<LoginResponse>(`${AUTH_BASE}/login`, {
    method: 'POST',
    body: payload,
  });
}

export async function refreshApi(refreshToken: string) {
  return apiRequest<RefreshResponse>(`${AUTH_BASE}/refresh`, {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function logoutApi(refreshToken: string) {
  return apiRequest<null>(`${AUTH_BASE}/logout`, {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function meApi() {
  return apiRequest<User>(`${AUTH_BASE}/me`, { method: 'GET' });
}
