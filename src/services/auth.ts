/**
 * Servicio de autenticación. Usa la API real /v1/auth.
 */

import type { User } from '@/types';
import { loginApi, logoutApi, meApi } from '@/api/auth';

const AUTH_USER_KEY = 'auth_user';

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: User;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> {
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El email es requerido y debe tener un formato válido',
      },
    };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La contraseña debe tener al menos 8 caracteres',
      },
    };
  }

  const response = await loginApi({ email, password, rememberMe });

  if (!response.success || !response.data) {
    return {
      success: false,
      error: {
        code: response.error?.code || 'INVALID_CREDENTIALS',
        message: response.error?.message || 'Email o contraseña incorrectos',
      },
    };
  }

  const { token, refreshToken, user, expiresIn } = response.data;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user_id', user.id);
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore quota
  }

  return {
    success: true,
    data: {
      token,
      refreshToken,
      user,
      expiresIn,
    },
  };
}

export async function logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
  const token = refreshToken ?? localStorage.getItem('refresh_token');
  if (token) {
    await logoutApi(token);
  }
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem(AUTH_USER_KEY);
  return {
    success: true,
    message: 'Sesión cerrada exitosamente',
  };
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Obtener usuario actual; si no está en localStorage, llama a GET /v1/auth/me.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  const response = await meApi();
  if (!response.success || !response.data) return null;
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
    localStorage.setItem('user_id', response.data.id);
  } catch {
    // ignore
  }
  return response.data;
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}
