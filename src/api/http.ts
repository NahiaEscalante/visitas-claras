import { getApiUrl, isApiModeEnabled } from './config';

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
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  isMultipart?: boolean;
};

/**
 * Wrapper HTTP centralizado para llamadas a la API
 * Maneja errores según el formato documentado en ENDPOINTS_BACKEND.md
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  if (!isApiModeEnabled()) {
    throw new Error('API no configurada. Modo demo/mock activo.');
  }

  const {
    method = 'GET',
    headers = {},
    body,
    isMultipart = false,
  } = options;

  const url = getApiUrl(path);

  // Headers por defecto
  const defaultHeaders: Record<string, string> = {};

  // Agregar token si existe
  const token = localStorage.getItem('auth_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Configurar Content-Type
  if (!isMultipart) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const finalHeaders = { ...defaultHeaders, ...headers };

  // Preparar body
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

    const data = await response.json().catch(() => ({}));

    // Si la respuesta no es exitosa, formatear error
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

    // Respuesta exitosa
    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    // Error de red o parsing
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Error de conexión',
      },
    };
  }
}

