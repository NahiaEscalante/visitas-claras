/**
 * Servicio de autenticación simulado
 * Simula un sistema de autenticación completo con JWT y sesiones
 */

import { User, verifyCredentials, findUserById } from '@/data/mockUsers';

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken: string;
    user: Omit<User, 'password'>;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Simula un delay de red
 */
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Genera un token JWT simulado
 */
function generateMockToken(userId: string, expiresIn: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
  }));
  return `${header}.${payload}.mock-signature`;
}

/**
 * Login simulado
 */
export async function login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResponse> {
  // Simular delay de red
  await delay(800);

  // Validar email
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El email es requerido y debe tener un formato válido',
      },
    };
  }

  // Validar password
  if (!password || password.length < 6) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La contraseña debe tener al menos 6 caracteres',
      },
    };
  }

  // Verificar credenciales
  const user = verifyCredentials(email, password);
  
  if (!user) {
    return {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña incorrectos',
      },
    };
  }

  // Generar tokens
  const expiresIn = rememberMe ? 86400 * 7 : 3600; // 7 días o 1 hora
  const token = generateMockToken(user.id, expiresIn);
  const refreshToken = generateMockToken(user.id, expiresIn * 2);

  // Guardar token en localStorage
  localStorage.setItem('auth_token', token);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user_id', user.id);

  // Retornar respuesta
  const { password: _, ...userWithoutPassword } = user;
  
  return {
    success: true,
    data: {
      token,
      refreshToken,
      user: userWithoutPassword,
      expiresIn,
    },
  };
}

/**
 * Logout simulado
 */
export async function logout(refreshToken?: string): Promise<{ success: boolean; message: string }> {
  await delay(300);

  // Limpiar localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');

  return {
    success: true,
    message: 'Sesión cerrada exitosamente',
  };
}

/**
 * Obtener usuario actual desde el token
 */
export function getCurrentUser(): Omit<User, 'password'> | null {
  const userId = localStorage.getItem('user_id');
  if (!userId) return null;

  const user = findUserById(userId);
  if (!user) return null;

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Verificar si hay una sesión activa
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  const userId = localStorage.getItem('user_id');
  return !!(token && userId);
}

/**
 * Obtener token actual
 */
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Refresh token simulado
 */
export async function refreshAccessToken(): Promise<AuthResponse> {
  await delay(400);

  const refreshToken = localStorage.getItem('refresh_token');
  const userId = localStorage.getItem('user_id');

  if (!refreshToken || !userId) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No hay sesión activa',
      },
    };
  }

  const user = findUserById(userId);
  if (!user) {
    return {
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      },
    };
  }

  const newToken = generateMockToken(user.id, 3600);
  localStorage.setItem('auth_token', newToken);

  const { password: _, ...userWithoutPassword } = user;

  return {
    success: true,
    data: {
      token: newToken,
      refreshToken,
      user: userWithoutPassword,
      expiresIn: 3600,
    },
  };
}

