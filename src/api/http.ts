/**
 * Cliente HTTP centralizado para llamadas a la API
 *
 * Incluye:
 * - Interceptor 401 → refresh token → retry automático
 * - Soporte para modo mock (si VITE_API_BASE_URL no está definida)
 * - Soporte para respuestas binarias (download de archivos)
 * - Cola de peticiones durante refresh para evitar múltiples refresh simultáneos
 */

import { getApiUrl, isApiModeEnabled } from './config';

// ─── Tipos ─────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  isMultipart?: boolean;
  /** Si true, la respuesta se trata como binario (blob), no JSON */
  isBinary?: boolean;
  /** Si true, no se intenta refresh al recibir 401 (ej: auth/login, auth/refresh) */
  skipAuth?: boolean;
};

// ─── Estado de refresh ─────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Intenta refrescar el access token usando el refresh token almacenado.
 * Retorna true si el refresh fue exitoso, false si falló.
 */
async function attemptTokenRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return false;
  }

  try {
    const baseUrl = getApiUrl('/v1/auth/refresh');
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.success && data.data) {
      // Persistir nuevos tokens inmediatamente
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('refresh_token', data.data.refreshToken);
      // Actualizar datos del usuario si vienen
      if (data.data.user) {
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
      }
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Coordina el refresh: si ya hay un refresh en curso, espera a que termine
 * en vez de lanzar otro.
 */
async function coordinatedRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = attemptTokenRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Limpia la sesión y dispara un evento de logout para que el contexto lo detecte.
 */
function clearSession(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_data');
  // Disparar evento para que AppContext detecte el cambio
  window.dispatchEvent(new Event('auth:logout'));
}

// ─── apiRequest ────────────────────────────────────────────────────────

/**
 * Wrapper HTTP centralizado para llamadas a la API.
 *
 * @param path - Ruta del endpoint (sin prefijo /v1, se concatena con base URL)
 * @param options - Opciones de la petición
 * @returns Envelope estándar `{ success, data?, error?, pagination? }`
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  // Si no hay API configurada, retornar error genérico de modo mock
  // (las llamadas mock se manejan en endpoints.ts antes de llegar aquí)
  if (!isApiModeEnabled()) {
    return {
      success: false,
      error: {
        code: 'MOCK_MODE',
        message: 'Modo demo activo. Esta funcionalidad está simulada.',
      },
    };
  }

  const {
    method = 'GET',
    headers = {},
    body,
    isMultipart = false,
    isBinary = false,
    skipAuth = false,
  } = options;

  const url = getApiUrl(path);

  // ── Headers por defecto ──
  const defaultHeaders: Record<string, string> = {};

  // Agregar token si existe
  const token = localStorage.getItem('auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Configurar Content-Type (no setear para multipart, el browser lo maneja)
  if (!isMultipart) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const finalHeaders = { ...defaultHeaders, ...headers };

  // ── Preparar body ──
  let finalBody: BodyInit | undefined;
  if (body) {
    if (isMultipart) {
      finalBody = body as FormData;
    } else {
      finalBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
    });

    // ── 204 No Content ──
    if (response.status === 204) {
      return { success: true } as ApiResponse<T>;
    }

    // ── 401: intentar refresh y retry ──
    if (response.status === 401 && !skipAuth) {
      const refreshed = await coordinatedRefresh();
      if (refreshed) {
        // Reintentar la petición original con el nuevo token
        const newToken = localStorage.getItem('auth_token');
        const retryHeaders = { ...finalHeaders };
        if (newToken) {
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
        }

        const retryResponse = await fetch(url, {
          method,
          headers: retryHeaders,
          body: finalBody,
        });

        if (retryResponse.status === 204) {
          return { success: true } as ApiResponse<T>;
        }

        // Si el retry también falla con 401, limpiar sesión
        if (retryResponse.status === 401) {
          clearSession();
          const retryData = await retryResponse.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: retryData.error?.code || 'UNAUTHENTICATED',
              message: retryData.error?.message || 'No autenticado',
            },
          };
        }

        // Procesar la respuesta del retry normalmente
        return await processResponse<T>(retryResponse, isBinary);
      } else {
        // Refresh falló: limpiar sesión
        clearSession();
        return {
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
          },
        };
      }
    }

    return await processResponse<T>(response, isBinary);
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Error de conexión',
      },
    };
  }
}

/**
 * Procesa la respuesta HTTP y retorna el envelope estándar.
 */
async function processResponse<T>(
  response: Response,
  isBinary: boolean
): Promise<ApiResponse<T>> {
  // ── Respuesta binaria (download de archivos) ──
  if (isBinary) {
    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: 'Error al descargar archivo',
        },
      };
    }
    const blob = await response.blob();
    // Retornar el blob como "data"
    return {
      success: true,
      data: blob as unknown as T,
    };
  }

  // ── Respuesta JSON ──
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: data.error?.code || `HTTP_${response.status}`,
        message: data.error?.message || data.message || 'Error en la solicitud',
        details: data.error?.details,
      },
    };
  }

  // Respuesta exitosa — preservar pagination si existe
  return {
    success: true,
    data: data.data !== undefined ? data.data : data,
    message: data.message,
    pagination: data.pagination,
  };
}
