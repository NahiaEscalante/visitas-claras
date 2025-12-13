/**
 * Configuración de la API
 * Si VITE_API_BASE_URL no está definido, la app funciona en modo demo/mock
 */

export function getApiBaseUrl(): string | null {
  return import.meta.env.VITE_API_BASE_URL || null;
}

export function isApiModeEnabled(): boolean {
  return getApiBaseUrl() !== null;
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL no configurada. Modo demo/mock activo.');
  }
  // Asegurar que path empiece con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

