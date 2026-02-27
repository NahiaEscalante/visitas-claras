import { getApiUrl, getApiBaseUrl } from './config';

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

const AUTH_LOGOUT_EVENT = 'auth:logout';

function clearAuthStorage(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_user');
  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
}

/**
 * Intentar renovar el access token con el refresh token.
 * Usa fetch directo para evitar recursión en apiRequest.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    const url = getApiUrl('auth/refresh');
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.data?.token) return null;
    localStorage.setItem('auth_token', data.data.token);
    return data.data.token;
  } catch {
    return null;
  }
}

async function doRequest<T>(
  path: string,
  options: RequestOptions,
  token: string | null
): Promise<{ response: Response; data: unknown }> {
  const { method = 'GET', headers = {}, body, isMultipart = false } = options;
  const url = getApiUrl(path);
  const defaultHeaders: Record<string, string> = {};
  if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;
  if (!isMultipart) defaultHeaders['Content-Type'] = 'application/json';
  const finalHeaders = { ...defaultHeaders, ...headers };
  let finalBody: BodyInit | undefined;
  if (body) {
    finalBody = isMultipart ? (body as FormData) : JSON.stringify(body);
  }
  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: finalBody,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function toApiResponse<T>(response: Response, data: unknown): ApiResponse<T> {
  if (!response.ok) {
    const err = data as { error?: ApiError; message?: string };
    return {
      success: false,
      error: {
        code: err.error?.code || `HTTP_${response.status}`,
        message: err.error?.message || err.message || 'Error en la solicitud',
        details: err.error?.details,
      },
    };
  }
  const ok = data as { data?: T; message?: string };
  return {
    success: true,
    data: ok.data ?? (ok as unknown as T),
    message: ok.message,
  };
}

/**
 * Wrapper HTTP centralizado. Usa prefijo /v1 vía getApiUrl.
 * En 401: intenta refresh, retry una vez; si falla, limpia sesión y dispara auth:logout.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  if (!getApiBaseUrl()) {
    return {
      success: false,
      error: {
        code: 'API_NOT_CONFIGURED',
        message: 'Configura VITE_API_BASE_URL en .env (ej. http://localhost:8000)',
      },
    };
  }

  let token = localStorage.getItem('auth_token');
  let { response, data } = await doRequest<T>(path, options, token);

  if (response.status === 401 && !path.includes('auth/refresh')) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      const retry = await doRequest<T>(path, options, newToken);
      response = retry.response;
      data = retry.data;
    } else {
      clearAuthStorage();
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sesión expirada. Vuelve a iniciar sesión.',
        },
      };
    }
  }

  return toApiResponse<T>(response, data);
}

export { AUTH_LOGOUT_EVENT };
