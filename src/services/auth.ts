/**
 * Servicio de autenticación
 *
 * Soporta dos modos:
 * - API real: cuando VITE_API_BASE_URL está definida
 * - Mock: cuando no hay API configurada (modo demo)
 *
 * El servicio persiste tokens y datos del usuario en localStorage.
 */

import { isApiModeEnabled } from '@/api/config';
import { apiLogin, apiLogout, apiGetMe } from '@/api/endpoints';
import { User } from '@/types';

// Re-exportar User para compatibilidad
export type { User };

// ─── Datos mock (solo se cargan si se necesitan) ───────────────────────

let mockUsersModule: typeof import('@/data/mockUsers') | null = null;

async function getMockUsers() {
  if (!mockUsersModule) {
    mockUsersModule = await import('@/data/mockUsers');
  }
  return mockUsersModule;
}

// ─── Tipos ─────────────────────────────────────────────────────────────

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

// ─── Helpers ───────────────────────────────────────────────────────────

function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateMockToken(userId: string, expiresIn: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.mock-signature`;
}

// ─── Login ─────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> {
  // ── API real ──
  if (isApiModeEnabled()) {
    try {
      const data = await apiLogin({ email, password, rememberMe });

      // Persistir tokens y usuario
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : 'Error al iniciar sesión',
        },
      };
    }
  }

  // ── Mock ──
  await delay(800);

  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'El email es requerido y debe tener un formato válido' },
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'La contraseña debe tener al menos 6 caracteres' },
    };
  }

  const { verifyCredentials } = await getMockUsers();
  const mockUser = verifyCredentials(email, password);

  if (!mockUser) {
    return {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' },
    };
  }

  const expiresIn = rememberMe ? 86400 * 7 : 3600;
  const token = generateMockToken(mockUser.id, expiresIn);
  const refreshToken = generateMockToken(mockUser.id, expiresIn * 2);

  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user_id', mockUser.id);

  const { password: _, ...userWithoutPassword } = mockUser;

  // Adaptar mock user al tipo User del contrato
  const user: User = {
    id: userWithoutPassword.id,
    email: userWithoutPassword.email,
    nombre: userWithoutPassword.nombre,
    apellido: userWithoutPassword.apellido,
    rol: userWithoutPassword.rol,
    ie: (userWithoutPassword as any).ie || null,
    foto: (userWithoutPassword as any).foto || null,
    activo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem('user_data', JSON.stringify(user));

  return {
    success: true,
    data: { token, refreshToken, user, expiresIn },
  };
}

// ─── Logout ────────────────────────────────────────────────────────────

export async function logout(): Promise<{ success: boolean; message: string }> {
  // ── API real ──
  if (isApiModeEnabled()) {
    try {
      await apiLogout();
    } catch {
      // Log pero no fallar — de todos modos limpiamos la sesión local
      console.warn('Error al hacer logout en el backend');
    }
  } else {
    await delay(300);
  }

  // Limpiar localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_data');

  return { success: true, message: 'Sesión cerrada exitosamente' };
}

// ─── Obtener usuario actual ────────────────────────────────────────────

export function getCurrentUser(): User | null {
  // Intentar desde localStorage primero (funciona en ambos modos)
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      return JSON.parse(userData) as User;
    } catch {
      // datos corruptos
    }
  }

  // Fallback para modo mock (compatibilidad con código anterior)
  if (!isApiModeEnabled()) {
    const userId = localStorage.getItem('user_id');
    if (!userId) return null;

    // Intentar cargar del módulo mock síncronamente
    // (esto solo funciona si el módulo ya fue importado)
    if (mockUsersModule) {
      const mockUser = mockUsersModule.findUserById(userId);
      if (mockUser) {
        const { password: _, ...userWithoutPassword } = mockUser;
        return {
          id: userWithoutPassword.id,
          email: userWithoutPassword.email,
          nombre: userWithoutPassword.nombre,
          apellido: userWithoutPassword.apellido,
          rol: userWithoutPassword.rol,
          ie: (userWithoutPassword as any).ie || null,
          foto: (userWithoutPassword as any).foto || null,
          activo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }
  }

  return null;
}

/**
 * Obtener usuario actual desde la API (async).
 * Útil al recargar la página con token en localStorage.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  if (!isApiModeEnabled()) {
    // En modo mock, usar la lógica síncrona
    if (!mockUsersModule) {
      await getMockUsers();
    }
    return getCurrentUser();
  }

  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const user = await apiGetMe();
    localStorage.setItem('user_data', JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

// ─── Verificar sesión ──────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  return !!token;
}

// ─── Obtener token ─────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// ─── Refresh (para uso interno — el interceptor HTTP lo hace automáticamente) ──

export async function refreshAccessToken(): Promise<AuthResponse> {
  // El refresh real se maneja en http.ts (interceptor).
  // Esta función se mantiene para compatibilidad del mock.

  if (!isApiModeEnabled()) {
    await delay(400);

    const refreshToken = localStorage.getItem('refresh_token');
    const userId = localStorage.getItem('user_id');

    if (!refreshToken || !userId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No hay sesión activa' },
      };
    }

    const { findUserById } = await getMockUsers();
    const mockUser = findUserById(userId);
    if (!mockUser) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' },
      };
    }

    const newToken = generateMockToken(mockUser.id, 3600);
    localStorage.setItem('auth_token', newToken);

    const { password: _, ...userWithoutPassword } = mockUser;

    const user: User = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      nombre: userWithoutPassword.nombre,
      apellido: userWithoutPassword.apellido,
      rol: userWithoutPassword.rol,
      ie: (userWithoutPassword as any).ie || null,
      foto: (userWithoutPassword as any).foto || null,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: {
        token: newToken,
        refreshToken,
        user,
        expiresIn: 3600,
      },
    };
  }

  // Para API real, el interceptor en http.ts maneja el refresh transparentemente.
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Use el interceptor HTTP para refresh' },
  };
}
