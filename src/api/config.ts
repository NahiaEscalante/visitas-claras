/**
 * Configuración de la API
 * Requiere VITE_API_BASE_URL (ej. http://localhost:8000). Prefijo /v1 aplicado en getApiUrl.
 */

const API_PREFIX = '/v1';

export function getApiBaseUrl(): string | null {
  return import.meta.env.VITE_API_BASE_URL || null;
}

export function isApiModeEnabled(): boolean {
  return getApiBaseUrl() !== null;
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('Configura VITE_API_BASE_URL en .env (ej. http://localhost:8000)');
  }
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const fullPath = `${API_PREFIX}/${normalizedPath}`;
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}${fullPath}`;
}

